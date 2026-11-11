const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8730/kit/light/demo.html';
const PORT = 'http://localhost:8730/kit/light/portable.html';
const ARGS = ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'];
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
async function launch(extra) { return chromium.launch({ args: ARGS.concat(extra || []) }); }
async function ctx(b, o) {
  const c = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 } }, o || {}));
  await c.route(BLOCK, r => r.abort());
  return c;
}
// instrument draws: wrap transferFromImageBitmap + rAF counting
const INSTRUMENT = () => {
  window.__draws = 0; window.__rafs = 0; window.__drawBy = new Map();
  const o = ImageBitmapRenderingContext.prototype.transferFromImageBitmap;
  ImageBitmapRenderingContext.prototype.transferFromImageBitmap = function (b) { window.__draws++; const k = this.canvas; window.__drawBy.set(k, (window.__drawBy.get(k) || 0) + 1); return o.call(this, b); };
  const r = window.requestAnimationFrame;
  window.requestAnimationFrame = function (f) { window.__rafs++; return r.call(window, f); };
  window.__ctx = 0;
  const g = OffscreenCanvas.prototype.getContext;
  OffscreenCanvas.prototype.getContext = function (t) { const c = g.apply(this, arguments); if (c && /webgl/.test(t)) window.__ctx++; return c; };
  const hg = HTMLCanvasElement.prototype.getContext;
  window.__hctx = {};
  HTMLCanvasElement.prototype.getContext = function (t) { const c = hg.apply(this, arguments); if (c) window.__hctx[t] = (window.__hctx[t] || 0) + 1; return c; };
};
module.exports = { chromium, URL, PORT, ARGS, launch, ctx, INSTRUMENT };
