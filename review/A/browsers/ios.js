// iOS-flavoured checks in WebKit at 390x844 (touch): input font sizes, tel links, anchor offsets, sticky ancestors, the phone bar.
const pw = require('/opt/node-tools/node_modules/playwright'); const engine = process.env.ENGINE || 'webkit';
const pages = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'.split(',');
(async () => {
  const b = await pw[engine].launch(); const o = { viewport: { width: 390, height: 844 }, hasTouch: true }; if (engine !== 'firefox') o.isMobile = true;
  const ctx = await b.newContext(o); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const path of pages) {
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const out = {};
      out.smallInputs = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter(e => e.getClientRects().length).map(e => [e.id || e.name, parseFloat(getComputedStyle(e).fontSize)]).filter(x => x[1] < 16);
      out.inputs = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), select, textarea')].filter(e => e.getClientRects().length).length;
      const tels = [...document.querySelectorAll('a[href^="tel:"]')]; out.tel = [...new Set(tels.map(a => a.getAttribute('href')))]; out.telCount = tels.length;
      out.mailto = [...new Set([...document.querySelectorAll('a[href^="mailto:"]')].map(a => a.getAttribute('href').split('?')[0]))];
      // phone numbers in text that are not inside a tel link (iOS will auto-link them)
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); const loose = [];
      while (w.nextNode()) { const n = w.currentNode; if (/\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}/.test(n.textContent) && !n.parentElement.closest('a, script, style')) loose.push(n.parentElement.tagName + '.' + n.parentElement.className + ': ' + n.textContent.trim().slice(0, 60)); }
      out.looseNumbers = loose;
      out.meta = [...document.querySelectorAll('meta[name="viewport"], meta[name="format-detection"]')].map(m => m.name + '=' + m.content);
      // sticky elements and any ancestor that would trap them
      out.sticky = [...document.querySelectorAll('body *')].filter(e => getComputedStyle(e).position === 'sticky').map(e => { const trap = []; for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) { const cs = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(cs.overflowX + cs.overflowY)) trap.push(a.tagName + '.' + a.className + ' ' + cs.overflowX + '/' + cs.overflowY); } return e.tagName + '.' + (e.className || e.id) + (trap.length ? ' TRAPPED BY ' + trap.join(', ') : ''); });
      out.bodyOverflow = getComputedStyle(document.body).overflowX + '/' + getComputedStyle(document.body).overflowY + ' html ' + getComputedStyle(document.documentElement).overflowX;
      const cta = document.getElementById('mobile-cta'); if (cta) { const cs = getComputedStyle(cta); out.cta = { padB: cs.paddingBottom, padT: cs.paddingTop, h: cta.getBoundingClientRect().height, pos: cs.position, btnH: [...cta.querySelectorAll('.btn')].map(b => Math.round(b.getBoundingClientRect().height)) }; }
      return out;
    });
    console.log(path, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
