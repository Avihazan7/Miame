#!/usr/bin/env node
/**
 * scripts/build-glb.mjs — MIA FOUR X4 · Professional GLB generator (OS U.M.M).
 *
 * "Steel code": a dependency-free, fully deterministic glTF 2.0 (binary .glb)
 * author. It procedurally builds a brand-correct, PBR-shaded 3D model of the
 * MIA FOUR X4 (matte nano-crystal black body, alloy rims, MIA-teal suspension
 * springs, off-road tires, folding stem, quick-release seat) and writes it to
 *   public/models/mia-four-x4.glb
 *
 * The model loads as-is in the existing three.js / @react-three/drei viewer
 * (components/vehicle-media/VehicleModelStage.tsx → useGLTF). The same artifact
 * is the one published to the Supabase `vehicle-media` bucket
 * (scripts/publish-glb-to-bucket.mjs).
 *
 * Design notes
 * ────────────
 * • Canonical unit primitives (centered box, +Y cylinder) are authored ONCE as
 *   shared accessors; every part is a node with a TRS that references a mesh
 *   (geometry × material). Compact, correct, and easy to reason about.
 * • Right-handed, +Y up, +Z forward, meters. Bounds-fit in the viewer handles
 *   final framing, so absolute scale only needs to be self-consistent.
 * • No external deps — we emit the GLB container by hand and self-validate the
 *   header/JSON/accessors before writing.
 *
 * Run:  node scripts/build-glb.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "models", "mia-four-x4.glb");

// ── Math helpers ────────────────────────────────────────────────────────────
/** Quaternion (x,y,z,w) for a rotation of `deg` about a unit axis. */
function quat(axis, deg) {
  const r = (deg * Math.PI) / 180 / 2;
  const s = Math.sin(r);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(r)];
}
const QX = (d) => quat([1, 0, 0], d);
const QY = (d) => quat([0, 1, 0], d);
const QZ = (d) => quat([0, 0, 1], d);

// ── Canonical geometries ────────────────────────────────────────────────────
/** Unit cube centered at origin, edge length 1. Flat per-face normals. */
function unitBox() {
  const positions = [];
  const normals = [];
  const indices = [];
  const faces = [
    { n: [0, 0, 1], v: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
    { n: [0, 0, -1], v: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
    { n: [1, 0, 0], v: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
    { n: [-1, 0, 0], v: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, 1, 0], v: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
    { n: [0, -1, 0], v: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] },
  ];
  for (const f of faces) {
    const b = positions.length / 3;
    for (const p of f.v) {
      positions.push(...p);
      normals.push(...f.n);
    }
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  return { positions, normals, indices };
}

/** Unit cylinder along +Y: radius 1, height 1 (y ∈ [-0.5, 0.5]), with caps. */
function unitCylinder(seg = 28) {
  const positions = [];
  const normals = [];
  const indices = [];
  // Side wall (smooth radial normals).
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * Math.PI * 2;
    const x = Math.cos(t);
    const z = Math.sin(t);
    positions.push(x, -0.5, z, x, 0.5, z);
    normals.push(x, 0, z, x, 0, z);
  }
  for (let i = 0; i < seg; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  // Caps (top +Y, bottom -Y) as triangle fans around a center vertex.
  for (const [y, ny] of [[0.5, 1], [-0.5, -1]]) {
    const center = positions.length / 3;
    positions.push(0, y, 0);
    normals.push(0, ny, 0);
    const ring = positions.length / 3;
    for (let i = 0; i <= seg; i++) {
      const t = (i / seg) * Math.PI * 2;
      positions.push(Math.cos(t), y, Math.sin(t));
      normals.push(0, ny, 0);
    }
    for (let i = 0; i < seg; i++) {
      if (ny > 0) indices.push(center, ring + i, ring + i + 1);
      else indices.push(center, ring + i + 1, ring + i);
    }
  }
  return { positions, normals, indices };
}

// ── glTF assembly ───────────────────────────────────────────────────────────
const gltf = {
  asset: { version: "2.0", generator: "MiaMe OS U.M.M · build-glb.mjs" },
  scenes: [{ name: "MIA FOUR X4", nodes: [] }],
  scene: 0,
  nodes: [],
  meshes: [],
  materials: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};
const blobs = []; // raw little-endian byte arrays, concatenated into the BIN chunk

function pushBufferView(buf, target) {
  // 4-byte align each view inside the buffer.
  let offset = blobs.reduce((s, b) => s + b.length, 0);
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    blobs.push(Buffer.alloc(pad));
    offset += pad;
  }
  blobs.push(buf);
  gltf.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(target ? { target } : {}) });
  return gltf.bufferViews.length - 1;
}

