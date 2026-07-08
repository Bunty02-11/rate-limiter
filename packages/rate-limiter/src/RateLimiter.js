import { TokenBucket } from "./strategies/TokenBucket.js";
import { MemoryStore } from "./stores/MemoryStore.js";

export class RateLimiter {
  constructor({ strategy = "tokenBucket", strategyOptions, store }) {
    this.store = store || new MemoryStore();

    switch (strategy) {
      case "tokenBucket":
        this.strategy = new TokenBucket(strategyOptions);
        break;
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  async check(key) {
    return this.strategy.consume(key, this.store);
  }
}