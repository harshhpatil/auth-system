import express from "express";
import cookieParser from "cookie-parser";

const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());

// importing the routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

// defining the routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "health check done" });
});

export default app; // exporting the routes