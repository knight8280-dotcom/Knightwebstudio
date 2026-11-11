const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
(async () => {
  const browser = await chromium.launch();
  const mk = async (w, h, mobile) => { const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', isMobile: !!mobile, hasTouch: !!mobile }); await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort()); return ctx; };
  for (const [w, h, mob] of [[1440, 900, 0], [390, 844, 1]]) {
    const ctx = await mk(w, h, mob);
    let page = await ctx.newPage();
    // about towns list
    await page.goto(BASE + '/about/'); await page.waitForTimeout(300);
    console.log('== about towns', w, JSON.stringify(await page.evaluate(() => {
      const list = document.querySelector('ul.towns');
      return { listClass: list && list.className, items: [...list.children].map(li => { const cs = getComputedStyle(li); const r = li.getBoundingClientRect(); return [li.textContent.trim(), Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.height), cs.borderBottomWidth, cs.borderTopWidth]; }) };
    })));
    await page.close();
    // BR price board inset
    page = await ctx.newPage(); await page.goto(BASE + '/web-design-baton-rouge/'); await page.waitForTimeout(300);
    console.log('== BR board', w, JSON.stringify(await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2')].find(e => /Fixed prices/.test(e.textContent)); const board = document.querySelector('.board-tiers').parentElement;
      const out = { boardClass: board.className, h2Left: h.getBoundingClientRect().left };
      const txt = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
      const cells = document.querySelectorAll('.board-tiers a.tier');
      out.cells = [...cells].slice(0, 4).map(c => { const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); const kids = [...c.children].map(k => [k.className || k.tagName, Math.round(txt(k).left * 10) / 10]); return { cls: c.className, left: r.left, padL: cs.paddingLeft, bL: cs.borderLeftWidth, kids }; });
      const p = h.nextElementSibling; out.ledeLeft = p && txt(p).left; return out;
    })));
    await page.close();
    // contact captcha slot
    page = await ctx.newPage(); await page.goto(BASE + '/contact/'); await page.waitForTimeout(300);
    console.log('== contact slot', w, JSON.stringify(await page.evaluate(() => { const s = document.getElementById('hcaptcha-slot'); const cs = getComputedStyle(s); const r = s.getBoundingClientRect(); const ta = document.querySelector('textarea').getBoundingClientRect(); const b = document.querySelector('form button[type=submit], form .btn').getBoundingClientRect(); return { slotH: r.height, minH: cs.minHeight, mt: cs.marginTop, mb: cs.marginBottom, gapTextareaToButton: b.top - ta.bottom, html: s.outerHTML.slice(0, 200), parent: s.parentElement.className }; })));
    await page.close();
    await ctx.close();
  }
  // anchors under sticky header
  for (const [w, h, mob] of [[1440, 900, 0], [390, 844, 1], [820, 1100, 0]]) {
    const ctx = await mk(w, h, mob);
    for (const p of ['/faq/', '/privacy/', '/terms/', '/web-design-baton-rouge/', '/process/', '/work/', '/about/']) {
      const page = await ctx.newPage(); await page.goto(BASE + p); await page.waitForTimeout(300);
      const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('main a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1))]);
      const bad = [];
      for (const id of ids) {
        await page.evaluate(i => { location.hash = ''; location.hash = i; }, id); await page.waitForTimeout(700);
        const r = await page.evaluate(i => { const t = document.querySelector(i); if (!t) return { missing: true }; const hd = document.querySelector('#site-header, .site-header'); const hb = hd ? hd.getBoundingClientRect().bottom : 0; const tr = t.getBoundingClientRect(); const bar = document.getElementById('mobile-cta'); const head = t.matches('h1,h2,h3') ? t : t.querySelector('h2,h3,summary') || t; const hr = head.getBoundingClientRect(); return { headerBottom: Math.round(hb), targetTop: Math.round(tr.top), headingTop: Math.round(hr.top), atBottom: Math.abs(window.innerHeight + scrollY - document.documentElement.scrollHeight) < 3 }; }, id);
        if (r.missing || (r.headingTop < r.headerBottom + 4)) bad.push([id, r]); else if (r.headingTop - r.headerBottom > 140 && !r.atBottom) bad.push([id, 'far', r]);
      }
      console.log('anchors', w, p, ids.length, 'links; problems:', JSON.stringify(bad));
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
