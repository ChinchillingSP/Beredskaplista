// End-to-end checks for the built site (index.html + sw.js). Run before pushing a change:
//   cd tests && npm install && npx playwright install chromium && npm test
// It serves the repository at http://localhost:8790/Beredskaplista/ (same path as GitHub Pages)
// and checks offline use, installability, the power-outage mode, the shelter search and the print sheet.
const assert = require("assert");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium, devices } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = 8790;
const URL = `http://localhost:${PORT}/Beredskaplista/`;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json", ".css": "text/css",
  ".woff2": "font/woff2", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (!p.startsWith("/Beredskaplista/")) { res.writeHead(404); return res.end(); }
  p = p.slice("/Beredskaplista".length);
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  });
});

const results = [];
async function check(name, fn) {
  try { await fn(); results.push(["ok", name]); console.log("ok   ", name); }
  catch (e) { results.push(["FAIL", name]); console.log("FAIL ", name, "\n     ", e.message); }
}

(async () => {
  await new Promise(r => server.listen(PORT, r));
  const browser = await chromium.launch();
  const errors = [];

  // Android phone: first visit online, then offline
  const ctx = await browser.newContext({ ...devices["Pixel 5"], colorScheme: "light", acceptDownloads: true });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(e.message));
  const external = [];
  page.on("request", r => { if (!r.url().startsWith(`http://localhost:${PORT}`)) external.push(r.url()); });

  await page.goto(URL);
  await check("service worker takes control", () =>
    page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15000 }));
  await page.waitForTimeout(800);

  await check("manifest has no errors and the page is installable", async () => {
    const cdp = await ctx.newCDPSession(page);
    try {
    const m = await cdp.send("Page.getAppManifest");
    assert.deepStrictEqual(m.errors, []);
    const inst = await cdp.send("Page.getInstallabilityErrors");
    assert.deepStrictEqual(inst.installabilityErrors, []);
    } finally { await cdp.detach(); }
  });

  await check("a value typed in the list is kept", async () => {
    await page.click('[data-tab="list"]');
    await page.fill("#s-water", "12");
    await page.locator("#s-water").blur();
  });

  await check("Excel download works online", async () => {
    const dl = page.waitForEvent("download", { timeout: 15000 });
    await page.click("#dlx");
    assert.match((await dl).suggestedFilename(), /\.xlsx$/);
  });

  await ctx.setOffline(true);
  await page.waitForFunction(() => navigator.onLine === false);
  await page.evaluate(() => history.replaceState(null, "", location.pathname));  // no #tab in the address
  await page.reload();
  await page.waitForTimeout(800);

  await check("opens offline, on the power-outage tab, with the offline bar", async () => {
    assert.ok((await page.title()).length > 0);
    assert.strictEqual(await page.evaluate(() => tab), "blackout");
    assert.ok(await page.isVisible("#offbar"));
    assert.ok(await page.isVisible("#v-blackout .sos"));
  });

  await check("dark theme by default offline when no theme was chosen", async () => {
    assert.strictEqual(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
  });

  await check("the saved list survives offline", async () => {
    await page.click('[data-tab="list"]');
    assert.strictEqual(await page.inputValue("#s-water"), "12");
  });

  await check("headlines come from the saved copy offline", async () => {
    await page.click('[data-tab="wire"]');
    assert.ok(await page.locator("#v-wire li").count() > 5);
  });

  await check("Excel works offline after one online download", async () => {
    await page.click('[data-tab="list"]');
    const dl = page.waitForEvent("download", { timeout: 15000 });
    await page.click("#dlx");
    assert.match((await dl).suggestedFilename(), /\.xlsx$/);
  });

  await check("shelter search works offline and shows direction and coordinates", async () => {
    await page.click('[data-tab="shelter"]');
    await page.fill("#shq", "Gamle Ringeriksvei 53");
    await page.click("#shform button");
    await page.waitForTimeout(200);
    const geo = await page.locator("#shres .geo").first().textContent();
    assert.match(geo, /\d+\.\d{5}, \d+\.\d{5}/);
  });

  await check("one-second timers run only on their own tab", async () => {
    await page.click('[data-tab="blackout"]');
    await page.click("#ocnow");
    assert.deepStrictEqual(await page.evaluate(() => [!!ocTimer, !!wTimer]), [true, false]);
    await page.click('[data-tab="list"]');
    assert.deepStrictEqual(await page.evaluate(() => [!!ocTimer, !!wTimer]), [false, false]);
  });

  await check("no requests to other servers", async () => assert.deepStrictEqual(external, []));
  await ctx.close();

  // Print sheet: one A4 page in every language
  const pctx = await browser.newContext();
  const pp = await pctx.newPage();
  pp.on("pageerror", e => errors.push(e.message));
  await pp.goto(URL);
  await pp.waitForTimeout(500);
  await pp.click('[data-tab="shelter"]');
  await pp.fill("#shq", "1357");
  await pp.click("#shform button");
  await pp.waitForTimeout(200);
  for (const lang of ["nb", "en", "es", "pl", "lt", "uk", "ar", "so", "ti", "tl", "ja"]) {
    await check(`print sheet fits on one A4 page (${lang})`, async () => {
      await pp.click(`[data-lang="${lang}"]`);
      await pp.evaluate(() => renderSheet());
      await pp.emulateMedia({ media: "print" });
      const pdf = await pp.pdf({ format: "A4", preferCSSPageSize: true });
      await pp.emulateMedia({ media: "screen" });
      const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
      assert.strictEqual(pages, 1);
    });
  }
  await pctx.close();

  // iPhone: install steps instead of an install button
  const ictx = await browser.newContext({ ...devices["iPhone 13"] });
  const ip = await ictx.newPage();
  await ip.goto(URL);
  await ip.waitForTimeout(500);
  await check("iPhone shows the Add to Home Screen steps", async () => {
    assert.ok(await ip.isVisible("#install"));
    assert.ok(await ip.isVisible("#inios"));
    assert.ok(await ip.isHidden("#inbtn"));
  });
  await ictx.close();

  await check("no JavaScript errors", async () => assert.deepStrictEqual(errors, []));

  await browser.close();
  server.close();
  const failed = results.filter(r => r[0] === "FAIL").length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})();
