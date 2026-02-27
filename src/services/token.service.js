import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "node:crypto";

// function to generate access token
function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" },
  );
}

// function to generate refresh token
function generateRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

// function to generate hashed token
async function hashToken(token) {
  return bcrypt.hash(token, 13);
}

// function to verify the token
function verifyToken(token, hashedToken) {
  return bcrypt.compare(token, hashedToken);
}

export { generateAccessToken, generateRefreshToken, hashToken, verifyToken }; // exporting the functions
