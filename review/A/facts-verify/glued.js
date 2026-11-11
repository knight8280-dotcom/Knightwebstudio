// Find visible text runs that are glued together with no whitespace in what a visitor copies or a
// reader/extractor sees (innerText), across all 19 pages. Two consecutive visible text nodes count
// as glued when neither side has whitespace at the join and body.innerText contains them concatenated.
const { chromium } = require('playwright');
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/success/','/404.html'];
(async () => {
  const b = await chromium.launch();
  const base = process.argv[2] || 'http://localhost:8720';
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const page = await ctx.newPage();
    await page.route('**/*', r => { const u = new URL(r.request().url()); return u.hostname === 'localhost' ? r.continue() : r.abort(); });
    for (const p of PAGES) {
      await page.goto(base + p, { waitUntil: 'load' });
      await page.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
      const res = await page.evaluate(() => {
        const inner = document.body.innerText.toLowerCase();
        const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const nodes = []; let n;
        while ((n = tw.nextNode())) {
          if (!n.textContent.trim()) { nodes.push({ ws: true }); continue; }
          const el = n.parentElement; if (el.closest('script,style,svg,noscript,template')) continue;
          const r = document.createRange(); r.selectNodeContents(n); const rects = r.getClientRects();
          const cs = getComputedStyle(el);
          const vis = rects.length > 0 && cs.visibility !== 'hidden' && !el.closest('.sr-only');
          nodes.push({ t: n.textContent, vis, el, hiddenAria: !!el.closest('[aria-hidden="true"]') });
        }
        const out = [];
        for (let i = 1; i < nodes.length; i++) {
          const a = nodes[i - 1], c = nodes[i];
          if (a.ws || c.ws || !a.vis || !c.vis) continue;
          if (/\s$/.test(a.t) || /^\s/.test(c.t)) continue;
          const A = a.t.slice(-10), C = c.t.slice(0, 10);
          if (!/[A-Za-z0-9$%.,:;)]$/.test(A) || !/^[A-Za-z0-9$(]/.test(C)) continue;
          // skip joins that are meant to be one word: e.g. knightwebstudio1@<wbr>gmail.com, $2,133</span><small>/mo
          if (inner.includes((A + C).toLowerCase())) {
            const anc = a.el.contains(c.el) ? a.el : (c.el.contains(a.el) ? c.el : (() => { let x = a.el; while (x && !x.contains(c.el)) x = x.parentElement; return x; })());
            out.push({ join: A + '|' + C, a: a.el.tagName + '.' + a.el.className, c: c.el.tagName + '.' + c.el.className, anc: anc.tagName + '.' + anc.className, ariaHidden: a.hiddenAria || c.hiddenAria });
          }
        }
        return out;
      });
      for (const r of res) console.log(w, p, JSON.stringify(r));
    }
    await ctx.close();
  }
  await b.close();
})();
