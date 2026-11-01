import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { dbConnect } from "@/lib/mongodb";
import { Schema, model, models } from "mongoose";

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashLimiter = upstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "pfm-auth",
    })
  : null;

// Fallback: a TTL-indexed Mongo collection, used only when Upstash env vars
// are not configured. Slightly higher latency, zero extra infra.
const attemptSchema = new Schema(
  {
    key: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now, expires: 60 },
  },
  { versionKey: false }
);
const RateLimitAttempt =
  models.RateLimitAttempt || model("RateLimitAttempt", attemptSchema);

const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * Returns true if the request identified by `key` (e.g. `login:<ip>:<email>`)
 * is allowed to proceed, false if it should be rejected as rate-limited.
 */
export async function checkRateLimit(key: string): Promise<boolean> {
  if (upstashLimiter) {
    const { success } = await upstashLimiter.limit(key);
    return success;
  }

  await dbConnect();
  const count = await RateLimitAttempt.countDocuments({ key });
  if (count >= MAX_ATTEMPTS_PER_WINDOW) return false;
  await RateLimitAttempt.create({ key });
  return true;
}
