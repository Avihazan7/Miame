// Shared by test/imageLayout.test.ts and test/seoHeroIntrinsic.test.ts.
import { readFileSync } from "node:fs";

/**
 * Intrinsic size straight from the file header — WebP, PNG and JPEG. Written by
 * hand rather than pulled from a package: one test does not justify a dependency
 * that then has to be audited, pinned and kept current forever.
 */
export function intrinsicSize(path: string): { width: number; height: number } | null {
  const b = readFileSync(path);
  // PNG · IHDR is always the first chunk, at a fixed offset
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  // WebP · RIFF container, three possible chunk types
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const n = b.readUInt32LE(21);
      return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 };
    }
    if (kind === "VP8X") {
      const rd = (o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);
      return { width: rd(24) + 1, height: rd(27) + 1 };
    }
    return null;
  }
  // JPEG · walk the segment chain to the first Start-Of-Frame
  if (b[0] === 0xff && b[1] === 0xd8) {
    let o = 2;
    while (o < b.length - 9) {
      if (b[o] !== 0xff) { o++; continue; }
      const marker = b[o + 1];
      // SOF0..SOF15, skipping the four that are not frame headers
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(o + 7), height: b.readUInt16BE(o + 5) };
      }
      o += 2 + b.readUInt16BE(o + 2);
    }
  }
  return null;
}
