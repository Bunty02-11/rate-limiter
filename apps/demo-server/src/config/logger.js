// src/config/logger.js
import { RequestLog } from "../models/RequestLog.js";

export async function logRequest(data) {
  try {
    await RequestLog.create(data);
  } catch (err) {
    console.error("Failed to log request:", err);
  }
}

export function requestLogger(allowed, remaining, retryAfterMs) {
  return async (req, res, next) => {
    try {
      await RequestLog.create({
        ip: req.ip || req.connection.remoteAddress,
        method: req.method,
        path: req.path,
        allowed,
        remaining,
        retryAfterMs,
      });
    } catch (err) {
      console.error("Failed to log request:", err);
    }
    next();
  };
}