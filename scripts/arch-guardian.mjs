#!/usr/bin/env node
// Architecture Guardian — MiaMe.co.il (מבית Leasing.co.il)
// מאמת תקינות ארכיטקטורה מקצה-לקצה. דטרמיניסטי בלבד (אין LLM).
// 4 תחומים: code (typecheck/lint/build + אינווריאנטים) · live (זמינות) · seo (SEO/GEO/AEO) · secrets/deps.
// פלט: arch-guardian-report.json + arch-guardian-summary.md. exit!=0 אם יש כשל קריטי/actionable.

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const DOMAINS = (process.env.GUARDIAN_DOMAINS || 'code,live,seo,secrets')
  .split(',').map((s) => s.trim()).filter(Boolean);

const MIAME_SITE = (process.env.MIAME_SITE || 'https://miame.co.il').replace(/\/$/, '');
const LEASING_SITE = (process.env.LEASING_SITE || 'https://leasing.co.il').replace(/\/$/, '');
const SKIP_HEAVY = process.env.GUARDIAN_SKIP_HEAVY === '1';

const results = [];
function record(r) { results.push({ severity: 'medium', status: 'pass', ...r }); }

function sh(cmd, timeoutMs = 15 * 60 * 1000) {
  try {
    const out = execSync(cmd, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: timeoutMs });
    return { ok: true, out, stdout: out };
  } catch (e) {
    // stdout is kept separate: commands like `npm audit --json` exit non-zero
    // WITH valid JSON on stdout — consumers that parse must get it clean, not
    // concatenated with stderr/message (which breaks JSON.parse silently).
    return { ok: false, out: `${e.stdout || ''}${e.stderr || ''}${e.message || ''}`.trim(), stdout: String(e.stdout || '') };
  }
}

