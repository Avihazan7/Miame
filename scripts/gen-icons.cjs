/* eslint-disable */
// One-shot production icon generator. Renders the brand SVG marks into the raster
// files the browser/PWA/iOS actually require (SVG alone is not enough), and packs a
// legacy multi-size favicon.ico. Run manually: `node scripts/gen-icons.cjs`.
//
// No sharp/png-to-ico in this env — we render with the pre-installed Chromium via
// Playwright and hand-pack the ICO container (each entry embeds a full PNG).
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const ICON_SVG = fs.readFileSync(path.join(ROOT, "app", "icon.svg"), "utf8");
const MASK_SVG = fs.readFileSync(path.join(__dirname, "icon-maskable.svg"), "utf8");

// [outfile, size, svg]
const TARGETS = [
  ["app/icon.png", 512, ICON_SVG],
  ["app/apple-icon.png", 180, ICON_SVG],
  ["public/icons/miame-icon-192.png", 192, ICON_SVG],
  ["public/icons/miame-icon-512.png", 512, ICON_SVG],
  ["public/icons/miame-icon-maskable-512.png", 512, MASK_SVG],
];
const ICO_SIZES = [16, 32, 48];

async function renderPng(page, svg, size) {
  const b64 = Buffer.from(svg, "utf8").toString("base64");
  const html =
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<style>*{margin:0;padding:0}html,body{background:transparent}` +
    `img{display:block;width:${size}px;height:${size}px}</style></head>` +
    `<body><img src="data:image/svg+xml;base64,${b64}"></body></html>`;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(html, { waitUntil: "networkidle" });
  const el = await page.$("img");
  return await el.screenshot({ omitBackground: true });
}

// Minimal ICO writer: 6-byte header + 16-byte directory entry per image, each
// pointing at an embedded PNG payload (Vista+ supports PNG-in-ICO).
function packIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const payloads = [];
  images.forEach((img, i) => {
    const b = 16 * i;
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0); // width (0 = 256)
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1); // height
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // color planes
    dir.writeUInt16LE(32, b + 6); // bpp
    dir.writeUInt32LE(img.data.length, b + 8); // size
    dir.writeUInt32LE(offset, b + 12); // offset
    offset += img.data.length;
    payloads.push(img.data);
  });
  return Buffer.concat([header, dir, ...payloads]);
}

(async () => {
  // The bundled browser revision may not match this Playwright build in the
  // sandbox — point straight at the pre-installed Chromium.
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  });
  const page = await browser.newPage({ deviceScaleFactor: 1 });

  for (const [out, size, svg] of TARGETS) {
    const png = await renderPng(page, svg, size);
    const dest = path.join(ROOT, out);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, png);
    console.log(`✓ ${out} (${size}px, ${png.length}B)`);
  }

  const icoImages = [];
  for (const size of ICO_SIZES) {
    const png = await renderPng(page, ICON_SVG, size);
    icoImages.push({ size, data: png });
  }
  const ico = packIco(icoImages);
  fs.writeFileSync(path.join(ROOT, "app", "favicon.ico"), ico);
  console.log(`✓ app/favicon.ico (${ICO_SIZES.join("/")}px, ${ico.length}B)`);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
