// test/glbIntake.test.ts — the 3D intake gate, exercised against files built to
// fail it.
//
// The gate's whole value is catching a model BEFORE it is deployed, so every
// assertion here constructs a GLB that would break the site and proves the gate
// says so. Checking only the committed placeholder would prove the happy path and
// nothing else — and the happy path was never the risk.
//
// The two failures it exists for are SILENT in production: an external URI and a
// required decoder both end with a stage that renders nothing and an operator with
// no error to read. Those two get the most cases.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
// A plain .mjs tool, deliberately dependency-free — TypeScript resolves it and
// infers `any`, which is why the Result shape is declared explicitly below.
import { inspectGlb } from "../scripts/glb-check.mjs";

type Result = {
  ok: boolean;
  fatal?: string;
  problems?: string[];
  warnings?: string[];
  stats?: Record<string, any>;
};

/** Assemble a real GLB container around a glTF document, so the gate parses the
 *  same bytes a browser would rather than a hand-waved object. */
function glb(doc: unknown, bin?: Buffer): Buffer {
  const json = Buffer.from(JSON.stringify(doc), "utf8");
  const jsonPad = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
  const chunks: Buffer[] = [
    (() => {
      const h = Buffer.alloc(8);
      h.writeUInt32LE(jsonPad.length, 0);
      h.writeUInt32LE(0x4e4f534a, 4);
      return Buffer.concat([h, jsonPad]);
    })(),
  ];
  if (bin) {
    const binPad = Buffer.concat([bin, Buffer.alloc((4 - (bin.length % 4)) % 4, 0)]);
    const h = Buffer.alloc(8);
    h.writeUInt32LE(binPad.length, 0);
    h.writeUInt32LE(0x004e4942, 4);
    chunks.push(Buffer.concat([h, binPad]));
  }
  const body = Buffer.concat(chunks);
  const head = Buffer.alloc(12);
  head.writeUInt32LE(0x46546c67, 0);
  head.writeUInt32LE(2, 4);
  head.writeUInt32LE(12 + body.length, 8);
  return Buffer.concat([head, body]);
}

/** A minimal SHIPPABLE model: one triangle, in a scene, nothing external — and a
 *  real base colour. The first version of this fixture used `materials: [{}]`, which
 *  the appearance check correctly rejects: an empty material IS the "no MTL" defect.
 *  A fixture meant to represent a passing file has to actually be one. */
const MINIMAL = {
  asset: { version: "2.0", generator: "test" },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ mesh: 0 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 0, material: 0 }] }],
  materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.045, 0.05, 0.058, 1] } }],
  accessors: [{ count: 3, componentType: 5123, type: "SCALAR" }],
};

