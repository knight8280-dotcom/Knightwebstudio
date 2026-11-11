// Quick look: node s.js <out.png> [--page demo.html] [--w 1440] [--h 900] [--theme light] [--sel css] [--off 110] [--dsf 1] [--wait 1500] [--speed N] [--reduce] [--nojs] [--full] [--touch] [--eval js]
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const a = process.argv.slice(2), out = a[0], o = {};
for (let i = 1; i < a.length; i++) if (a[i].startsWith('--')) { const k = a[i].slice(2); o[k] = (a[i + 1] && !a[i + 1].startsWith('--')) ? a[++i] : true; }
(async () => {
  const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const w = +(o.w || 1440), h = +(o.h || (w < 700 ? 844 : 900)), theme = o.theme || 'light', page = o.page || 'demo.html';
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, deviceScaleFactor: +(o.dsf || (w < 700 ? 2 : 1)), reducedMotion: o.reduce ? 'reduce' : 'no-preference', javaScriptEnabled: !o.nojs, hasTouch: !!o.touch });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); localStorage.setItem('bare-theme', t); sessionStorage.setItem('kws-crest', '1'); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  if (o.speed) await ctx.addInitScript(sp => { window.__speed = sp; }, +o.speed);
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); }); p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  await p.goto('http://localhost:8730/kit/light/' + page); await p.waitForTimeout(+(o.wait || 1500)); if (o.speed) { await p.evaluate(sp => document.querySelectorAll('[data-kws="shader"]').forEach(el => { KWS.shader.mount(el)(); KWS.shader.mount(el, { speed: sp }); }), +o.speed); await p.waitForTimeout(600); }
  if (o.sel) { await p.evaluate(([s, off]) => { const r = document.querySelector(s).getBoundingClientRect(); window.scrollTo({ top: scrollY + r.top - off, behavior: 'instant' }); }, [o.sel, +(o.off || 110)]); await p.waitForTimeout(+(o.wait2 || 1400)); }
  if (o.eval) { const r = await p.evaluate(o.eval); if (r !== undefined) console.log(JSON.stringify(r)); await p.waitForTimeout(+(o.wait3 || 600)); }
  await p.screenshot({ path: out, fullPage: !!o.full });
  if (errs.length) console.log(errs.slice(0, 12).join('\n'));
  await b.close();
})();
