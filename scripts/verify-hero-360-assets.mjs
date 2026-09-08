import { access, stat } from 'node:fs/promises';

const files = Array.from({ length: 6 }, (_, i) => `public/360/mia-four-360-${String(i + 1).padStart(2, '0')}.webp`);

const failures = [];
for (const file of files) {
  try {
    await access(file);
    const info = await stat(file);
    if (!info.isFile() || info.size < 1024) failures.push(`${file}: invalid or too small (${info.size} bytes)`);
  } catch {
    failures.push(`${file}: missing`);
  }
}

if (failures.length) {
  console.error('Hero 360 asset gate failed:\n' + failures.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}

console.log(`Hero 360 asset gate OK: ${files.length}/6 assets present`);
