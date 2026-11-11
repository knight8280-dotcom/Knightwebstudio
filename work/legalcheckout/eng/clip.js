const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
const ALL = Object.assign({ privacy: { url: '/privacy/' }, terms: { url: '/terms/' } }, S);
(async () => {
  const jobs = JSON.parse(process.argv[2]); const browser = await chromium.launch();
  for (const j of jobs) {
    const s = ALL[j.state]; const [w, h] = j.size;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: j.theme || 'light', deviceScaleFactor: j.dpr || 2, reducedMotion: 'reduce', javaScriptEnabled: !s.nojs });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, j.theme || 'light');
    const { stripeStub, cors } = require('./lib.js');
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await ctx.route(/js\.stripe\.com/, r => s.stripe ? r.fulfill({ status: 200, contentType: 'text/javascript', body: stripeStub(s.stripe) }) : r.abort());
    await ctx.route(/onrender\.com/, r => { if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors }); if (!s.server || s.server === 'abort') return r.abort(); if (s.server === 'hang') return; return r.fulfill(s.server); });
    const page = await ctx.newPage(); await page.goto(base + s.url, { waitUntil: 'load' }); await page.waitForTimeout(s.wait || 1000);
    if (j.focus) await page.focus(j.focus);
    const el = page.locator(j.sel).first(); await el.scrollIntoViewIfNeeded();
    const box = await el.boundingBox(); const pad = j.pad == null ? 16 : j.pad;
    await page.screenshot({ path: 'shots/' + j.name + '.png', clip: { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(w, box.width + pad * 2), height: Math.min(j.maxh || 900, box.height + pad * 2) } });
    console.log(j.name, Math.round(box.width) + 'x' + Math.round(box.height));
    await ctx.close();
  }
  await browser.close();
})();
