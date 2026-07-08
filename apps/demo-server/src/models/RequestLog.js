// src/models/RequestLog.js
import mongoose from "mongoose";

const requestLogSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  allowed: { type: Boolean, required: true },
  remaining: { type: Number, required: true },
  retryAfterMs: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

// Index by IP and timestamp — these are the fields the dashboard will query most
requestLogSchema.index({ ip: 1 });
requestLogSchema.index({ timestamp: -1 });

export const RequestLog = mongoose.model("RequestLog", requestLogSchema);