function addGeometry(geo) {
  const pos = Float32Array.from(geo.positions);
  const nrm = Float32Array.from(geo.normals);
  const idx = Uint32Array.from(geo.indices);
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], pos[i + k]);
      max[k] = Math.max(max[k], pos[i + k]);
    }
  }
  const posView = pushBufferView(Buffer.from(pos.buffer), 34962);
  gltf.accessors.push({ bufferView: posView, componentType: 5126, count: pos.length / 3, type: "VEC3", min, max });
  const posAcc = gltf.accessors.length - 1;
  const nrmView = pushBufferView(Buffer.from(nrm.buffer), 34962);
  gltf.accessors.push({ bufferView: nrmView, componentType: 5126, count: nrm.length / 3, type: "VEC3" });
  const nrmAcc = gltf.accessors.length - 1;
  const idxView = pushBufferView(Buffer.from(idx.buffer), 34963);
  gltf.accessors.push({ bufferView: idxView, componentType: 5125, count: idx.length, type: "SCALAR" });
  const idxAcc = gltf.accessors.length - 1;
  return { posAcc, nrmAcc, idxAcc };
}

function addMaterial(name, base, metallic, roughness, emissive) {
  gltf.materials.push({
    name,
    pbrMetallicRoughness: { baseColorFactor: base, metallicFactor: metallic, roughnessFactor: roughness },
    ...(emissive ? { emissiveFactor: emissive } : {}),
    doubleSided: false,
  });
  return gltf.materials.length - 1;
}

const meshCache = new Map();
function meshFor(geoKey, geoAcc, material) {
  const key = `${geoKey}:${material}`;
  if (meshCache.has(key)) return meshCache.get(key);
  gltf.meshes.push({
    primitives: [
      {
        attributes: { POSITION: geoAcc.posAcc, NORMAL: geoAcc.nrmAcc },
        indices: geoAcc.idxAcc,
        material,
        mode: 4,
      },
    ],
  });
  const idx = gltf.meshes.length - 1;
  meshCache.set(key, idx);
  return idx;
}

function part(name, geoKey, geoAcc, material, { t = [0, 0, 0], r = [0, 0, 0, 1], s = [1, 1, 1] } = {}) {
  gltf.nodes.push({ name, mesh: meshFor(geoKey, geoAcc, material), translation: t, rotation: r, scale: s });
  gltf.scenes[0].nodes.push(gltf.nodes.length - 1);
}

// Geometries
const BOX = addGeometry(unitBox());
const CYL = addGeometry(unitCylinder(28));

// Materials — the MIA palette (nano-crystal black + teal accents).
const MAT_BODY = addMaterial("body-black", [0.045, 0.05, 0.058, 1], 0.55, 0.32); // waxed black
const MAT_FRAME = addMaterial("frame-graphite", [0.09, 0.1, 0.115, 1], 0.7, 0.38);
const MAT_TIRE = addMaterial("tire", [0.028, 0.028, 0.032, 1], 0.0, 0.95);
const MAT_RIM = addMaterial("rim-alloy", [0.62, 0.64, 0.68, 1], 1.0, 0.24);
const MAT_TEAL = addMaterial("mia-teal", [0.04, 0.78, 0.86, 1], 0.45, 0.3, [0.02, 0.32, 0.36]);
const MAT_CHROME = addMaterial("chrome", [0.72, 0.74, 0.78, 1], 1.0, 0.18);
const MAT_SEAT = addMaterial("seat", [0.07, 0.075, 0.085, 1], 0.2, 0.55);

// ── The build (one place; reads top-to-bottom like an exploded view) ─────────
const TRACK = 0.62; // half track width (X)
const FRONT = 0.74; // front axle Z
const REAR = -0.74; // rear axle Z
const WHEEL_R = 0.3;
const WHEEL_W = 0.2;
const AXLE_Y = WHEEL_R; // wheels sit on ground at y=0
const wheelRot = QZ(90); // +Y cylinder → axle along X

function corner(name, x, z, frontSusp) {
  // Tire, rim, hub, and (front) a teal suspension spring.
  part(`${name}-tire`, "cyl", CYL, MAT_TIRE, { t: [x, AXLE_Y, z], r: wheelRot, s: [WHEEL_R * 2, WHEEL_W, WHEEL_R * 2] });
  part(`${name}-rim`, "cyl", CYL, MAT_RIM, { t: [x, AXLE_Y, z], r: wheelRot, s: [WHEEL_R * 1.15, WHEEL_W * 1.04, WHEEL_R * 1.15] });
  part(`${name}-hub`, "cyl", CYL, MAT_TEAL, { t: [x, AXLE_Y, z], r: wheelRot, s: [WHEEL_R * 0.4, WHEEL_W * 1.08, WHEEL_R * 0.4] });
  // Fender hugging the tire from above.
  part(`${name}-fender`, "box", BOX, MAT_BODY, { t: [x, AXLE_Y + WHEEL_R * 0.95, z], s: [WHEEL_W * 1.25, 0.05, WHEEL_R * 2.1] });
  if (frontSusp) {
    const inX = x > 0 ? x - 0.12 : x + 0.12;
    part(`${name}-spring`, "cyl", CYL, MAT_TEAL, { t: [inX, AXLE_Y + 0.16, z], r: QX(12), s: [0.05, 0.34, 0.05] });
  }
}

