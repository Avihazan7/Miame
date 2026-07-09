import { chromium } from "playwright";

const pdf = process.argv[2];
const prefix = process.argv[3];
const shots = parseInt(process.argv[4] || "16", 10);
const scrollPx = parseInt(process.argv[5] || "1000", 10);

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1100, height: 1400 },
});
await page.goto("file://" + pdf, { waitUntil: "load" });
await page.waitForTimeout(3500);
await page.mouse.move(750, 700);

for (let i = 0; i < shots; i++) {
  await page.screenshot({ path: `/tmp/${prefix}_${i + 1}.png` });
  await page.mouse.move(750, 700);
  await page.mouse.wheel(0, scrollPx);
  await page.waitForTimeout(800);
}
console.log("done", prefix, shots);
await browser.close();
