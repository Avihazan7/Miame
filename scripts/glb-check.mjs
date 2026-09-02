#!/usr/bin/env node
/**
 * scripts/glb-check.mjs — the intake gate for a 3D model.
 *
 * WHY THIS EXISTS. The 3D stage is built and wired (components/Product3DViewer.tsx);
 * the only thing between it and a visitor is a genuine GLB at NEXT_PUBLIC_MIA_GLB_URL.
 * Whatever produces that file — the manufacturer's CAD export, an online converter,
 * a scan — the site has no way to know whether it is fit to ship until a visitor
 * opens the tab and it does not appear.
 *
 * scripts/build-glb.mjs validates a GLB, but only the one it has just assembled,
 * with the checks inline at the end of the build. Nothing could inspect a file
 * that arrived from outside. This does, with no dependencies and no network.
 *
 * ── THE TWO FAILURES IT EXISTS FOR, BOTH SILENT ──────────────────────────────
 * 1. AN EXTERNAL URI. A GLB may reference its buffers and textures by URL instead
 *    of embedding them. The loader then fetches those URLs — and this site's CSP
 *    allows `connect-src 'self' https://*.supabase.co` and nothing else. The fetch
 *    is blocked, the model renders untextured or not at all, and NOTHING reports
 *    an error the operator will see. A converter that "worked" in its own preview
 *    is exactly how such a file arrives.
 * 2. A REQUIRED COMPRESSION EXTENSION. Draco and Meshopt make a model far smaller
 *    and are the right answer for the web — but the decoder is a separate WASM
 *    bundle that drei fetches from a third-party CDN by default. Same CSP, same
 *    silent nothing. Such a file is not rejected here; it is reported, because it
 *    is shippable the moment the decoder is self-hosted, and this is the one place
 *    that fact can be stated before the file is deployed rather than after.
 *
 * Usage:  node scripts/glb-check.mjs <file.glb> [--json]
 * Exit:   0 = fit to ship (warnings may be printed) · 1 = rejected · 2 = unusable file
 */
import { readFileSync, statSync } from "node:fs";

// Budgets. Chosen for a product hero loaded on a phone over cellular, not for a
// render farm — and stated here rather than buried in the checks so a decision to
// move one is a visible edit.
const LIMITS = {
  bytesFail: 12 * 1024 * 1024,
  bytesWarn: 6 * 1024 * 1024,
  trisFail: 500_000,
  trisWarn: 200_000,
  /** Above this a texture is not safely supported on every mobile GPU. See the
   *  note printed with the warning — this is the "8K" answer, and it is not 8192. */
  texWarn: 4096,
};

const GLB_MAGIC = 0x46546c67; // "glTF"
const CHUNK_JSON = 0x4e4f534a;
const CHUNK_BIN = 0x004e4942;

/** Intrinsic size of an embedded texture, from its own header. No decoding. */
function imageSize(buf) {
  // >= 24, not > 24: IHDR's height field ENDS at byte 24, so 24 bytes is exactly
  // enough to read both dimensions. The strict form silently skipped a header-only
  // slice and reported the texture as unmeasurable rather than as oversized.
  if (buf.length >= 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), kind: "png" };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      // SOF0/1/2/9/10 carry the frame dimensions; the rest are skipped.
      if ([0xc0, 0xc1, 0xc2, 0xc9, 0xca].includes(marker)) {
        return { w: buf.readUInt16BE(i + 7), h: buf.readUInt16BE(i + 5), kind: "jpeg" };
      }
      i += 2 + len;
    }
  }
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const c = buf.toString("ascii", 12, 16);
    if (c === "VP8X") return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1, kind: "webp" };
    if (c === "VP8 ") return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, kind: "webp" };
    if (c === "VP8L") {
      const n = buf.readUInt32LE(21);
      return { w: (n & 0x3fff) + 1, h: ((n >> 14) & 0x3fff) + 1, kind: "webp" };
    }
  }
  return null;
}

