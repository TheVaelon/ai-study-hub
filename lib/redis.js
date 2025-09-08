// lib/redis.js
import Redis from "ioredis";

if (!process.env.REDIS_URL) {
  throw new Error("❌ Missing REDIS_URL in environment variables.");
}

// Create a single Redis client instance
const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false, // makes it work smoothly with Redis Cloud SSL
  },
});

export default redis;
