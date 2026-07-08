// test/tokenBucket.test.js
import { RateLimiter } from "../src/RateLimiter.js";

const limiter = new RateLimiter({
  strategy: "tokenBucket",
  strategyOptions: { capacity: 5, refillRate: 1 }, // 5 burst, refills 1/sec
});

async function run() {
  console.log("Firing 7 rapid requests from 'user1' (capacity=5):");
  for (let i = 1; i <= 7; i++) {
    const result = await limiter.check("user1");
    console.log(`Request ${i}:`, result);
  }

  console.log("\nWaiting 2 seconds for refill...");
  await new Promise((r) => setTimeout(r, 2000));

  const after = await limiter.check("user1");
  console.log("After 2s wait:", after);
}

run();