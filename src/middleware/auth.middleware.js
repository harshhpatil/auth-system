import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// middleware function to authenticate the user
export const authenticate = async (req, res, next) => {
  // getting the access token from the cookies and returning if not present
  const token = req.cookies.accessToken;
  if (!token)
    return res.status(401).json({ message: "unauthorized or invalid token" });

  try {
    // decoding & verifying the token and finding the user in db
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    // returning if the user and token version are not valid
    if (!user || user.tokenVersion !== decoded.tokenVersion)
      return res.status(403).json({ message: "invalid or expired token" });

    // returning the user object
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ message: "invalid or expired token" });
  }
};
