// nojs.js: every page with JavaScript off. Nothing that holds text may be invisible; the menu must be reachable; no dead booking-only button.
const { chromium } = require('playwright');
const PATHS = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'.split(',');
const out = process.argv[2];
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, javaScriptEnabled: false, colorScheme: 'light' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of PATHS) {
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(250);
      const r = await page.evaluate(() => 0).catch(() => null);   // evaluate still works in Playwright with JS off? (it does: runs in an isolated world)
      const facts = await page.evaluate(() => {
        const hidden = [];
        const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
        while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('svg, script, style, noscript, .sr-only, [hidden], template, option, [aria-hidden="true"]')) continue;
          if (el.closest('details:not([open])') && !el.closest('summary')) continue;
          let e = el, why = ''; while (e && e !== document.body) { const cs = getComputedStyle(e); if (cs.display === 'none') { why = 'display:none on ' + e.tagName + '.' + e.className; break; } if (cs.visibility === 'hidden') { why = 'visibility:hidden'; break; } if (+cs.opacity < 0.99) { why = 'opacity ' + cs.opacity + ' on ' + e.tagName + '.' + e.className; break; } e = e.parentElement; }
          if (why) hidden.push(n.textContent.trim().slice(0, 40) + ' <- ' + why); }
        const navLinks = [...document.querySelectorAll('.nav-links a')].filter(a => { const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +getComputedStyle(a.closest('.nav')).opacity > 0.99; }).length;
        const deadButtons = [...document.querySelectorAll('#theme-toggle, .nav-toggle, .booking-only')].filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map(x => x.id || x.className);
        const html = document.documentElement;
        return { hidden: [...new Set(hidden)].slice(0, 8), hiddenCount: hidden.length, navLinks, navTotal: document.querySelectorAll('.nav-links a').length, deadButtons, js: html.classList.contains('js'), overflow: html.scrollWidth - innerWidth, height: html.scrollHeight,
          details: document.querySelectorAll('details').length, bar: (() => { const m = document.getElementById('mobile-cta'); return m ? getComputedStyle(m).display : 'none'; })(), headerPos: getComputedStyle(document.querySelector('.site-header')).position };
      });
      const flag = facts.hiddenCount || facts.deadButtons.length || facts.overflow > 0 || (facts.navTotal && facts.navLinks !== facts.navTotal) || facts.js;
      if (flag) bad++;
      console.log((flag ? 'CHECK ' : 'ok    ') + p + '@' + w, JSON.stringify(facts));
      if (out && ['/', '/consulting/', '/pricing/', '/faq/', '/contact/', '/checkout/', '/services/'].includes(p)) await page.screenshot({ path: `${out}/${(p.replace(/\//g, '_') || '_home')}-${w}.png`, fullPage: w > 700 ? false : false });
      await page.close();
    }
    await ctx.close();
  }
  await b.close(); console.log(bad ? bad + ' page/width runs to check' : 'all pages readable with scripts off'); process.exit(bad ? 1 : 0);
})();
