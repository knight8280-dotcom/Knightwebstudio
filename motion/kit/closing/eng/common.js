const { chromium, firefox, webkit } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:8730/kit/closing/';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
async function launch(extra) { return chromium.launch({ args: ARGS.concat(extra || []) }); }
async function open(b, url, o = {}) {
  const c = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, o.ctx || {}));
  if (o.theme) await c.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, o.theme);
  if (o.init) await c.addInitScript(o.init);
  await c.route(BLOCK, r => r.abort());
  const p = await c.newPage(); p.errs = [];
  p.on('console', m => { if (/error|warning/.test(m.type()) && !/ERR_FAILED|net::/.test(m.text())) p.errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  p.on('pageerror', e => p.errs.push('PE ' + e.message));
  await p.goto(/^http/.test(url) ? url : B + url, { waitUntil: o.wait || 'load' });
  if (!o.nofonts) await p.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  return p;
}
const end = p => p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); });
module.exports = { chromium, firefox, webkit, B, ARGS, BLOCK, launch, open, end };
