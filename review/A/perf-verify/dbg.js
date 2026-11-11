const { chromium } = require('playwright');
const fs = require('fs');
const PV = __dirname, BASE = 'http://localhost:8720';
const css0 = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8');
const re = /@font-face \{ font-family: "Fraunces Fallback";[^}]*\}/;
const css = css0.replace(re, m => m.replace(/src:[^;]*;/, 'src: url("/__f/gelasio-var.woff2") format("woff2"); font-weight: 700;'));
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const t0 = Date.now();
  await page.route('**/*', async r => {
    const u = r.request().url();
    if (!u.startsWith(BASE)) return r.abort();
    if (u.includes('/__f/')) { console.log(Date.now() - t0, 'stand-in requested'); return r.fulfill({ body: fs.readFileSync(PV + '/fonts/' + u.split('/__f/')[1]), contentType: 'font/woff2' }); }
    if (u.endsWith('/assets/css/styles.css')) return r.fulfill({ body: css, contentType: 'text/css' });
    if (u.includes('fraunces')) { console.log(Date.now() - t0, 'fraunces requested, holding'); await sleep(3000); console.log(Date.now() - t0, 'fraunces released'); }
    r.continue();
  });
  page.goto(BASE + '/about/').catch(() => {});
  const cdp = await ctx.newCDPSession(page);
  for (const t of [800, 1000, 1700]) {
    await sleep(t);
    const { root } = await cdp.send('DOM.getDocument');
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: 'h1' });
    const f = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }).catch(e => ({ err: e.message }));
    const h = await page.evaluate(() => { const r = document.querySelector('h1').getBoundingClientRect(); return [Math.round(r.height), document.fonts.status, [...document.fonts].map(x => x.family + ':' + x.status).join(',')]; });
    console.log(Date.now() - t0, JSON.stringify(f.fonts || f), JSON.stringify(h));
  }
  await b.close();
})();
