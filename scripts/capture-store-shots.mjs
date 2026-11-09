import { chromium } from "playwright";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const OUT = path.resolve("store-listing");
const URL = "http://127.0.0.1:8767/?nocache=" + Date.now();
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true
});
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
});
await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(1800);

async function grab(kind, file) {
  await page.evaluate((k) => window.storeShot(k), kind);
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.join(OUT, file), type: "png" });
  console.log("wrote", file);
}

await grab("home", "01-home.png");
await grab("human", "02-human-run.png");
await grab("ghost", "03-ghost-switch.png");
await grab("diamond", "05-diamond.png");
await grab("switch", "06-world-switch.png");
await grab("pack", "07-packed.png");
await grab("ghostpack", "08-ghost-pack.png");
await grab("late", "04-reaper-close.png");
await browser.close();
console.log("done", OUT);
