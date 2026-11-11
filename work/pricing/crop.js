// Screenshot a region: node crop.js WIDTH SELECTOR OUT [theme] [pad] [height]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const [w, sel, out, theme = 'light', pad = '24', vh] = process.argv.slice(2);
  const width = parseInt(w, 10);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height: parseInt(vh || (width < 700 ? '844' : '900'), 10) }, deviceScaleFactor: width < 700 ? 2 : 1, colorScheme: theme });
  const p = await ctx.newPage();
  await p.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await p.goto(process.env.URL || 'http://localhost:8720/pricing/', { waitUntil: 'networkidle' });
  await p.evaluate(t => { document.documentElement.setAttribute('data-theme', t); document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')); }, theme);
  await p.addStyleTag({ content: '.site-header{position:static!important}.mobile-cta{display:none!important}*{transition:none!important}' });
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  const padn = parseInt(pad, 10);
  const full = await p.evaluate(() => ({ w: document.documentElement.clientWidth, h: document.documentElement.scrollHeight, y: scrollY }));
  const clip = { x: Math.max(0, box.x - padn), y: Math.max(0, box.y + full.y - padn), width: Math.min(full.w, box.width + 2 * padn), height: box.height + 2 * padn };
  clip.width = Math.min(clip.width, full.w - clip.x);
  await p.screenshot({ path: out, fullPage: true, clip });
  console.log(out, Math.round(box.width) + 'x' + Math.round(box.height));
  await b.close();
})();