// Four corners.
corner("fl", +TRACK, FRONT, true);
corner("fr", -TRACK, FRONT, true);
corner("rl", +TRACK, REAR, false);
corner("rr", -TRACK, REAR, false);

// Front + rear axle beams (the suspension cross-members).
part("axle-front", "cyl", CYL, MAT_FRAME, { t: [0, AXLE_Y + 0.02, FRONT], r: wheelRot, s: [0.05, TRACK * 2, 0.05] });
part("axle-rear", "cyl", CYL, MAT_FRAME, { t: [0, AXLE_Y + 0.02, REAR], r: wheelRot, s: [0.05, TRACK * 2, 0.05] });

// Deck / platform + battery pack underneath.
part("deck", "box", BOX, MAT_BODY, { t: [0, 0.2, 0], s: [0.52, 0.1, 1.24] });
part("deck-grip", "box", BOX, MAT_FRAME, { t: [0, 0.255, 0], s: [0.46, 0.02, 1.12] });
part("battery", "box", BOX, MAT_FRAME, { t: [0, 0.135, -0.05], s: [0.42, 0.12, 0.78] });
part("battery-teal", "box", BOX, MAT_TEAL, { t: [0, 0.135, 0.36], s: [0.43, 0.05, 0.06] });

// Steering stem — leans back from the front of the deck up to the bars.
const stemLean = QX(-15);
part("stem", "box", BOX, MAT_BODY, { t: [0, 0.78, 0.62], r: stemLean, s: [0.12, 1.18, 0.1] });
part("stem-badge", "box", BOX, MAT_TEAL, { t: [0, 1.18, 0.515], r: stemLean, s: [0.12, 0.14, 0.012] });
part("fork", "cyl", CYL, MAT_CHROME, { t: [0, 0.4, 0.66], r: QX(8), s: [0.05, 0.5, 0.05] });

// Handlebars at the top of the stem.
const barY = 1.3;
const barZ = 0.5;
part("bar", "cyl", CYL, MAT_CHROME, { t: [0, barY, barZ], r: wheelRot, s: [0.035, 0.78, 0.035] });
part("grip-l", "cyl", CYL, MAT_BODY, { t: [+0.3, barY, barZ], r: wheelRot, s: [0.05, 0.18, 0.05] });
part("grip-r", "cyl", CYL, MAT_BODY, { t: [-0.3, barY, barZ], r: wheelRot, s: [0.05, 0.18, 0.05] });
part("display", "box", BOX, MAT_FRAME, { t: [0, barY + 0.02, barZ + 0.06], r: QX(-30), s: [0.16, 0.09, 0.02] });

// Quick-release seat (the "ישיבה או עמידה" accessory).
part("seat-post", "cyl", CYL, MAT_CHROME, { t: [0, 0.5, -0.18], s: [0.04, 0.5, 0.04] });
part("seat-base", "box", BOX, MAT_SEAT, { t: [0, 0.74, -0.2], s: [0.34, 0.07, 0.34] });
part("seat-back", "box", BOX, MAT_SEAT, { t: [0, 0.92, -0.36], r: QX(-12), s: [0.34, 0.32, 0.06] });

// ── Emit GLB ────────────────────────────────────────────────────────────────
const bin = Buffer.concat(blobs);
const binPad = (4 - (bin.length % 4)) % 4;
const binChunk = binPad ? Buffer.concat([bin, Buffer.alloc(binPad)]) : bin;
gltf.buffers.push({ byteLength: binChunk.length });

let json = Buffer.from(JSON.stringify(gltf), "utf8");
const jsonPad = (4 - (json.length % 4)) % 4;
if (jsonPad) json = Buffer.concat([json, Buffer.alloc(jsonPad, 0x20)]); // pad with spaces

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0); // "glTF"
header.writeUInt32LE(2, 4); // version
header.writeUInt32LE(12 + 8 + json.length + 8 + binChunk.length, 8); // total length

const jsonHeader = Buffer.alloc(8);
jsonHeader.writeUInt32LE(json.length, 0);
jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binChunk.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"

const glb = Buffer.concat([header, jsonHeader, json, binHeader, binChunk]);

// ── Self-validation (fail loud before writing) ───────────────────────────────
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error("bad GLB magic");
if (glb.readUInt32LE(8) !== glb.length) throw new Error("GLB length mismatch");
for (const a of gltf.accessors) {
  if (!Number.isInteger(a.count) || a.count <= 0) throw new Error("bad accessor count");
}
for (const m of gltf.meshes) {
  for (const p of m.primitives) {
    if (p.material == null || p.indices == null) throw new Error("primitive missing material/indices");
  }
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, glb);

const kb = (glb.length / 1024).toFixed(1);
console.log(
  `✅ ${OUT.replace(/.*\/public\//, "public/")} · ${kb} KB · ` +
    `${gltf.nodes.length} nodes · ${gltf.meshes.length} meshes · ${gltf.materials.length} materials · ` +
    `${gltf.accessors.length} accessors`
);
