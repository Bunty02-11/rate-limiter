// test/expressSanityCheck.js
import "dotenv/config";
import express from "express";
import { rateLimiterMiddleware } from "../src/index.js";
import { MemoryStore } from "../src/stores/MemoryStore.js";

const app = express();

app.use(
  rateLimiterMiddleware({
    strategy: "tokenBucket",
    strategyOptions: { capacity: 5, refillRate: 1 },
    store: new MemoryStore(),
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Request succeeded!" });
});

app.listen(3000, () => console.log("Test server running on http://localhost:3000"));