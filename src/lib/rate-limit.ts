import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize the Redis client using environment variables automatically
const redis = Redis.fromEnv();

// Policy 1: Standard API Routes (e.g., search, notifications)
// Allows 60 requests per 1 minute window
export const apiLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "@skillswap/api",
});

// Policy 2: Sensitive Auth / Booking Routes (Server Action targets, session bookings)
// Tight restriction to prevent token exhaustion or double-booking loops
export const strictLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@skillswap/strict",
});
