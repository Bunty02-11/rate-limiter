// src/routes/api.js
import { Router } from "express";
import { logRequest } from "../config/logger.js";

const router = Router();

// Public route — no rate limiting
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Protected route — rate limited
router.get("/data", (req, res) => {
  logRequest({
    ip: req.ip,
    method: req.method,
    path: req.path,
    allowed: true,
    remaining: res.getHeader("X-RateLimit-Remaining") || 0,
    retryAfterMs: 0,
  });
  res.json({
    message: "Here is your data!",
    remaining: res.getHeader("X-RateLimit-Remaining"),
  });
});

// Another protected route
router.get("/profile", (req, res) => {
  logRequest({
    ip: req.ip,
    method: req.method,
    path: req.path,
    allowed: true,
    remaining: res.getHeader("X-RateLimit-Remaining") || 0,
    retryAfterMs: 0,
  });
  res.json({ user: "bunty02-11", plan: "free", requestsRemaining: res.getHeader("X-RateLimit-Remaining") });
});

export default router;