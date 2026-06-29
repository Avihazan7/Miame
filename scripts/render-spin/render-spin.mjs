#!/usr/bin/env node
// render-spin — turn ONE GLB into a 360° frame set (transparent PNGs).
//
// Pipeline: a tiny static server serves viewer.html (a three.js studio) plus the
// GLB; Playwright drives Chromium to load it, then for each of N evenly-spaced Y
// angles it renders one frame and screenshots the canvas with a transparent
// background. The output frames drop straight into Supabase `vehicle-media`
// (spin360_paths) — the Supabase render transform handles WebP, so PNG is fine.
//
// Usage:
//   node scripts/render-spin/render-spin.mjs --model ./mia-four-x4.glb \
//        --out ./out/mia-four-x4 --frames 36 --size 1600
//
// Flags:
//   --model <path>   GLB/GLTF file to spin            (required)
//   --out <dir>      output directory for frames      (default ./out/spin)
//   --frames <n>     number of frames around 360°     (default 36 → one per 10°)
//   --size <px>      square frame size in pixels       (default 1600)
//
// Prereq (one-time): npm i -D playwright   (Chromium is already on disk in this
// environment — no browser download happens).

import { createServer } from "node:http";
import { readFile, mkdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { dirname, join, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = dirname(fileURLToPath(import.meta.url));
// Resolve the installed `three` package dir (cwd-independent) so the viewer can
// import it locally instead of from a CDN. three's `exports` blocks resolving
// package.json directly, so resolve its main build entry and walk up one level.
const THREE_DIR = resolve(dirname(createRequire(import.meta.url).resolve("three")), "..");

function parseArgs(argv) {
  const out = { out: "./out/spin", frames: 36, size: 1600 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--model") out.model = argv[++i];
    else if (a === "--out") out.out = argv[++i];
    else if (a === "--frames") out.frames = Number(argv[++i]);
    else if (a === "--size") out.size = Number(argv[++i]);
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

const HELP = `render-spin — GLB → 360° transparent PNG frames

  node scripts/render-spin/render-spin.mjs --model <file.glb> [options]

  --model <path>   GLB/GLTF to spin            (required)
  --out <dir>      output directory            (default ./out/spin)
  --frames <n>     frames around 360°          (default 36)
  --size <px>      square frame size           (default 1600)
`;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.model) {
    process.stdout.write(HELP);
    process.exit(args.model ? 0 : 1);
  }

  const modelPath = resolve(args.model);
  await stat(modelPath).catch(() => {
    throw new Error(`model not found: ${modelPath}`);
  });
  const outDir = resolve(args.out);
  await mkdir(outDir, { recursive: true });

  const frames = Math.max(1, Math.floor(args.frames));
  const size = Math.max(64, Math.floor(args.size));

  // Static server: viewer.html + assets from HERE, and the GLB mounted at /model.glb.
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/model.glb") {
        res.writeHead(200, { "content-type": MIME[".glb"] });
        createReadStream(modelPath).pipe(res);
        return;
      }
      // Serve the local `three` package under /three/* (build + examples/jsm).
      if (url.pathname.startsWith("/three/")) {
        const tfile = join(THREE_DIR, url.pathname.slice("/three/".length));
        if (!tfile.startsWith(THREE_DIR)) {
          res.writeHead(403).end("forbidden");
          return;
        }
        const tbody = await readFile(tfile);
        res.writeHead(200, { "content-type": MIME[extname(tfile)] || "application/octet-stream" });
        res.end(tbody);
        return;
      }
      const rel = url.pathname === "/" ? "/viewer.html" : url.pathname;
      const file = join(HERE, rel.replace(/^\/+/, ""));
      if (!file.startsWith(HERE)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, { "content-type": MIME[extname(file)] || "application/octet-stream" });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  // Playwright is an optional, dev-only dep — import lazily so --help works without it.
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    server.close();
    throw new Error("playwright is not installed. Run:  npm i -D playwright");
  }

  // Prefer an explicit/pre-installed Chromium over Playwright's bundled build —
  // CI images often ship the browser separately (e.g. /opt/pw-browsers/chromium).
  const { existsSync } = await import("node:fs");
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    process.env.CHROME_PATH,
    "/opt/pw-browsers/chromium",
  ].filter(Boolean);
  const executablePath = candidates.find((p) => existsSync(p));

  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: size, height: size } });

  const viewerUrl = `${base}/viewer.html?model=/model.glb&size=${size}`;
  await page.goto(viewerUrl, { waitUntil: "load" });

  // Wait until the GLB is loaded and framed (or surface a load error).
  await page.waitForFunction(() => window.__ready === true || window.__error, null, {
    timeout: 60_000,
  });
  const loadErr = await page.evaluate(() => window.__error);
  if (loadErr) {
    await browser.close();
    server.close();
    throw new Error(`viewer failed to load model: ${loadErr}`);
  }

  const canvas = await page.$("#c");
  const pad = String(frames).length;

  for (let i = 0; i < frames; i += 1) {
    const deg = (i * 360) / frames;
    await page.evaluate((d) => window.__renderAngle(d), deg);
    const name = `${String(i).padStart(pad, "0")}.png`;
    await canvas.screenshot({ path: join(outDir, name), omitBackground: true });
    process.stdout.write(`  frame ${i + 1}/${frames}  (${deg.toFixed(1)}°)\r`);
  }

  await browser.close();
  server.close();

  process.stdout.write("\n");
  process.stdout.write(`✓ ${frames} frames → ${outDir}\n`);
  process.stdout.write("Next: upload to Supabase bucket 'vehicle-media' and set spin360_paths.\n");
}

main().catch((err) => {
  process.stderr.write(`\nrender-spin failed: ${err.message}\n`);
  process.exit(1);
});