async function probe(url, { retries = 2, timeout = 12000, wantBody = false } = {}) {
  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const res = await fetch(url, {
        signal: ctrl.signal, redirect: 'follow',
        headers: { 'user-agent': 'MiaMe-Arch-Guardian/1.0 (+architecture-integrity)' },
      });
      clearTimeout(t);
      const body = wantBody ? await res.text() : '';
      return { ok: true, status: res.status, body };
    } catch (e) {
      if (i === retries) return { ok: false, status: 0, error: String(e) };
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

const fileHas = (path, ...needles) => {
  if (!existsSync(resolve(ROOT, path))) return false;
  const txt = readFileSync(resolve(ROOT, path), 'utf8');
  return needles.some((n) => txt.includes(n));
};

// ───────────────────────── CODE ─────────────────────────
function checkCode() {
  if (!SKIP_HEAVY) {
    for (const [id, title, cmd, sev] of [
      ['code.typecheck', 'TypeScript typecheck', 'npm run typecheck', 'critical'],
      ['code.lint', 'Lint (next lint)', 'npm run lint', 'medium'],
      ['code.build', 'Build (next build)', 'npm run build', 'high'],
    ]) {
      const r = sh(cmd);
      record({ domain: 'code', id, title, severity: sev,
        status: r.ok ? 'pass' : 'fail',
        detail: r.ok ? 'עבר' : r.out.split('\n').slice(-25).join('\n'),
        autofix: r.ok ? undefined : cmd });
    }
  } else {
    record({ domain: 'code', id: 'code.gates', title: 'Code gates (typecheck/lint/build)', status: 'skip', severity: 'critical', detail: 'GUARDIAN_SKIP_HEAVY=1' });
  }

  // אינווריאנטים ארכיטקטוניים — 3 העמודים (מכירה · השכרה · שירות) + משפך WhatsApp + CRM + מוח
  const invariants = [
    ['code.inv.layout', 'layout + SEO metadata', 'app/layout.tsx', 'high'],
    ['code.inv.page', 'דף נחיתה ראשי', 'app/page.tsx', 'high'],
    ['code.inv.configurator', 'Configurator (סימולטור תשלומים — ליבה)', 'components/Configurator.tsx', 'high'],
    ['code.inv.finance', 'מנוע מימון (lib/finance)', 'lib/finance.ts', 'high'],
    ['code.inv.whatsapp', 'משפך WhatsApp (lib/whatsapp)', 'lib/whatsapp.ts', 'high'],
    ['code.inv.supabase', 'חיבור Supabase (CRM)', 'lib/supabase.ts', 'high'],
    ['code.inv.lead', 'לכידת ליד (api/lead)', 'app/api/lead/route.ts', 'critical'],
    ['code.inv.brain', 'המוח / Deal Assistant (brain)', 'brain/index.ts', 'medium'],
    ['code.inv.schema', 'Supabase schema (CRM + RLS)', 'supabase/schema.sql', 'high'],
  ];
  for (const [id, title, file, sev] of invariants) {
    const ok = existsSync(resolve(ROOT, file));
    record({ domain: 'code', id, title, file, severity: sev, status: ok ? 'pass' : 'fail',
      detail: ok ? 'קיים' : `קובץ מקור-האמת חסר: ${file}` });
  }

  // אינווריאנט ציות (תיקון 40 / GDPR): RLS בסכמת Supabase
  record({ domain: 'code', id: 'code.inv.rls', title: 'RLS מוגדר ב-supabase/schema.sql (בידוד + ציות)', file: 'supabase/schema.sql',
    severity: 'high', status: fileHas('supabase/schema.sql', 'row level security', 'ROW LEVEL SECURITY', 'enable row', 'policy', 'POLICY') ? 'pass' : 'warn',
    detail: 'מדיניות RLS להגנת נתוני לידים' });
}

// ───────────────────────── LIVE ─────────────────────────
async function checkLive() {
  for (const [id, title, url, sev] of [
    ['live.miame.home', 'MiaMe.co.il דף הבית', `${MIAME_SITE}/`, 'critical'],
    ['live.leasing.home', 'Leasing.co.il (אתר-אם)', `${LEASING_SITE}/`, 'high'],
  ]) {
    const r = await probe(url);
    const up = r.ok && r.status >= 200 && r.status < 400;
    record({ domain: 'live', id, title, severity: sev, status: up ? 'pass' : 'fail',
      detail: r.ok ? `HTTP ${r.status}` : `אין מענה: ${r.error}` });
  }

  // API פנימי של MiaMe (lead/brain) — בריאות endpoint הלידים
  const lead = await probe(`${MIAME_SITE}/api/lead`, { timeout: 10000 });
  record({ domain: 'live', id: 'live.miame.lead', title: 'MiaMe /api/lead נגיש', severity: 'high',
    status: lead.ok && lead.status > 0 && lead.status < 500 ? 'pass' : 'fail',
    detail: lead.ok ? `HTTP ${lead.status}` : `אין מענה: ${lead.error}` });
}

// ───────────────────────── SEO / GEO / AEO ─────────────────────────
async function checkSeo() {
  for (const [host, site] of [['miame', MIAME_SITE], ['leasing', LEASING_SITE]]) {
    const sm = await probe(`${site}/sitemap.xml`, { wantBody: true });
    record({ domain: 'seo', id: `seo.${host}.sitemap`, title: `${host}: sitemap.xml`, severity: 'high',
      status: sm.ok && sm.status === 200 && /<urlset|<sitemapindex/.test(sm.body) ? 'pass' : 'fail',
      detail: sm.ok ? `HTTP ${sm.status}` : 'לא נגיש' });

    const rb = await probe(`${site}/robots.txt`, { wantBody: true });
    record({ domain: 'seo', id: `seo.${host}.robots`, title: `${host}: robots.txt + Sitemap`, severity: 'medium',
      status: rb.ok && rb.status === 200 ? (/sitemap:/i.test(rb.body) ? 'pass' : 'warn') : 'fail',
      detail: rb.ok ? (/sitemap:/i.test(rb.body) ? 'יש Sitemap directive' : 'חסר Sitemap: ב-robots') : 'לא נגיש' });

    const home = await probe(`${site}/`, { wantBody: true });
    record({ domain: 'seo', id: `seo.${host}.jsonld`, title: `${host}: schema JSON-LD`, severity: 'high',
      status: home.ok && /application\/ld\+json/.test(home.body) ? 'pass' : 'fail',
      detail: home.ok ? (/application\/ld\+json/.test(home.body) ? 'נמצא JSON-LD' : 'אין structured data') : 'לא נגיש' });

    const llms = await probe(`${site}/llms.txt`);
    record({ domain: 'seo', id: `seo.${host}.llms`, title: `${host}: llms.txt (GEO/AEO)`, severity: 'medium',
      status: llms.ok && llms.status === 200 ? 'pass' : 'warn',
      detail: llms.ok && llms.status === 200 ? 'קיים' : 'מומלץ להוסיף llms.txt למנועי-תשובות AI' });
  }
}

// ───────────────────────── SECRETS / DEPS ─────────────────────────
function checkSecrets() {
  if (existsSync(resolve(ROOT, '.env.example'))) {
    const keys = readFileSync(resolve(ROOT, '.env.example'), 'utf8')
      .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => l.split('=')[0].trim());
    record({ domain: 'secrets', id: 'secrets.contract', title: 'חוזה env (.env.example)', severity: 'low',
      status: 'pass', detail: `${keys.length} מפתחות מתועדים` });
  }

  const tracked = sh('git ls-files', 30000);
  const leaked = tracked.ok ? tracked.out.split('\n').filter((f) => /(^|\/)\.env($|\.[^e])/.test(f) && !f.endsWith('.env.example')) : [];
  record({ domain: 'secrets', id: 'secrets.no-env', title: 'אין קובץ .env ב-git', severity: 'critical',
    status: leaked.length ? 'fail' : 'pass',
    detail: leaked.length ? `סודות עלולים לדלוף: ${leaked.join(', ')}` : 'נקי' });

  // Parse stdout ONLY: on vulnerabilities npm audit exits 1 but still emits
  // valid JSON to stdout. Parsing the concatenated failure blob made this gate
  // un-failable (JSON.parse always threw → permanent warn).
  const audit = sh('npm audit --omit=dev --audit-level=high --json', 4 * 60 * 1000);
  let vulnSummary = 'נקי';
  let vulnStatus = 'pass';
  try {
    const j = JSON.parse((audit.stdout || audit.out || '').trim());
    const v = j.metadata?.vulnerabilities || {};
    const bad = (v.high || 0) + (v.critical || 0);
    if (bad > 0) { vulnStatus = 'fail'; vulnSummary = `${v.critical || 0} critical, ${v.high || 0} high`; }
  } catch { vulnStatus = audit.ok ? 'pass' : 'warn'; vulnSummary = audit.ok ? 'נקי' : 'npm audit לא הצליח לרוץ'; }
  record({ domain: 'secrets', id: 'secrets.audit', title: 'npm audit (prod, high+)', severity: 'high',
    status: vulnStatus, detail: vulnSummary, autofix: vulnStatus === 'fail' ? 'npm audit fix' : undefined });
}

