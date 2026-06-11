import mongoose from "mongoose";

const auditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  event: { type: String, required: true },
  ip: String,
  userAgent: String,
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
});

const Audit = mongoose.model("Audit", auditSchema);
export default Audit;
