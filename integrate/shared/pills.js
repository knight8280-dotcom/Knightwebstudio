const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 800 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const path of ['/', '/web-design-gonzales/']) { const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.evaluate(() => document.fonts.ready);
    for (const css of ['', '[data-page="home"] .who .pills { max-width: none !important; }']) { if (css) await p.addStyleTag({ content: css }); const out = [];
      for (const w of [360, 390, 430, 600, 760, 820, 980, 1100, 1280, 1440, 1920]) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(80);
        out.push(w + ':' + await p.evaluate(() => { const ul = document.querySelector('.pills'); const rows = {}; [...ul.children].forEach(li => { const t = Math.round(li.getBoundingClientRect().top); rows[t] = (rows[t] || 0) + 1; }); return Object.values(rows).join('+') + '(' + Math.round(ul.getBoundingClientRect().width) + ')'; })); }
      console.log(path, css ? 'no max-width' : 'as is      ', out.join('  ')); if (path !== '/') break; }
    await p.close(); }
  await b.close(); })();
