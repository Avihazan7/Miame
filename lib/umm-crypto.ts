// lib/umm-crypto.ts — the U.M.M cryptography layer (SERVER ONLY).
//
// HMAC + JWT for verifying supplier ("A2A") agents before any Big Five scoring is
// trusted. The `server-only` import makes this module a BUILD ERROR if it is ever
// pulled into a client component — secrets (UMM_HMAC_SECRET / agent tokens) must
// never ride to the browser. The deal score itself is sealed in leasing-api; this
// layer only authenticates WHO is allowed to submit an offer.
import "server-only";

import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";

function requireSecret(name: "UMM_HMAC_SECRET" | "NEXT_PRIVATE_A2A_AGENT_TOKEN"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured — set it in .env.local / Vercel env (server-side only).`);
  }
  return value;
}

/** Deterministic HMAC-SHA256 of a payload, hex-encoded. */
export function hmacSign(payload: string): string {
  return CryptoJS.HmacSHA256(payload, requireSecret("UMM_HMAC_SECRET")).toString(CryptoJS.enc.Hex);
}

/**
 * Constant-time-ish verification of an HMAC signature. CryptoJS has no native
 * timing-safe compare, so we compare word arrays of equal, fixed length (both are
 * SHA-256 digests), which avoids early-exit on the common-prefix path.
 */
export function hmacVerify(payload: string, signatureHex: string): boolean {
  const expected = hmacSign(payload);
  if (expected.length !== signatureHex.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHex.charCodeAt(i);
  }
  return diff === 0;
}

export type AgentClaims = { agentId: string; scope?: string };

/** Mint a short-lived supplier-agent token. */
export function signAgentToken(
  claims: AgentClaims,
  expiresIn: jwt.SignOptions["expiresIn"] = "15m",
): string {
  return jwt.sign(claims, requireSecret("NEXT_PRIVATE_A2A_AGENT_TOKEN"), {
    algorithm: "HS256",
    expiresIn,
  });
}

/** Verify a supplier-agent token; returns the claims or null when invalid/expired. */
export function verifyAgentToken(token: string): AgentClaims | null {
  try {
    const decoded = jwt.verify(token, requireSecret("NEXT_PRIVATE_A2A_AGENT_TOKEN"), {
      algorithms: ["HS256"],
    });
    if (typeof decoded === "object" && decoded && "agentId" in decoded) {
      return decoded as AgentClaims;
    }
    return null;
  } catch {
    return null;
  }
}