// ───────────────────────── RUN ─────────────────────────
const RAN_AT = process.env.GUARDIAN_RAN_AT || '';
if (DOMAINS.includes('code')) checkCode();
if (DOMAINS.includes('live')) await checkLive();
if (DOMAINS.includes('seo')) await checkSeo();
if (DOMAINS.includes('secrets')) checkSecrets();

const rank = { critical: 0, high: 1, medium: 2, low: 3 };
const fails = results.filter((r) => r.status === 'fail');
const warns = results.filter((r) => r.status === 'warn');
const actionable = fails.filter((r) => r.severity === 'critical' || r.severity === 'high')
  .sort((a, b) => rank[a.severity] - rank[b.severity]);
const criticalFails = fails.filter((r) => r.severity === 'critical');

const report = {
  product: 'MiaMe.co.il',
  ranAt: RAN_AT, domains: DOMAINS,
  totals: { checks: results.length, pass: results.filter((r) => r.status === 'pass').length,
    fail: fails.length, warn: warns.length, skip: results.filter((r) => r.status === 'skip').length },
  ok: criticalFails.length === 0 && actionable.length === 0,
  results,
};
writeFileSync(resolve(ROOT, 'arch-guardian-report.json'), JSON.stringify(report, null, 2));

const icon = (s) => ({ pass: '✅', fail: '❌', warn: '⚠️', skip: '⏭️' }[s] || '•');
let md = `# 🛡️ Architecture Guardian — ${report.product}\n\n`;
md += `${report.ok ? '✅ **ארכיטקטורה תקינה מקצה-לקצה**' : `❌ **${actionable.length} כשלים לטיפול**`}`;
md += ` · ${report.totals.pass}/${report.totals.checks} עברו · ${warns.length} אזהרות\n\n`;
if (actionable.length) {
  md += `## כשלים לטיפול\n\n| חומרה | תחום | בדיקה | פרט |\n|---|---|---|---|\n`;
  for (const r of actionable) md += `| ${r.severity} | ${r.domain} | ${r.title} | ${(r.detail || '').replace(/\n/g, ' ').slice(0, 120)} |\n`;
  md += '\n';
}
md += `## כל הבדיקות\n\n| | תחום | בדיקה | פרט |\n|---|---|---|---|\n`;
for (const r of results) md += `| ${icon(r.status)} | ${r.domain} | ${r.title} | ${(r.detail || '').replace(/\n/g, ' ').slice(0, 100)} |\n`;
writeFileSync(resolve(ROOT, 'arch-guardian-summary.md'), md);

console.log(md);
console.log(report.ok ? '\n✅ Guardian: PASS' : `\n❌ Guardian: ${actionable.length} actionable failure(s)`);
process.exit(criticalFails.length > 0 || actionable.length > 0 ? 1 : 0);