describe("the gate accepts what the site can actually serve", () => {
  it("passes the committed placeholder", () => {
    const r: Result = inspectGlb(readFileSync("public/models/mia-four-x4.glb"));
    expect(r.problems, `rejected the repo's own GLB: ${r.problems?.join(" · ")}`).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("counts the triangles the GPU is asked to draw, not the ones stored", () => {
    // Cross-check with an independent path: public/models/README.md records 2,508
    // triangles as measured through the real three.js GLTFLoader. The scene-graph
    // walk here reproduces it from the bytes. If these ever disagree, one of the
    // two is wrong and this names which file to open.
    const r: Result = inspectGlb(readFileSync("public/models/mia-four-x4.glb"));
    expect(r.stats!.triangles).toBe(2508);
    expect(r.stats!.trianglesUnique).toBe(720);
    expect(readFileSync("public/models/README.md", "utf8")).toContain("2,508 triangles");
  });

  it("passes a minimal well-formed model", () => {
    const r: Result = inspectGlb(glb(MINIMAL));
    expect(r.ok).toBe(true);
    expect(r.warnings).toEqual([]);
  });
});

describe("it rejects the file that fails silently in production", () => {
  it("catches a buffer that points at a URL", () => {
    // The loader would fetch this; connect-src blocks it; nothing reports an error.
    const r: Result = inspectGlb(glb({ ...MINIMAL, buffers: [{ uri: "https://cdn.example.com/model.bin", byteLength: 12 }] }));
    expect(r.ok).toBe(false);
    expect(r.problems!.join(" ")).toContain("external reference");
    expect(r.problems!.join(" ")).toContain("cdn.example.com");
  });

  it("catches a texture that points at a URL", () => {
    const r: Result = inspectGlb(glb({ ...MINIMAL, images: [{ uri: "https://cdn.example.com/paint.png" }] }));
    expect(r.ok).toBe(false);
    expect(r.problems!.join(" ")).toContain("external reference");
  });

  it("allows an embedded data: URI, which is not a fetch", () => {
    const r: Result = inspectGlb(glb({ ...MINIMAL, images: [{ uri: "data:image/png;base64,iVBORw0KGgo=" }] }));
    expect(r.ok).toBe(true);
  });

  it("reports a required decoder as a warning, not a rejection", () => {
    // Draco is the RIGHT answer for the web once the decoder is self-hosted. The
    // file is shippable; what is not shippable is shipping it without noticing.
    const r: Result = inspectGlb(glb({ ...MINIMAL, extensionsRequired: ["KHR_draco_mesh_compression"] }));
    expect(r.ok).toBe(true);
    expect(r.warnings!.join(" ")).toContain("Draco");
    expect(r.warnings!.join(" "), "the warning does not say why it matters here").toContain("CSP");
  });
});

describe("it refuses a file that is not the format at all", () => {
  it.each([
    ["an empty file", Buffer.alloc(0), "too small"],
    // Padded past the 20-byte floor so the file reaches the MAGIC check rather than
    // the size one — a real renamed PNG is kilobytes, and the point is the magic.
    ["a PNG renamed .glb", Buffer.concat([Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"), Buffer.alloc(64)]), "magic"],
  ])("%s", (_label, bytes, expected) => {
    const r: Result = inspectGlb(bytes as Buffer);
    expect(r.ok).toBe(false);
    expect(r.fatal).toContain(expected);
  });

  it("catches a truncated download", () => {
    const good = glb(MINIMAL);
    const r: Result = inspectGlb(good.subarray(0, good.length - 8));
    expect(r.ok).toBe(false);
    expect(r.fatal).toContain("truncated");
  });

  it("catches a header whose declared length disagrees with the file", () => {
    // A SEPARATE case from truncation, and the first version of this file did not
    // have it: cutting bytes off the end also breaks the chunk table, so the
    // chunk-bounds check fired and the length check was never exercised. Bytes
    // APPENDED — a concatenated download, a converter's trailing padding — leave
    // every chunk intact and are caught by the declared length alone.
    const b = Buffer.concat([glb(MINIMAL), Buffer.alloc(16)]);
    const r: Result = inspectGlb(b);
    expect(r.ok).toBe(false);
    expect(r.fatal).toContain("truncated or padded");
  });

  it("catches a version the loader cannot read", () => {
    const b = glb(MINIMAL);
    b.writeUInt32LE(1, 4);
    const r: Result = inspectGlb(b);
    expect(r.ok).toBe(false);
    expect(r.fatal).toContain("version 1");
  });
});

describe("it refuses a file that would render nothing", () => {
  it("catches geometry no scene references", () => {
    const r: Result = inspectGlb(glb({ ...MINIMAL, scenes: [{ nodes: [] }] }));
    expect(r.warnings!.join(" ")).toContain("no scene references the geometry");
  });

  it("catches a file with no primitive at all", () => {
    const r: Result = inspectGlb(glb({ asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [] }], nodes: [] }));
    expect(r.ok).toBe(false);
    expect(r.problems!.join(" ")).toContain("nothing to render");
  });

  it("survives a node cycle instead of hanging", () => {
    // The spec forbids it; converters have produced it. An infinite walk here
    // would hang CI with no output, which is worse than any wrong answer.
    const r: Result = inspectGlb(
      glb({
        ...MINIMAL,
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0, children: [1] }, { children: [0] }],
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.stats!.triangles).toBe(1);
  });
});

describe("it refuses a model that carries no appearance", () => {
  // The "NO MTL" failure: the file loads, draws, and passes every structural check
  // — and shows a colourless shape. Two routes lead here and both are one click
  // away in an online converter: an OBJ converted without its .mtl sidecar, and any
  // STL source, which has no material channel at all.

  it("rejects a model with no materials", () => {
    const r: Result = inspectGlb(glb({ ...MINIMAL, materials: [] }));
    expect(r.ok).toBe(false);
    expect(r.problems!.join(" ")).toContain("grey shape");
    expect(r.problems!.join(" "), "the message does not name the cause").toContain(".mtl");
  });

  it("rejects materials that carry neither colour nor texture", () => {
    const r: Result = inspectGlb(
      glb({ ...MINIMAL, materials: [{ name: "default" }, { pbrMetallicRoughness: { metallicFactor: 0.5 } }] }),
    );
    expect(r.ok).toBe(false);
    expect(r.problems!.join(" ")).toContain("not one carries a colour");
  });

  it("treats an explicit default-white material as no appearance", () => {
    // A converter that drops the MTL commonly leaves baseColorFactor at [1,1,1,1]
    // rather than omitting it, which would slip past a mere presence check.
    const r: Result = inspectGlb(
      glb({ ...MINIMAL, materials: [{ pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1] } }] }),
    );
    expect(r.ok).toBe(false);
  });

  it("accepts colour without any texture — which is what the repo's own GLB is", () => {
    // The discrimination that matters: scripts/build-glb.mjs emits 7 materials with
    // real baseColorFactors and ZERO textures. Rejecting that would reject the
    // repo's own artifact and make the check unusable.
    const r: Result = inspectGlb(
      glb({ ...MINIMAL, materials: [{ pbrMetallicRoughness: { baseColorFactor: [0.04, 0.78, 0.86, 1] } }] }),
    );
    expect(r.ok).toBe(true);
    expect(inspectGlb(readFileSync("public/models/mia-four-x4.glb")).stats!.hasAppearance).toBe(true);
  });

  it("accepts a textured material with no colour factor", () => {
    const r: Result = inspectGlb(
      glb({ ...MINIMAL, materials: [{ pbrMetallicRoughness: { baseColorTexture: { index: 0 } } }] }),
    );
    expect(r.ok).toBe(true);
  });
});

describe("the budgets are stated, and they bind", () => {
  it("rejects a model over the triangle budget", () => {
    const r: Result = inspectGlb(
      glb({ ...MINIMAL, accessors: [{ count: 3_000_000, componentType: 5125, type: "SCALAR" }] }),
    );
    expect(r.ok).toBe(false);
    expect(r.problems!.join(" ")).toContain("over the");
  });

  it("warns above the safe mobile texture size rather than praising it", () => {
    // A 8192px texture is the "8K" instinct and it is not supported on every
    // mobile GPU. The gate has to say so where the operator will read it.
    const png = Buffer.alloc(24);
    png.writeUInt32BE(0x89504e47, 0);
    png.writeUInt32BE(8192, 16);
    png.writeUInt32BE(8192, 20);
    const r: Result = inspectGlb(
      glb(
        { ...MINIMAL, images: [{ bufferView: 0, mimeType: "image/png" }], bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 24 }] },
        png,
      ),
    );
    expect(r.warnings!.join(" ")).toContain("8192×8192");
    expect(r.warnings!.join(" ")).toContain("mobile GPU");
  });
});
