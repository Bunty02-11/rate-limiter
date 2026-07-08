import { RateLimiter } from "./RateLimiter.js";
export function rateLimiterMiddleware(options = {}) {
  const limiter = new RateLimiter(options);

  const keyGenerator =
    options.keyGenerator || ((req) => req.ip || req.connection.remoteAddress);

  return async function (req, res, next) {
    try {
      const key = keyGenerator(req);
      const result = await limiter.check(key);

      res.setHeader("X-RateLimit-Limit", limiter.strategy.capacity);
      res.setHeader("X-RateLimit-Remaining", result.remaining);

      if (!result.allowed) {
        res.setHeader("Retry-After", Math.ceil(result.retryAfterMs / 1000));

        if (options.onLimitReached) {
          return options.onLimitReached(req, res);
        }

        return res.status(429).json({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfterMs: result.retryAfterMs,
        });
      }

      next();
    } catch (err) {
      // Fail open: if the rate limiter itself errors (e.g. Redis blip),
      // don't block legitimate traffic — log it and let the request through.
      console.error("Rate limiter error:", err);
      next();
    }
  };
}