// For each page and width: list fact-bearing text that is in the DOM but not visible to a sighted visitor.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
const FACT = /\$\d|example|estimate|guarantee|\babout\b|\d+\s*(days?|weeks?|months?|hours?|min)|six months|illustration|not a /i;
(async () => {
  const b = await chromium.launch();
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, javaScriptEnabled: true });
    await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
    const p = await ctx.newPage();
    for (const path of PAGES) {
      await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.waitForTimeout(250);
      // open all details so closed ones do not count
      const res = await p.evaluate((src) => {
        const FACT = new RegExp(src, 'i');
        document.querySelectorAll('details').forEach(d => d.open = true);
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walker.nextNode())) {
          const t = n.nodeValue.replace(/\s+/g, ' ').trim();
          if (!t || !FACT.test(t)) continue;
          const el = n.parentElement;
          if (el.closest('script,style,noscript,template,svg,select')) continue;
          let why = null;
          for (let e = el; e && e !== document.body; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.display === 'none') { why = 'display:none on ' + e.tagName.toLowerCase() + '.' + (e.className || '').toString().split(' ').join('.') + (e.hidden ? '[hidden]' : ''); break; }
            if (cs.visibility === 'hidden') { why = 'visibility:hidden'; break; }
            if (parseFloat(cs.opacity) === 0 && !e.classList.contains('reveal') && !e.closest('.reveal,.seq')) { why = 'opacity:0 on ' + e.className; break; }
          }
          if (!why) {
            const r = document.createRange(); r.selectNodeContents(n); const rc = r.getBoundingClientRect();
            if (rc.width < 2 || rc.height < 2) why = 'zero box';
            else {
              // sr-only style clipping
              for (let e = el; e && e !== document.body; e = e.parentElement) {
                const cs = getComputedStyle(e);
                if ((cs.clip && cs.clip !== 'auto') || (cs.clipPath && cs.clipPath !== 'none' && /inset\(50%|inset\(100%/.test(cs.clipPath))) { why = 'sr-only (' + (e.className || e.tagName) + ')'; break; }
                if (cs.overflow !== 'visible' && e.getBoundingClientRect().width <= 2) { why = 'clipped 1px'; break; }
              }
            }
          }
          if (why) out.push(why + ' :: ' + t.slice(0, 160));
        }
        return out;
      }, FACT.source);
      console.log('== ' + w + ' ' + path + ' (' + res.length + ')');
      for (const r of res) console.log('   ' + r);
    }
    await ctx.close();
  }
  await b.close();
})();
