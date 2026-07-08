# 🚦 Smart Rate Limiter

A **production-grade, distributed rate limiter** built from scratch with the MERN stack — no third-party rate limiting libraries used. Implements the **Token Bucket algorithm** with pluggable storage backends (Memory / Redis) and a live monitoring dashboard.

> Built to showcase distributed systems knowledge, clean architecture, and real-world API design patterns.

---

## 🌐 Live Demo
- **Dashboard:** coming soon
- **API:** coming soon

---

## ✨ Features

- ⚙️ **Token Bucket Algorithm** — allows bursting while enforcing steady average rate
- 🔌 **Pluggable Strategy Pattern** — swap algorithms (Token Bucket → Sliding Window) without changing any other code
- 🗄️ **Dual Store Support** — MemoryStore for dev, RedisStore for production (distributed, multi-instance safe)
- 🛡️ **Express Middleware** — drop into any Express app with a single `app.use()`
- 📊 **Live Dashboard** — React app showing real-time request feed, token bucket visualization, requests over time chart
- 🗃️ **MongoDB Logging** — every request (allowed or blocked) logged for analytics
- 📬 **Standard Headers** — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- 🔓 **Fail-Open Design** — Redis blip? Requests pass through, API stays up
- ⏱️ **Lazy Refill** — no background timers, refill calculated mathematically on each request
ratelimiter/
├── packages/
│   └── rate-limiter/           # Core package (algorithm + stores + middleware)
│       ├── src/
│       │   ├── strategies/
│       │   │   └── TokenBucket.js     # Token Bucket algorithm
│       │   ├── stores/
│       │   │   ├── MemoryStore.js     # In-memory (dev/testing)
│       │   │   └── RedisStore.js      # Redis (production, distributed)
│       │   ├── RateLimiter.js         # Core class — wires strategy + store
│       │   ├── middleware.js          # Express middleware wrapper
│       │   └── index.js              # Package entry point
│       └── test/
│           ├── tokenBucket.test.js    # Memory store tests
│           └── redisStore.test.js     # Redis store tests
│
└── apps/
├── demo-server/            # Express API using the middleware
│   ├── src/
│   │   ├── models/
│   │   │   └── RequestLog.js      # MongoDB schema for request logs
│   │   ├── routes/
│   │   │   ├── api.js             # Protected API routes
│   │   │   └── stats.js           # Dashboard stats endpoints
│   │   └── server.js
│   └── .env.example
│
└── dashboard/              # React monitoring dashboard
└── src/
└── App.jsx                # Live feed, charts, token bucket visual

---

## 🧠 How Token Bucket Works

Each client gets a virtual "bucket" holding up to `capacity` tokens. Tokens refill at `refillRate` per second. Each request consumes 1 token. Empty bucket = request rejected.

**Key insight — lazy refill (no background timers):**
```js
const elapsedSeconds = (now - bucket.lastRefill) / 1000;
const tokensToAdd = elapsedSeconds * refillRate;
bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
```
Refill is calculated mathematically on each request based on elapsed time.
This works correctly across multiple server instances with zero synchronization.

---

## 🔌 Design Patterns Used

| Pattern | Where | Why |
|---|---|---|
| **Strategy** | `RateLimiter` + strategies | Swap Token Bucket → Sliding Window without touching other code |
| **Dependency Injection** | `TokenBucket.consume(key, store)` | Store is injected, not hardcoded — makes unit testing clean |
| **Middleware** | `rateLimiterMiddleware()` | Drop into any Express app with `app.use()` |
| **Fail-Open** | `middleware.js` catch block | Redis error → request passes through, API stays alive |

---

## 📡 API Reference

### Protected Routes (rate limited)

GET /api/data
GET /api/profile
### Response Headers
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
Retry-After: 2        (only on 429 responses)
### Rate Limited Response (429)
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please slow down.",
  "retryAfterMs": 2000
}
```

### Dashboard Stats Routes
GET /stats/summary       → { total, allowed, blocked }
GET /stats/recent        → last 20 request logs
GET /stats/over-time     → requests grouped by minute (last 60 min)
GET /stats/top-blocked   → top 5 blocked IPs
---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Redis (Redis Cloud free tier works)
- MongoDB (MongoDB Atlas free tier works)

### 1. Clone the repo
```bash
git clone https://github.com/bunty02-11/smart-rate-limiter.git
cd smart-rate-limiter
```

### 2. Set up the core package
```bash
cd packages/rate-limiter
npm install
```

### 3. Set up the demo server
```bash
cd apps/demo-server
npm install
```

Create `apps/demo-server/.env`:
PORT=4000
MONGO_URI=your_mongodb_atlas_uri
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
### 4. Set up the dashboard
```bash
cd apps/dashboard
npm install
npm run dev
```

### 5. Run the demo server
```bash
cd apps/demo-server
npm run dev
```

Visit **http://localhost:5173** for the dashboard.
Hit **http://localhost:4000/api/data** to fire requests.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Algorithm | Custom Token Bucket (vanilla JS) |
| Middleware | Express.js |
| Live State | Redis (Redis Cloud) |
| Historical Logs | MongoDB (Atlas) |
| Dashboard | React + Recharts + Vite |
| Language | JavaScript (ES Modules) |

---

## 📈 What I'd Add Next

- [ ] Sliding Window Counter as a second pluggable strategy
- [ ] Redis Lua scripts for atomic GET+SET (eliminates race condition under extreme concurrency)
- [ ] Per-route configuration (stricter limits on `/login`)
- [ ] Per-user limiting (key by `userId` for authenticated routes)
- [ ] Admin API to reset buckets and change limits dynamically
- [ ] Prometheus metrics endpoint for Grafana integration
- [ ] Load test results with k6

---

## 👨‍💻 Author

**Bunty** — [@bunty02-11](https://github.com/bunty02-11)

---

## 📄 License

MIT
How to use it

Create README.md in your root ratelimiter/ folder and paste this in.
Also create apps/demo-server/.env.example (safe to commit, no real secrets):

PORT=4000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ratelimiter
REDIS_HOST=your-redis-host.redis.io
REDIS_PORT=12345
REDIS_PASSWORD=your_password
---

## 🏗️ Architecture
