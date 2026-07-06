// lib/apiGuard.ts — shared guards for the public API routes (M1 hardening).
//
// Every unauthenticated POST route runs three cheap checks before doing any
// work (and before any paid model call): an Origin allowlist (blocks foreign
// sites scripting our endpoints from visitors' browsers), a per-IP fixed-window
// rate limit (in-memory, per serverless instance — a first abuse layer, not a
// global guarantee), and a body-size cap. Server-side only; no secrets.

import { NextResponse } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

/** The visitor's IP as seen through the Vercel proxy (platform-set headers). */
export function clientIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * Fixed-window limiter. Returns true when the request is within budget.
 * A non-positive max disables the bucket (env kill-switch for local dev).
 */
export function withinRate(bucket: string, key: string, max: number, windowMs = 60_000): boolean {
  if (max <= 0) return true;
  const now = Date.now();
  const id = `${bucket}:${key}`;
  let entry = buckets.get(id);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(id, entry);
  }
  entry.count += 1;
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }
  return entry.count <= max;
}

/**
 * Browser cross-origin write gate. No Origin header (same-origin navigation,
 * curl, server-to-server) passes; an Origin matching the request's own Host
 * passes (covers production AND preview deployments); otherwise the origin must
 * be on the allowlist (ALLOWED_ORIGINS env, comma-separated, or the owned
 * domains by default).
 */
export function originAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const selfHost = (req.headers.get("x-forwarded-host") ?? req.headers.get("host"))
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (selfHost && originHost === selfHost) return true;
  const allow = (
    process.env.ALLOWED_ORIGINS ??
    "https://www.miame.co.il,https://miame.co.il,https://www.leasing.co.il,https://leasing.co.il"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV !== "production") {
    allow.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return allow.includes(origin);
}

export interface GuardOptions {
  /** Bucket name (per route). */
  bucket: string;
  /** Max requests per window per IP. Env override wins when set. */
  max: number;
  /** Env var name that overrides `max` (e.g. RATE_LIMIT_LEAD_MAX). */
  maxEnv?: string;
  /** Window length in ms. */
  windowMs?: number;
  /** Max request body size in bytes (checked on the raw text). */
  maxBodyBytes?: number;
}

export interface GuardResult {
  /** Non-null when the request must be rejected — return this response as-is. */
  reject: NextResponse | null;
  /** The parsed JSON body (unknown — validate downstream), null on no-body guards. */
  body: unknown;
}

/**
 * Run the full guard chain (origin → rate → size → JSON parse) and hand back
 * either a rejection response or the parsed body. Generic messages only — no
 * internals leak to the public client.
 */
export async function guardJsonPost(req: Request, opts: GuardOptions): Promise<GuardResult> {
  if (!originAllowed(req)) {
    return { reject: NextResponse.json({ error: "origin not allowed" }, { status: 403 }), body: null };
  }
  const max = opts.maxEnv && process.env[opts.maxEnv] != null ? Number(process.env[opts.maxEnv]) : opts.max;
  if (!withinRate(opts.bucket, clientIp(req), max, opts.windowMs ?? 60_000)) {
    return {
      reject: NextResponse.json({ error: "too many requests" }, { status: 429, headers: { "retry-after": "60" } }),
      body: null,
    };
  }
  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { reject: NextResponse.json({ error: "unreadable body" }, { status: 400 }), body: null };
  }
  if (raw.length > (opts.maxBodyBytes ?? 32_000)) {
    return { reject: NextResponse.json({ error: "payload too large" }, { status: 413 }), body: null };
  }
  try {
    return { reject: null, body: JSON.parse(raw) as unknown };
  } catch {
    return { reject: NextResponse.json({ error: "invalid JSON body" }, { status: 400 }), body: null };
  }
}

/** True when the hidden honeypot field was filled — i.e. a bot submitted the form. */
export function honeypotTripped(body: unknown): boolean {
  const hp = (body as { website?: unknown } | null)?.website;
  return typeof hp === "string" && hp.trim() !== "";
}
