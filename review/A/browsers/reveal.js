// Does anything stay invisible while it is on screen? Jumps down each page in the chosen engine and looks.
const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
const engine = process.env.ENGINE || 'webkit';
const pages = (process.env.PAGES || '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/privacy/,/terms/,/checkout/,/404.html').split(',');
(async () => {
  const b = await pw[engine].launch(); let total = 0;
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }, { width: 844, height: 390 }]) {
    const o = { viewport: vp, hasTouch: vp.width < 900 }; if (vp.width < 900 && engine !== 'firefox') o.isMobile = true;
    const ctx = await b.newContext(o);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const path of pages) {
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
      const h = await p.evaluate(() => document.documentElement.scrollHeight); const stuck = new Map();
      for (let y = 0; y < h; y += Math.round(vp.height * 0.7)) {
        await p.evaluate(yy => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, yy); }, y); await p.waitForTimeout(900);
        const s = await p.evaluate(() => { const out = []; const foot = (document.getElementById('mobile-cta') && innerWidth < 1100) ? 96 : 24;
          for (const el of document.querySelectorAll('.reveal, .reveal .seq')) { const cs = getComputedStyle(el); if (parseFloat(cs.opacity) > 0.95) continue; const r = el.getBoundingClientRect(); const vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); if (vis <= 0 || r.height === 0) continue;
            out.push({ s: el.tagName.toLowerCase() + '.' + el.className, op: cs.opacity, top: Math.round(r.top), h: Math.round(r.height), vis: Math.round(vis), ratio: Math.round(vis / r.height * 100) / 100, pastFoot: Math.round(Math.min(r.bottom, innerHeight - foot) - Math.max(r.top, 0)) }); }
          return out; });
        for (const e of s) stuck.set(e.s + '@' + y, e);
      }
      if (stuck.size) { total += stuck.size; console.log(engine, vp.width + 'x' + vp.height, path, 'INVISIBLE WHILE ON SCREEN:'); for (const [k, e] of stuck) console.log('    scrollY', k.split('@').pop(), JSON.stringify(e)); }
      else console.log(engine, vp.width + 'x' + vp.height, path, 'ok');
      await p.close();
    }
    await ctx.close();
  }
  console.log('total', total); await b.close();
})();
