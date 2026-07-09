import { chromium } from "playwright";
const pdf = process.argv[2];
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
await page.goto("file://" + pdf, { waitUntil: "load" });
await page.waitForTimeout(3500);
await page.mouse.move(750, 700);
// jump near the end
for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 640); await page.waitForTimeout(120); }
await page.waitForTimeout(1000);
await page.screenshot({ path: `/tmp/wo_end1.png` });
await page.mouse.wheel(0, 640); await page.waitForTimeout(800);
await page.screenshot({ path: `/tmp/wo_end2.png` });
await page.mouse.wheel(0, 640); await page.waitForTimeout(800);
await page.screenshot({ path: `/tmp/wo_end3.png` });
console.log("done");
await browser.close();
