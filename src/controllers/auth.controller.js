import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import crypto from "node:crypto";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyToken,
} from "../services/token.service.js";
import { sendVerificationEmail } from "../services/email.service.js";

// login controller function
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // checking if the body contains the required credentials or not
    if (!email || !password)
      return res.status(400).json({ message: "invalid credentials" });

    // finding the user in the database
    let normalizedEmail = email.toLowerCase().trim(); // normalizing the email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "invalid credentials" });

    // comparing the password with the hashed password in database
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "invalid credentials" });

    // checking if email is verified
    if (!user.emailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox.",
      });
    }

    const accessToken = generateAccessToken(user); // generating the access token
    const refreshToken = generateRefreshToken(); // generating the refresh token

    const tokenHash = await hashToken(refreshToken); // hashing the refresh token and storing it in tokenHash
    
    // creating session for the user
    await Session.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // total of 7 days in milliseconds
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    });

    // setting the access token in the cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === "production", // for production setting it to true
    });

    // setting the refresh token in the cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production", // for production setting it to true
    });

    // sending the response to the client
    return res.status(200).json({ message: "Successfully logged in" });
  } catch (err) {
    console.error("error occured in the login controller", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// register controller function
export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    // checking if the body contains the required credentials or not & returning if not
    if (!email || !password)
      return res.status(400).json({ message: "invalid credentials" });

    // checking if the user already exits in the database or not & returning if does
    let normalizedEmail = email.toLowerCase().trim(); // normalizing the email
    const user = await User.findOne({ email: normalizedEmail });
    if (user) return res.status(400).json({ message: "user already exists" });

    // generating verification token
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // creating new user from the above credentials in the database
    const newUser = await User.create({
      email: normalizedEmail,
      password,
      role: "user",
      emailVerificationToken: emailVerificationToken,
      emailVerificationTokenExpiry: tokenExpiry,
      emailVerified: false,
    });

    // building verification link
    const baseURL = process.env.CLIENT_URL; // using client_url from the env variables
    if (!baseURL) {
      console.error(
        "CLIENT_URL is not defined or loaded properly from the environment variables",
      );
      return res
        .status(500)
        .json({ message: "Internal server error: CLIENT_URL not configured" });
    }
    const verificationLink = `${baseURL}/api/v1/auth/verify-email?token=${emailVerificationToken}`; // creating the verification link to be sent in the email

    // sending verification email
    await sendVerificationEmail(newUser.email, verificationLink);

    // sending the response to the client
    return res.status(201).json({
      message:
        "Registration successful! Please check your email to verify your account.",
      userId: newUser._id,
    });
  } catch (err) {
    console.error("error occured in the register controller", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// verify email controller function
export const verifyEmail = async (req, res) => {
  try {
    // getting token from query params
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    // finding user by token and checking if token is not expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationTokenExpiry: { $gt: new Date() }, // token must be in future
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token",
      });
    }

    // marking email as verified and clearing token
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    // sending success response
    return res.status(200).json({
      message: "Email verified successfully! You can now login.",
    });
  } catch (err) {
    console.error("error in verifyEmail controller", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// refresh token controller function
export const refreshToken = async (req, res) => {
  try {
    // checking the credentials are valid or not and returning if not valid
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "unauthorized" });
    // finding active sessions and matching refresh token against stored hash
    const sessions = await Session.find({
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    let matchedSession = null;
    for (const session of sessions) {
      const isMatch = await verifyToken(refreshToken, session.tokenHash);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }

    if (!matchedSession) {
      return res.status(401).json({ message: "unauthorized" });
    }

    // loading user and issuing new access token
    const user = await User.findById(matchedSession.user);
    if (!user) return res.status(401).json({ message: "unauthorized" });

    const newAccessToken = generateAccessToken(user);

    // setting the new access token in the cookies
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      secure: process.env.NODE_ENV === "production", // for production setting it to true
    });

    return res
      .status(200)
      .json({ message: "access token refreshed successfully" });
  } catch (err) {
    console.error("error in refresh token controller", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// logout controller function
export const logout = async (req, res) => {
  try {
    // getting the credentials and checking if they are valid or not
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ message: "unauthorized" });

    // finding all active sessions and matching refresh token
    const sessions = await Session.find({ revoked: false });

    // finding the matched sessions
    let matchedSession = null;
    for (const session of sessions) {
      const isMatch = await verifyToken(refreshToken, session.tokenHash);
      if (isMatch) {
        matchedSession = session;
        break;
      }
    }
    if (!matchedSession) {
      return res.status(401).json({ message: "unauthorized" });
    }

    // revoking the matched session
    matchedSession.revoked = true;
    await matchedSession.save();

    // clearing the access and refresh token cookie
    res.clearCookie("accessToken", "", { httpOnly: true, maxAge: 0 });
    res.clearCookie("refreshToken", "", { httpOnly: true, maxAge: 0 });
    return res.status(200).json({ message: "logged out successfully" });
  } catch (err) {
    console.error("error in logout controller", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
