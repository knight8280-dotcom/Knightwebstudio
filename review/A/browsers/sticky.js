const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright'); const engine = process.env.ENGINE || 'webkit'; const fs = require('fs'); const downlevel = require('./downlevel.js');
(async () => {
  const b = await pw[engine].launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  if (process.env.DOWNLEVEL) await ctx.route(/\/assets\/css\/styles\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: downlevel(fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'), process.env.DOWNLEVEL) }));
  for (const path of ['/', '/services/', '/consulting/', '/contact/', '/process/', '/about/', '/faq/', '/pricing/', '/work/', '/web-design-baton-rouge/']) {
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    const n = await p.evaluate(() => { window.__st = [...document.querySelectorAll('main *')].filter(e => getComputedStyle(e).position === 'sticky'); return window.__st.length; });
    const res = [];
    for (let i = 0; i < n; i++) {
      const r = await p.evaluate(async i => { const el = window.__st[i]; const par = el.parentElement; document.documentElement.style.scrollBehavior = 'auto'; const pr = par.getBoundingClientRect(); const top0 = pr.top + scrollY; const room = pr.height - el.getBoundingClientRect().height;
        if (room < 40) return { s: el.tagName + '.' + el.className, room: Math.round(room), note: 'no room to travel' };
        scrollTo(0, top0 + room / 2); await new Promise(r => setTimeout(r, 250)); const t = el.getBoundingClientRect().top; const want = parseFloat(getComputedStyle(el).top);
        return { s: el.tagName + '.' + el.className.slice(0, 30), room: Math.round(room), topNow: Math.round(t), stickAt: Math.round(want), stuck: Math.abs(t - want) < 2 }; }, i);
      res.push(JSON.stringify(r));
    }
    console.log(engine, path, n ? res.join('  ') : 'no sticky elements in main'); await p.close();
  }
  await b.close();
})();
