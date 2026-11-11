const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
    for (const p of PAGES) {
      const page = await ctx.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const out = { invisible: [], hiddenAttr: [], none: [], over: document.documentElement.scrollWidth > innerWidth };
        const seen = new Set();
        for (const el of document.querySelectorAll('body *')) {
          if (['SCRIPT','STYLE','NOSCRIPT','TEMPLATE'].includes(el.tagName) || el.closest('svg,noscript,script')) continue;
          const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(' ').replace(/\s+/g, ' ').trim();
          if (!own) continue;
          let op = 1, vis = true, none = false, hid = false, sr = false;
          for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); op *= parseFloat(cs.opacity); if (cs.visibility === 'hidden') vis = false; if (cs.display === 'none') { none = true; if (e.hasAttribute('hidden')) hid = true; } if (e.classList.contains('sr-only') || (cs.position === 'absolute' && cs.clip !== 'auto' && cs.width === '1px')) sr = true; }
          const r = el.getBoundingClientRect();
          const tag = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
          const rec = tag + ' "' + own.slice(0, 40) + '"';
          if (sr) continue;
          if (hid) { out.hiddenAttr.push(rec); continue; }
          if (none) { out.none.push(rec); continue; }
          if (op < 0.99 || !vis) out.invisible.push(rec + ' op=' + op.toFixed(2) + ' vis=' + vis);
          else if (r.width === 0 || r.height === 0) out.invisible.push(rec + ' zero box');
          else if (r.right < 0 || r.left > innerWidth + 2) out.invisible.push(rec + ' off screen x=' + Math.round(r.left));
        }
        const menu = [...document.querySelectorAll('#nav a')].filter(a => a.getBoundingClientRect().height > 0).length;
        const book = [...document.querySelectorAll('[data-booking]')].filter(a => a.getBoundingClientRect().height > 0).map(a => a.getAttribute('href'));
        const tt = document.getElementById('theme-toggle'), nt = document.getElementById('nav-toggle');
        return { ...out, menu, book: [...new Set(book)], toggles: [tt && tt.getBoundingClientRect().height, nt && nt.getBoundingClientRect().height], H: document.documentElement.scrollHeight };
      });
      console.log(`${w} ${p} | menu links shown: ${r.menu} | booking hrefs: ${r.book.join(',')} | toggles: ${r.toggles} | overflow: ${r.over}`);
      if (r.invisible.length) console.log('   INVISIBLE:', r.invisible.slice(0, 12).join(' ; '));
      if (r.none.length) console.log('   display:none (no [hidden]):', [...new Set(r.none)].slice(0, 14).join(' ; '));
      if (r.hiddenAttr.length) console.log('   [hidden]:', [...new Set(r.hiddenAttr)].slice(0, 10).join(' ; '));
      await page.close();
    }
    await ctx.close();
  }
  await b.close();
})();
