// scripts/verify-m21a.mjs — Stage A acceptance gate v2 (M21-A).
// Drives a running server (BASE_URL, default :3000) and asserts the Stage-A budget.
// NOTE: the video-size check (A8) is environmentally blocked in this sandbox
// (no ffmpeg); it is expected to fail until the video is recompressed locally.
const BASE = process.env.BASE_URL || "http://localhost:3000";
const ROUTES = [
  "/", "/mia-four", "/eligibility", "/partners", "/rent-eilat",
  "/klnoit-4-galgalim", "/klnoit-mitkapelet", "/klnoit-shetach",
  "/legal/privacy", "/legal/terms", "/legal/accessibility",
];
const IMG_BUDGET_KB = 900, MAX_RASTER_KB = 200, MAX_VIDEO_MB = 9.5;
let fails = 0;
const fail = (m) => { fails++; console.error("✗", m); };
const ok = (m) => console.log("✓", m);

const html = {};
for (const r of ROUTES) html[r] = await (await fetch(BASE + r)).text();

// 1) single h1
for (const r of ROUTES) {
  const n = (html[r].match(/<h1[\s>]/g) || []).length;
  n === 1 ? ok(`h1==1 ${r}`) : fail(`h1==${n} ${r}`);
}
// 2) Title no duplication
for (const r of ROUTES) {
  const t = (html[r].match(/<title[^>]*>(.*?)<\/title>/s) || [])[1] || "";
  /MiaMe\s*\|\s*MiaMe/.test(t) ? fail(`dup title ${r}`) : ok(`title ${r}`);
}
// 3) emoji charter
for (const r of ROUTES) {
  const h = html[r];
  if (h.includes("💰")) fail(`💰 in ${r}`);
  let i = -1;
  while ((i = h.indexOf("🎯", i + 1)) !== -1)
    if (!h.slice(Math.max(0, i - 120), i + 120).includes("Leasing.co.il"))
      fail(`illegal 🎯 in ${r} @${i}`);
}
ok("emoji charter");
// 4) theme-color media pair + manifest (v2)
const metas = [...html["/"].matchAll(/name="theme-color"[^>]*/g)].map((m) => m[0]);
const light = metas.find((m) => /light/.test(m)), dark = metas.find((m) => /dark/.test(m));
const manifest = await (await fetch(BASE + "/manifest.webmanifest")).json();
(light?.includes("#FDFBF6") && dark?.includes("#04121F") && manifest.theme_color === "#04121F")
  ? ok("theme-color Pearl/Abyss + manifest")
  : fail(`theme-color: light=${light} dark=${dark} manifest=${manifest.theme_color}`);
// 5) JSON-LD: FAQPage + >=3 Product, answers = visible text
const lds = [...html["/"].matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));
const nodes = lds.flatMap((d) => d["@graph"] || [d]);
const faq = nodes.find((n) => n["@type"] === "FAQPage");
const prods = nodes.filter((n) => n["@type"] === "Product");
faq ? ok("FAQPage") : fail("FAQPage missing");
prods.length >= 3 && prods.every((p) => p.offers?.price) ? ok(`Products ${prods.length}`) : fail("Product/Offer incomplete");
const visible = html["/"].replace(/<script[\s\S]*?<\/script>/g, "");
for (const q of faq?.mainEntity || [])
  visible.includes((q.acceptedAnswer?.text || "").slice(0, 40))
    ? ok(`FAQ mirrors UI: ${q.name}`) : fail(`FAQ text not on page: ${q.name}`);
// 6) image budget
const urls = new Set([...html["/"].matchAll(/(?:src|href|imageSrcSet)="([^"]*\.(?:png|webp|jpg|jpeg|avif)[^"\s]*)/g)].map((m) => m[1].split(" ")[0]).filter((u) => u.startsWith("/")));
let total = 0;
for (const u of urls) {
  const kb = (await (await fetch(BASE + u)).arrayBuffer()).byteLength / 1024;
  total += kb;
  if (kb > MAX_RASTER_KB) fail(`raster ${u}=${kb | 0}KB`);
}
total <= IMG_BUDGET_KB ? ok(`img total ${total | 0}KB`) : fail(`img total ${total | 0}KB > ${IMG_BUDGET_KB}`);
// 7) video
const v = await fetch(BASE + "/videos/miame-freedom-moment.mp4", { headers: { Range: "bytes=0-0" } });
const len = +(v.headers.get("content-range")?.split("/")[1] || v.headers.get("content-length") || 0);
len / 1048576 <= MAX_VIDEO_MB ? ok(`video ${(len / 1048576).toFixed(1)}MB`) : fail(`video ${(len / 1048576).toFixed(1)}MB (A8 — needs local ffmpeg recompress)`);
// 8) preload <= 2
const pre = (html["/"].match(/rel="preload" as="image"/g) || []).length;
pre <= 2 ? ok(`image preloads ${pre}`) : fail(`preloads ${pre}`);
// 9) Ultra Color tokens present in CSS build (v2)
const cssLinks = [...html["/"].matchAll(/href="(\/_next\/static\/css\/[^"]+)"/g)].map((m) => m[1]);
let css = "";
for (const c of cssLinks) css += await (await fetch(BASE + c)).text();
["--ink-teal", "--bg-abyss", "--gold-bright", "--mint-zero"].every((t) => css.includes(t))
  ? ok("Ultra Color tokens in build") : fail("tokens missing in CSS build");
/color:\s*#(18e0bd|0ce5dd)/i.test(css)
  ? fail("bright teal used as text color") : ok("no bright-teal text");

console.log(fails ? `\nFAILED (${fails})` : "\nALL GREEN — M21-A v2 gate passed");
process.exit(fails ? 1 : 0);
