// CLS on every page at 390x844 and 1280x800 with fonts delayed 1.5s and images delayed 2.5s.
// --sim: the two "Fallback" faces resolve to Georgia- and Arial-metric fonts (Gelasio, Liberation Sans),
//        as they do on an iPhone, a Mac or Windows. Without it: whatever this Linux box falls back to.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs'); const path = require('path');
const SIM = process.argv.includes('--sim');
const BASE = (process.argv.find(a => a.startsWith('--base=')) || '--base=http://localhost:8720').slice(7);
const ONLY = (process.argv.find(a => a.startsWith('--pages=')) || '').slice(8);
const FONT_DELAY = parseInt((process.argv.find(a => a.startsWith('--font=')) || '--font=1500').slice(7), 10);
const IMG_DELAY = parseInt((process.argv.find(a => a.startsWith('--img=')) || '--img=2500').slice(6), 10);
let PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
if (ONLY) PAGES = ONLY.split(',');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch(SIM ? { env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } } : {});
  const out = {};
  for (const [vw, vh] of [[390, 844], [1280, 800]]) {
    for (const p of PAGES) {
      const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500, deviceScaleFactor: vw < 500 ? 2 : 1 });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      await ctx.route(/\.woff2(\?.*)?$/, async r => { if (/__sim/.test(r.request().url())) return r.fallback(); await sleep(FONT_DELAY); r.continue(); });
      await ctx.route(/\.(jpg|jpeg|png|webp|avif)(\?.*)?$/, async r => { await sleep(IMG_DELAY); r.continue(); });
      await ctx.addInitScript(() => {
        window.__ls = [];
        const d = n => { if (!n) return '(gone)'; if (n.nodeType !== 1) n = n.parentElement; if (!n) return '(gone)'; let s = n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (typeof n.className === 'string' && n.className.trim() ? '.' + n.className.trim().split(/\s+/).join('.') : ''); const par = n.parentElement; if (par && par !== document.body) s = par.tagName.toLowerCase() + (typeof par.className === 'string' && par.className.trim() ? '.' + par.className.trim().split(/\s+/)[0] : '') + ' > ' + s; return s.slice(0, 110); };
        new PerformanceObserver(l => { for (const e of l.getEntries()) window.__ls.push({ v: e.value, t: Math.round(e.startTime), input: e.hadRecentInput, sy: Math.round(scrollY), src: (e.sources || []).map(s => ({ n: d(s.node), txt: s.node && s.node.textContent ? s.node.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) : '', from: [Math.round(s.previousRect.x), Math.round(s.previousRect.y), Math.round(s.previousRect.width), Math.round(s.previousRect.height)], to: [Math.round(s.currentRect.x), Math.round(s.currentRect.y), Math.round(s.currentRect.width), Math.round(s.currentRect.height)] })) }); }).observe({ type: 'layout-shift', buffered: true });
      });
      const page = await ctx.newPage();
      await page.goto(BASE + p, { waitUntil: 'domcontentloaded' });
      // which fonts paint the h1 and a paragraph before the web fonts arrive?
      await sleep(700);
      let before = null;
      try {
        const cdp = await ctx.newCDPSession(page); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
        const { root } = await cdp.send('DOM.getDocument');
        const fam = async sel => { const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: sel }); if (!nodeId) return null; const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId }); return fonts.map(f => f.familyName + (f.isCustomFont ? '(web)' : '') + ':' + f.glyphCount).join(','); };
        before = { h1: await fam('h1'), p: await fam('main p') };
      } catch (e) { before = String(e).slice(0, 80); }
      const h0 = await page.evaluate(() => document.documentElement.scrollHeight);
      await sleep(Math.max(0, FONT_DELAY + 1200 - 700));
      const h1 = await page.evaluate(() => document.documentElement.scrollHeight);
      await sleep(Math.max(IMG_DELAY - FONT_DELAY, 0) + 2500); // past images and the 4s fail-safe
      const loadShifts = await page.evaluate(() => window.__ls.slice());
      // now scroll down the page like a reader (lazy images arrive late: delayed)
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += Math.round(vh * 0.8)) { await page.evaluate(yy => window.scrollTo(0, yy), y); await sleep(350); }
      await sleep(IMG_DELAY + 600);
      const all = await page.evaluate(() => window.__ls.slice());
      const scrollShifts = all.slice(loadShifts.length);
      const sum = a => a.filter(e => !e.input).reduce((s, e) => s + e.v, 0);
      out[`${p}@${vw}`] = { clsLoad: +sum(loadShifts).toFixed(4), clsScroll: +sum(scrollShifts).toFixed(4), heightBeforeFonts: h0, heightAfterFonts: h1, fontsBefore: before, loadShifts, scrollShifts };
      const top = e => e.src.slice(0, 3).map(s => `${s.n} "${s.txt}" ${s.from.join(',')}→${s.to.join(',')}`).join(' | ');
      console.log(`${(p + '@' + vw).padEnd(34)} load=${sum(loadShifts).toFixed(4)} scroll=${sum(scrollShifts).toFixed(4)} h ${h0}→${h1} fonts ${JSON.stringify(before)}`);
      for (const e of all.filter(e => e.v >= 0.002).sort((a, b) => b.v - a.v).slice(0, 4)) console.log(`      ${e.v.toFixed(4)} t=${e.t} sy=${e.sy} ${top(e)}`);
      await ctx.close();
    }
  }
  fs.writeFileSync(path.join(__dirname, SIM ? 'cls-sim.json' : 'cls-native.json'), JSON.stringify(out, null, 1));
  await browser.close();
})();
