// node wk.js <engine> <out.png> <url-path> <w> <h> <what: end|sel> [noshader]
process.env.PLAYWRIGHT_BROWSERS_PATH = __dirname + '/../.browsers-flat';
const pw = require('playwright');
const [eng, out, path, w, h, what, ...flags] = process.argv.slice(2);
(async () => {
  const b = await pw[eng].launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +h }, reducedMotion: flags.includes('reduce') ? 'reduce' : 'no-preference' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERROR', String(e)));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('CONSOLE', m.type(), m.text().slice(0, 200)); });
  if (flags.includes('noshader')) await p.route('**/shader.js', r => r.abort());
  await p.goto('http://localhost:8730' + path, { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.addStyleTag({ content: 'html{scroll-behavior:auto !important} .reveal{opacity:1 !important;transform:none !important}' });
  if (what === 'end') { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); }
  else { await p.locator(what).first().scrollIntoViewIfNeeded(); }
  await p.waitForTimeout(1800);
  console.log(await p.evaluate(() => JSON.stringify({ live: document.querySelectorAll('.kws-shader.is-live').length, layers: document.querySelectorAll('.kws-shader').length, canv: document.querySelectorAll('.kws-shader canvas').length, gl: (() => { try { const c = new OffscreenCanvas(4, 4); const g = c.getContext('webgl', { failIfMajorPerformanceCaveat: true }); return g ? g.getParameter(g.VERSION) : 'none'; } catch (e) { return 'err ' + e; } })() })));
  await p.screenshot({ path: out });
  await b.close();
})();
