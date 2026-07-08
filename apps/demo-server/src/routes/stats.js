// src/routes/stats.js
import { Router } from "express";
import { RequestLog } from "../models/RequestLog.js";

const router = Router();

// Recent 20 requests for the live feed
router.get("/recent", async (req, res) => {
  try {
    const logs = await RequestLog.find()
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// Requests over time (last 60 minutes, grouped by minute)
router.get("/over-time", async (req, res) => {
  try {
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const logs = await RequestLog.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            minute: { $dateToString: { format: "%H:%M", date: "$timestamp" } },
          },
          total: { $sum: 1 },
          blocked: { $sum: { $cond: [{ $eq: ["$allowed", false] }, 1, 0] } },
          allowed: { $sum: { $cond: [{ $eq: ["$allowed", true] }, 1, 0] } },
        },
      },
      { $sort: { "_id.minute": 1 } },
    ]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Top blocked IPs
router.get("/top-blocked", async (req, res) => {
  try {
    const logs = await RequestLog.aggregate([
      { $match: { allowed: false } },
      { $group: { _id: "$ip", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch top blocked" });
  }
});

// Summary counts
router.get("/summary", async (req, res) => {
  try {
    const total = await RequestLog.countDocuments();
    const blocked = await RequestLog.countDocuments({ allowed: false });
    const allowed = total - blocked;
    res.json({ total, allowed, blocked });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;