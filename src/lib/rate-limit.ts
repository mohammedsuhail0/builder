import { createClient } from "@/lib/supabase/server";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; retryAfterSec: number }> {
  try {
    const supabase = await createClient();
    
    // We execute the atomic check inside PostgreSQL so rate limits are shared
    // across all dynamically scaled Serverless Lambda instances globally.
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: Math.ceil(windowMs / 1000),
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return checkRateLimitFallback(key, limit, windowMs);
    }

    return {
      ok: Boolean(data[0].ok),
      retryAfterSec: Number(data[0].retry_after_sec),
    };
  } catch {
    // Graceful resilient fallback to local in-memory store if DB is down/offline
    return checkRateLimitFallback(key, limit, windowMs);
  }
}

const buckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimitFallback(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Defensive programming: prune expired records to prevent server memory leaks
  for (const [k, v] of buckets.entries()) {
    if (now > v.resetAt) {
      buckets.delete(k);
    }
  }

  const existing = buckets.get(key);
  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (existing.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  buckets.set(key, existing);
  return { ok: true, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
}


