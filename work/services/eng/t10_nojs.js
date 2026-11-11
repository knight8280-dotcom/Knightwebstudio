const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const ctx = await b.newContext({ viewport: vp, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(500);
    // can't evaluate with JS disabled? page.evaluate still works via CDP in Playwright even with JS disabled for page scripts.
    let r;
    try { r = await p.evaluate(() => {
      const inv = []; for (const el of document.querySelectorAll('body *')) { if (el.closest('svg, script, .sr-only, .skip-link')) continue; const cs = getComputedStyle(el); const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue; if (cs.display === 'none') continue; let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity; if ((op < 0.99 || cs.visibility === 'hidden') && el.textContent.trim() && !el.closest('.mobile-cta, .header-tel')) inv.push((el.className.toString() || el.tagName) + ' op ' + op + ' vis ' + cs.visibility); }
      const ctl = [...document.querySelectorAll('button, [data-booking], #theme-toggle, #nav-toggle, .mobile-cta')].map(e => [e.id || e.className.toString().slice(0, 30), getComputedStyle(e).display, getComputedStyle(e).visibility, e.getAttribute('href'), e.getAttribute('target')]);
      const nav = [...document.querySelectorAll('.nav-links a')].map(a => { const r = a.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height) + '@' + Math.round(r.top); });
      return { html: document.documentElement.className, inv: [...new Set(inv)].slice(0, 20), ctl, nav, hdr: getComputedStyle(document.getElementById('site-header')).position, H: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, det: [...document.querySelectorAll('details')].map(d => d.open) };
    }); } catch (e) { r = 'evaluate failed: ' + e.message; }
    console.log(`\n== no JS ${vp.width}:`, JSON.stringify(r, null, 0));
    await p.locator('#ecommerce summary').click(); await p.waitForTimeout(200);
    console.log(' click summary without JS opens:', await p.evaluate(() => document.getElementById('ecommerce').open));
    await p.screenshot({ path: `nojs-${vp.width}-top.png` });
    await p.locator('#ecommerce').scrollIntoViewIfNeeded(); await p.screenshot({ path: `nojs-${vp.width}-rows.png` });
    await ctx.close();
  }
  await b.close();
})();
