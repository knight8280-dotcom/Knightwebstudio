const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const ranges = a => { const out = []; let s = a[0], p = a[0]; for (const x of a.slice(1)) { if (x - p > 10) { out.push(s + '-' + p); s = x; } p = x; } out.push(s + '-' + p); return out.join(', '); };
const LINES = `el => { const range = document.createRange(); const out = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const re = /[^\\s\\u00a0]+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const r = range.getClientRects()[0]; if (!r) continue; let L = out.find(l => Math.abs(l.top - r.top) < 8); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0]); } } return out.map(l => l.w.join(' ')).join(' / '); }`;
(async () => {
  const browser = await chromium.launch();
  // (a) success headline per state, current CSS vs text-wrap: wrap / pretty
  const bodies = {
    paid: { status: 'complete', payment_status: 'paid', mode: 'payment', plan: 'business-deposit', amount_total: 200000, currency: 'usd' },
    ach: { status: 'complete', payment_status: 'unpaid', mode: 'payment', plan: 'commerce-deposit', amount_total: 400000, currency: 'usd' },
    open: { status: 'open', payment_status: 'unpaid', mode: 'payment', plan: 'starter-deposit', amount_total: 100000, currency: 'usd' },
  };
  for (const st of ['paid', 'ach', 'open']) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe/, r => r.abort());
    await ctx.route(/onrender\.com\/api\/session-status/, r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(bodies[st]) }));
    const page = await ctx.newPage(); await page.goto(BASE + '/checkout/success/?plan=business-deposit&session_id=cs_test_abcdefghijklmnop'); await page.waitForTimeout(700);
    for (const mode of ['current', 'wrap', 'pretty']) {
      await page.evaluate(m => { const h = document.querySelector('h1'); h.style.textWrap = m === 'current' ? '' : m; }, mode);
      const res = {};
      for (let w = 320; w <= 1000; w += 10) { await page.setViewportSize({ width: w, height: 844 }); const s = await page.evaluate(`(${LINES})(document.querySelector('h1'))`); (res[s] = res[s] || []).push(w); }
      console.log(st, mode, Object.entries(res).map(([k, v]) => JSON.stringify(k) + ' @ ' + ranges(v)).join(' ; '));
    }
    console.log(st, 'css', JSON.stringify(await page.evaluate(() => { const h = document.querySelector('h1'); const cs = getComputedStyle(h); return [cs.textWrap || cs.textWrapMode, cs.fontSize]; })));
    await ctx.close();
  }
  // (b) stamps and tilted card vs neighbouring text
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });
  await ctx.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch (e) {} });
  await ctx.route(/plausible\.io|calendly\.com|hcaptcha|js\.stripe|onrender/, r => r.abort());
  for (const p of ['/process/', '/contact/', '/about/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/']) {
    const page = await ctx.newPage(); await page.goto(BASE + p); await page.waitForTimeout(300);
    const hits = {};
    for (let w = 320; w <= 1920; w += 20) {
      await page.setViewportSize({ width: w, height: 844 });
      const r = await page.evaluate(() => {
        const out = [];
        const props = [...document.querySelectorAll('main .stamp, main .bizcard')].filter(e => e.getBoundingClientRect().width > 0);
        const rg = document.createRange();
        for (const pr of props) {
          const b = pr.getBoundingClientRect();
          const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let t;
          while ((t = tw.nextNode())) {
            if (!t.data.trim() || pr.contains(t.parentElement)) continue; const pe = t.parentElement; if (pe.closest('.sr-only,[hidden]')) continue; const cs = getComputedStyle(pe); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
            rg.selectNodeContents(t);
            for (const q of rg.getClientRects()) { if (q.width < 2) continue; const ox = Math.min(b.right, q.right) - Math.max(b.left, q.left), oy = Math.min(b.bottom, q.bottom) - Math.max(b.top, q.top); if (ox > 2 && oy > 2) { out.push(pr.className.split(' ')[0] + ' x "' + t.data.trim().slice(0, 40) + '" ' + Math.round(ox) + 'x' + Math.round(oy)); break; } }
          }
        }
        return { n: props.length, out: [...new Set(out)] };
      });
      for (const o of r.out) { const k = o.replace(/ \d+x\d+$/, ''); (hits[k] = hits[k] || []).push(w + '(' + o.match(/\d+x\d+$/)[0] + ')'); }
    }
    console.log(p, Object.keys(hits).length ? Object.entries(hits).map(([k, v]) => k + ' @ ' + v.slice(0, 6).join(',') + (v.length > 6 ? '… (' + v.length + ' widths)' : '')).join('\n    ') : 'no prop overlaps text');
    await page.close();
  }
  await ctx.close();
  await browser.close();
})();
