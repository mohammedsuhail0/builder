import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export type RateTier = "auth" | "general" | "ai" | "upload" | "dm";

const RATE_CONFIG: Record<RateTier, { limit: number; windowMs: number }> = {
  auth: { limit: 5, windowMs: 15 * 60_000 },
  general: { limit: 60, windowMs: 60_000 },
  ai: { limit: 10, windowMs: 60_000 },
  upload: { limit: 5, windowMs: 60_000 },
  dm: { limit: 20, windowMs: 60_000 },
};

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function withHeaders(response: NextResponse, origin?: string | null) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; script-src 'self' https:; connect-src 'self' https:;",
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return response;
}

export function okJson(data: unknown, request?: Request, init?: ResponseInit) {
  const origin = request?.headers.get("origin");
  return withHeaders(NextResponse.json(data, init), origin);
}

export function errorJson(
  code: string,
  status: number,
  message = "Something went wrong.",
  request?: Request,
  retryAfterSec?: number,
) {
  const response = withHeaders(
    NextResponse.json({ error: message, code }, { status }),
    request?.headers.get("origin"),
  );
  if (retryAfterSec) {
    response.headers.set("Retry-After", String(retryAfterSec));
  }
  return response;
}

export function preflight(request: Request) {
  return withHeaders(new NextResponse(null, { status: 204 }), request.headers.get("origin"));
}

export function sanitizeString(input: string) {
  return input.replace(/[<>]/g, "").trim();
}

export function sanitizeUnknown(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeUnknown);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeUnknown(v);
    return out;
  }
  return value;
}

export async function enforceRateLimit(
  key: string,
  tier: RateTier,
  request?: Request,
) {
  const cfg = RATE_CONFIG[tier];
  const rl = await checkRateLimit(key, cfg.limit, cfg.windowMs);
  if (!rl.ok) {
    return errorJson(
      "RATE_LIMITED",
      429,
      `Too many requests. Retry in ${rl.retryAfterSec}s.`,
      request,
      rl.retryAfterSec,
    );
  }
  return null;
}

export function validateBody<T>(
  schema: z.ZodType<T>,
  raw: unknown,
): { ok: true; data: T } | { ok: false; response: NextResponse } {
  const sanitized = sanitizeUnknown(raw);
  const parsed = schema.safeParse(sanitized);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request body.", code: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: parsed.data };
}

