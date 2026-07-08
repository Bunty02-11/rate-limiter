export class TokenBucket {
  constructor({ capacity, refillRate }) {
    if (capacity <= 0 || refillRate <= 0) {
      throw new Error("capacity and refillRate must be positive numbers");
    }
    this.capacity = capacity;
    this.refillRate = refillRate;
  }

  async consume(key, store) {
    const now = Date.now();
    let bucket = await store.getBucket(key);

    if (!bucket) {
      bucket = { tokens: this.capacity, lastRefill: now };
    }

    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    let allowed;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      allowed = true;
    } else {
      allowed = false;
    }

    await store.setBucket(key, bucket);

    const tokensNeeded = Math.max(0, 1 - bucket.tokens);
    const retryAfterMs = Math.ceil((tokensNeeded / this.refillRate) * 1000);

    return {
      allowed,
      remaining: Math.floor(bucket.tokens),
      retryAfterMs,
    };
  }
}