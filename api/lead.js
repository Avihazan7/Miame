// MiaMe · POST /api/lead
// Optional lead persistence. Zero-dependency: talks to Supabase REST directly.
// If SUPABASE env vars are absent the endpoint is a graceful no-op (200) so the
// WhatsApp funnel keeps working. No clearing / payment here (P0 regulatory gate).

const ALLOWED = ["name", "phone", "model", "model_name", "note", "track", "source"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  if (!name || !phone) return res.status(400).json({ error: "name_and_phone_required" });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // No backend configured yet -> funnel still succeeds via WhatsApp on the client.
  if (!url || !key) return res.status(200).json({ stored: false, reason: "backend_disabled" });

  const row = { tenant: "miame", status: "new" };
  for (const k of ALLOWED) if (body[k] != null) row[k] = String(body[k]).slice(0, 600);

  try {
    const r = await fetch(`${url}/rest/v1/leads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error("supabase insert failed", r.status, detail);
      return res.status(502).json({ stored: false, error: "store_failed" });
    }
    return res.status(201).json({ stored: true });
  } catch (err) {
    console.error("lead handler error", err);
    return res.status(500).json({ stored: false, error: "server_error" });
  }
}