export function inspectGlb(bytes) {
  const problems = [];
  const warnings = [];
  const fail = (m) => problems.push(m);
  const warn = (m) => warnings.push(m);

  if (bytes.length < 20) return { ok: false, fatal: "file is too small to be a GLB" };
  if (bytes.readUInt32LE(0) !== GLB_MAGIC) {
    return { ok: false, fatal: "not a GLB — the 'glTF' magic is missing (a .gltf/.obj/.fbx is not this format)" };
  }
  const version = bytes.readUInt32LE(4);
  if (version !== 2) return { ok: false, fatal: `GLB version ${version}; the loader reads version 2` };
  const declared = bytes.readUInt32LE(8);
  if (declared !== bytes.length) {
    return { ok: false, fatal: `header declares ${declared} bytes, the file is ${bytes.length} — truncated or padded` };
  }

  // Walk the chunk table rather than assuming JSON-then-BIN: the order is fixed by
  // the spec but the offsets are not, and a converter that pads differently is
  // exactly the file this gate is for.
  let off = 12;
  let json = null;
  let bin = null;
  while (off + 8 <= bytes.length) {
    const len = bytes.readUInt32LE(off);
    const type = bytes.readUInt32LE(off + 4);
    const start = off + 8;
    if (start + len > bytes.length) return { ok: false, fatal: "a chunk runs past the end of the file" };
    if (type === CHUNK_JSON) json = bytes.subarray(start, start + len);
    else if (type === CHUNK_BIN) bin = bytes.subarray(start, start + len);
    off = start + len + ((4 - (len % 4)) % 4);
  }
  if (!json) return { ok: false, fatal: "no JSON chunk — the file carries no scene description" };

  let gltf;
  try {
    gltf = JSON.parse(json.toString("utf8"));
  } catch (e) {
    return { ok: false, fatal: `the JSON chunk does not parse: ${e.message}` };
  }

  // ── 1. External references. The silent CSP failure. ────────────────────────
  const external = [];
  for (const [i, b] of (gltf.buffers ?? []).entries()) {
    if (b.uri && !b.uri.startsWith("data:")) external.push(`buffers[${i}] → ${b.uri}`);
  }
  for (const [i, im] of (gltf.images ?? []).entries()) {
    if (im.uri && !im.uri.startsWith("data:")) external.push(`images[${i}] → ${im.uri}`);
  }
  if (external.length) {
    fail(
      `${external.length} external reference(s) — the loader would fetch these, and connect-src blocks every host but 'self' and Supabase. ` +
        `The model would render incomplete with no error anyone sees.\n      ` +
        external.slice(0, 6).join("\n      "),
    );
  }

  // ── 2. Required extensions that need a decoder. ────────────────────────────
  const DECODER = { KHR_draco_mesh_compression: "Draco", EXT_meshopt_compression: "Meshopt" };
  const needsDecoder = (gltf.extensionsRequired ?? []).filter((e) => DECODER[e]);
  for (const e of needsDecoder) {
    warn(
      `requires ${DECODER[e]} — drei fetches that decoder from a third-party CDN by default, which this CSP blocks. ` +
        `Ship the decoder from /public and point the loader at it, or export without ${DECODER[e]}.`,
    );
  }
  const unknownRequired = (gltf.extensionsRequired ?? []).filter((e) => !DECODER[e]);
  if (unknownRequired.length) {
    warn(`requires extension(s) the viewer may not implement: ${unknownRequired.join(", ")}`);
  }

  // ── 3. Geometry. ──────────────────────────────────────────────────────────
  //
  // TWO COUNTS, AND THE BUDGET IS ON THE SECOND. `unique` is the triangles the
  // file stores once; `drawn` is what the GPU is actually asked to rasterise,
  // because a node tree instances a mesh — four wheels are one mesh referenced
  // four times. The committed placeholder stores 720 and draws 2,508, and a model
  // that instanced one mesh five hundred times would sail through a unique-count
  // budget while melting a phone. The stored figure is kept because it is what
  // download size tracks.
  let unique = 0;
  let primitives = 0;
  const perMesh = [];
  for (const mesh of gltf.meshes ?? []) {
    let t = 0;
    for (const p of mesh.primitives ?? []) {
      primitives++;
      const mode = p.mode ?? 4; // 4 = TRIANGLES
      const acc = p.indices != null ? gltf.accessors?.[p.indices] : gltf.accessors?.[p.attributes?.POSITION];
      const count = acc?.count ?? 0;
      if (mode === 4) t += Math.floor(count / 3);
      if (p.attributes?.POSITION == null) fail(`meshes["${mesh.name ?? "?"}"] has a primitive with no POSITION attribute`);
    }
    perMesh.push(t);
    unique += t;
  }

  // Walk the scene graph for the drawn count. `seen` guards against a malformed
  // file whose nodes cycle — the spec forbids it, and a converter has produced it.
  let drawn = 0;
  const seen = new Set();
  const visit = (i) => {
    if (seen.has(i)) return;
    seen.add(i);
    const n = gltf.nodes?.[i];
    if (!n) return;
    if (n.mesh != null && perMesh[n.mesh] != null) drawn += perMesh[n.mesh];
    for (const c of n.children ?? []) visit(c);
  };
  const roots = gltf.scenes?.[gltf.scene ?? 0]?.nodes ?? [];
  for (const r of roots) visit(r);
  // A file with no scene still draws nothing, but the geometry is there; fall back
  // so the budget is never silently zero.
  const triangles = drawn || unique;

  if (!primitives) fail("the file contains no drawable primitive — there is nothing to render");
  if (roots.length === 0 && primitives > 0) warn("no scene references the geometry — most viewers will show an empty stage");
  if (triangles > LIMITS.trisFail) fail(`${triangles.toLocaleString()} triangles drawn — over the ${LIMITS.trisFail.toLocaleString()} budget`);
  else if (triangles > LIMITS.trisWarn) warn(`${triangles.toLocaleString()} triangles drawn — heavy for a phone`);

  // ── 4. Textures, measured from their own headers. ──────────────────────────
  const textures = [];
  for (const [i, im] of (gltf.images ?? []).entries()) {
    if (im.bufferView == null || !bin) continue;
    const bv = gltf.bufferViews?.[im.bufferView];
    if (!bv) continue;
    const slice = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength);
    const size = imageSize(slice);
    textures.push({ index: i, bytes: bv.byteLength, ...(size ?? { w: null, h: null, kind: im.mimeType ?? "?" }) });
    if (size && Math.max(size.w, size.h) > LIMITS.texWarn) {
      warn(
        `images[${i}] is ${size.w}×${size.h} — above ${LIMITS.texWarn}px is not safely supported on every mobile GPU, ` +
          `and a texture larger than the screen buys nothing. ${LIMITS.texWarn}px with KTX2/Basis is the sharper answer than 8192.`,
      );
    }
  }

  // ── 5. Weight. ────────────────────────────────────────────────────────────
  if (bytes.length > LIMITS.bytesFail) fail(`${(bytes.length / 1048576).toFixed(1)} MB — over the ${LIMITS.bytesFail / 1048576} MB budget`);
  else if (bytes.length > LIMITS.bytesWarn) warn(`${(bytes.length / 1048576).toFixed(1)} MB — slow on cellular`);

  return {
    ok: problems.length === 0,
    problems,
    warnings,
    stats: {
      bytes: bytes.length,
      generator: gltf.asset?.generator ?? null,
      nodes: (gltf.nodes ?? []).length,
      meshes: (gltf.meshes ?? []).length,
      primitives,
      triangles,
      trianglesUnique: unique,
      materials: (gltf.materials ?? []).length,
      animations: (gltf.animations ?? []).length,
      textures,
      extensionsRequired: gltf.extensionsRequired ?? [],
      external,
    },
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const file = process.argv.find((a) => a.endsWith(".glb"));
  const asJson = process.argv.includes("--json");
  if (!file) {
    console.error("usage: node scripts/glb-check.mjs <file.glb> [--json]");
    process.exit(2);
  }
  let bytes;
  try {
    bytes = readFileSync(file);
    statSync(file);
  } catch (e) {
    console.error(`cannot read ${file}: ${e.message}`);
    process.exit(2);
  }
  const r = inspectGlb(bytes);
  if (asJson) {
    console.log(JSON.stringify(r, null, 2));
    process.exit(r.ok ? 0 : r.fatal ? 2 : 1);
  }
  if (r.fatal) {
    console.error(`✖ ${file}\n  ${r.fatal}`);
    process.exit(2);
  }
  const s = r.stats;
  const mb = (s.bytes / 1048576).toFixed(2);
  console.log(`\n  ${file}`);
  console.log(`  ${mb} MB · ${s.triangles.toLocaleString()} triangles drawn (${s.trianglesUnique.toLocaleString()} stored) · ${s.meshes} mesh(es) · ${s.materials} material(s) · ${s.nodes} node(s)`);
  if (s.generator) console.log(`  generator: ${s.generator}`);
  if (s.textures.length) {
    console.log(`  textures:`);
    for (const t of s.textures) {
      console.log(`    images[${t.index}] ${t.w ?? "?"}×${t.h ?? "?"} ${t.kind} · ${(t.bytes / 1024).toFixed(0)} KB`);
    }
  } else console.log(`  textures: none embedded`);
  for (const w of r.warnings) console.log(`\n  ⚠ ${w}`);
  for (const p of r.problems) console.log(`\n  ✖ ${p}`);
  console.log(r.ok ? `\n  ✔ fit to ship\n` : `\n  ✖ rejected — ${r.problems.length} problem(s)\n`);
  process.exit(r.ok ? 0 : 1);
}
