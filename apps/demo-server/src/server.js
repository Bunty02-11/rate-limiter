// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { rateLimiterMiddleware } from "../../../packages/rate-limiter/src/index.js";
import { RedisStore } from "../../../packages/rate-limiter/src/stores/RedisStore.js";
import { logRequest } from "./config/logger.js";
import apiRoutes from "./routes/api.js";
import statsRoutes from "../src/routes/stats.js"

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev")); // logs every request to terminal nicely

// Redis store — shared across all instances
const store = new RedisStore({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

// Rate limiter — applied to all /api routes
app.use(
  "/api",
  rateLimiterMiddleware({
    strategy: "tokenBucket",
    strategyOptions: { capacity: 10, refillRate: 2 }, // 10 burst, 2/sec refill
    store,
    onLimitReached: async (req, res) => {
      // Log blocked requests to MongoDB too
      await logRequest({
        ip: req.ip,
        method: req.method,
        path: req.path,
        allowed: false,
        remaining: 0,
        retryAfterMs: res.getHeader("Retry-After") * 1000 || 0,
      });
      res.status(429).json({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please slow down.",
        retryAfterMs: Number(res.getHeader("Retry-After")) * 1000,
      });
    },
  })
);

// Routes
app.use("/api", apiRoutes);
app.use("/stats", statsRoutes);

// Connect DB and start server
const PORT = process.env.PORT || 4000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Demo server running on http://localhost:${PORT}`));
});