import mongoose from "mongoose";
import bcrypt from "bcrypt";

// defining the user schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpiry: Date,
  },
  { timestamps: true },
);

// creating the pre-hook for hashing the password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // if the password is not modified then move to the next middleware
  this.password = await bcrypt.hash(this.password, 13); // hashing the password

  if (!this.isModified("email")) return next(); // if the email is not modified then move to the next middleware
  this.email = this.email.toLowerCase().trim(); // normalizing the email
  next();
});

// creating the method to compare the password
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password); // comparing the password with the hashed password in database
};

// creating the model from the schema
const User = mongoose.model("User", userSchema);

export default User; // exporting the model
