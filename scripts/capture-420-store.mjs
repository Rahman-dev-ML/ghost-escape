import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const OUT = path.resolve("store-listing/aso-420");
const URL = "http://127.0.0.1:8771/?v=store420";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true
});
const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true
});

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => {
  const load = document.getElementById("loading");
  return load && load.hidden;
}, null, { timeout: 90000 });
await page.waitForTimeout(800);

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: "png" });
  console.log("wrote", name);
}

await shot("01-home.png");

await page.evaluate(() => {
  localStorage.clear();
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.getElementById("loading")?.hidden, null, { timeout: 90000 });
await page.waitForTimeout(600);

const play = page.locator("#play");
await play.click();
await page.waitForTimeout(500);
const ready = page.locator("#ready");
if (await ready.count()) {
  await ready.click();
  await page.waitForTimeout(700);
}
await shot("02-hallway.png");

// nudge look / move for variety
await page.evaluate(() => {
  if (window.__qa) {
    window.__qa.freeze(false);
    window.__qa.save.tutorial = true;
    window.__qa.save.hauntTips = true;
  }
});
await page.mouse.move(800, 900);
await page.mouse.down();
await page.mouse.move(500, 900, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(400);
await shot("03-look.png");

const mapBtn = page.locator("#mapButton");
if (await mapBtn.count()) {
  await mapBtn.click();
  await page.waitForTimeout(500);
  await shot("04-map.png");
  await page.locator("#mapClose").click().catch(() => {});
  await page.waitForTimeout(400);
}

await page.locator("#pause").click().catch(() => {});
await page.waitForTimeout(400);
await shot("05-pause.png");

await browser.close();
console.log("done", OUT);
