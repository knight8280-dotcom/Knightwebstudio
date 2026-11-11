// Anchor jumps under the sticky header, deep links into closed rows, header stickiness, menu sheet. ENGINE/PWCORE select the browser.
const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright'); const engine = process.env.ENGINE || 'webkit'; const fs = require('fs');
const downlevel = require('./downlevel.js');
(async () => {
  const b = await pw[engine].launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    const o = { viewport: vp, hasTouch: vp.width < 900 }; if (vp.width < 900 && engine !== 'firefox') o.isMobile = true;
    const ctx = await b.newContext(o); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (process.env.DOWNLEVEL) await ctx.route(/\/assets\/css\/styles\.css/, r => r.fulfill({ status: 200, contentType: 'text/css', body: downlevel(fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8'), process.env.DOWNLEVEL) }));
    // 1. in-page links
    for (const path of ['/pricing/', '/consulting/', '/terms/', '/web-design-baton-rouge/']) {
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
      const links = await p.evaluate(() => [...document.querySelectorAll('main a[href^="#"]')].filter(a => a.getClientRects().length && a.getAttribute('href').length > 1).map(a => a.getAttribute('href')).filter((h, i, arr) => arr.indexOf(h) === i).slice(0, 12));
      const res = [];
      for (const h of links) {
        await p.evaluate(() => { document.documentElement.style.scrollBehavior = ''; scrollTo(0, 0); }); await p.waitForTimeout(250);
        await p.evaluate(h => { const a = [...document.querySelectorAll('main a[href="' + h + '"]')].find(a => a.getClientRects().length); a.click(); }, h);
        // wait for smooth scroll to settle
        let last = -1, same = 0; await p.waitForTimeout(500); for (let i = 0; i < 60; i++) { await p.waitForTimeout(120); const y = await p.evaluate(() => scrollY); if (y === last) { if (++same >= 4) break; } else same = 0; last = y; }
        res.push(await p.evaluate(h => { const t = document.getElementById(h.slice(1)); if (!t) return h + ' NO TARGET'; const hb = document.getElementById('site-header').getBoundingClientRect().bottom; const r = t.getBoundingClientRect(); const atEnd = scrollY + innerHeight >= document.documentElement.scrollHeight - 2; return h + ':' + Math.round(r.top - hb) + (atEnd ? '(page end)' : '') + (r.top < hb - 1 ? ' UNDER HEADER' : ''); }, h));
      }
      console.log(`${engine} ${vp.width} ${path} target top minus header bottom (px): ${res.join('  ')}`);
      await p.close();
    }
    // 2. deep link into a closed row
    { const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/#seo'); await p.waitForTimeout(1500);
      console.log(`${engine} ${vp.width} /services/#seo`, JSON.stringify(await p.evaluate(() => { const t = document.getElementById('seo'); const d = t && t.closest('details'); const hb = document.getElementById('site-header').getBoundingClientRect().bottom; return { found: !!t, open: d ? d.open : 'no details', top: t ? Math.round(t.getBoundingClientRect().top - hb) : null, scrollY: Math.round(scrollY) }; })));
      // 3. header sticks; details toggle by click
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1500); }); await p.waitForTimeout(400);
      const hdr = await p.evaluate(() => { const r = document.getElementById('site-header').getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), scrolled: document.getElementById('site-header').classList.contains('scrolled') }; });
      const sum = p.locator('details.faq-item:not([open]) summary').first(); await sum.scrollIntoViewIfNeeded(); const before = await sum.evaluate(s => s.parentElement.open); await sum.click(); await p.waitForTimeout(300); const after = await sum.evaluate(s => [s.parentElement.open, Math.round(s.parentElement.getBoundingClientRect().height), getComputedStyle(s).display, Math.round(s.getBoundingClientRect().width), Math.round(s.querySelector('h3, span, *') ? s.firstElementChild.getBoundingClientRect().width : 0)]);
      console.log(`${engine} ${vp.width} header after scroll`, JSON.stringify(hdr), 'details click:', before, '->', JSON.stringify(after));
      await p.close(); }
    // 4. phone menu sheet geometry
    if (vp.width < 900) { for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 320, height: 568 }]) { const p = await ctx.newPage(); await p.setViewportSize(size); await p.goto('http://localhost:8720/pricing/'); await p.waitForTimeout(400);
        await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 900); }); await p.waitForTimeout(300); await p.click('#nav-toggle'); await p.waitForTimeout(500);
        console.log(`${engine} menu ${size.width}x${size.height}`, JSON.stringify(await p.evaluate(() => { const n = document.getElementById('nav').getBoundingClientRect(), l = document.querySelector('.nav-inner'), lr = l.getBoundingClientRect(); const last = [...document.querySelectorAll('.nav-foot a, .nav-foot .btn')].pop(); l.scrollTop = 99999; const lastR = last ? last.getBoundingClientRect() : null;
          return { nav: [Math.round(n.top), Math.round(n.bottom)], list: [Math.round(lr.top), Math.round(lr.bottom)], listScrolls: l.scrollHeight > l.clientHeight, lastItemReachable: lastR ? Math.round(lastR.bottom) <= innerHeight : null, bodyLocked: document.body.style.overflow, links: document.querySelectorAll('#nav a').length, pageScrollY: Math.round(scrollY) }; })));
        await p.keyboard.press('Escape'); await p.waitForTimeout(300); console.log('     after Escape: open=' + await p.evaluate(() => document.getElementById('nav').classList.contains('open') + ' bodyOverflow="' + document.body.style.overflow + '" scrollY=' + Math.round(scrollY)));
        await p.close(); } }
    await ctx.close();
  }
  await b.close();
})();
