// test/redisStore.test.js
import "dotenv/config";
// console.log("DEBUG:", process.env.REDIS_HOST, process.env.REDIS_PORT, process.env.REDIS_PASSWORD ? "password set" : "password MISSING");
import { RateLimiter } from "../src/RateLimiter.js";
import { RedisStore } from "../src/stores/RedisStore.js";

const store = new RedisStore({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
});

const limiter = new RateLimiter({
  strategy: "tokenBucket",
  strategyOptions: { capacity: 5, refillRate: 1 },
  store,
});

async function run() {
  console.log("Firing 7 rapid requests from 'user1' via Redis:");
  for (let i = 1; i <= 7; i++) {
    const result = await limiter.check("user1");
    console.log(`Request ${i}:`, result);
  }
  process.exit(0);
}

run();