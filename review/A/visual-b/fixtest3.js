const { chromium } = require('playwright');
const ranges = a => { const out = []; let s = a[0], p = a[0]; for (const x of a.slice(1)) { if (x - p > 10) { out.push(s + '-' + p); s = x; } p = x; } out.push(s + '-' + p); return out.join(', '); };
const LINES = `el => { const range = document.createRange(); const out = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const re = /[^\\s\\u00a0]+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const rs = range.getClientRects(); const r = rs[0]; if (!r) continue; let L = out.find(l => Math.abs(l.top - r.top) < 8); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0] + (rs.length > 1 ? '[SPLIT]' : '')); } } return out.map(l => l.w.join(' ')).join(' / '); }`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 980, height: 900 } });
  await ctx.route(/plausible|calendly|hcaptcha/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-prairieville/'); await p.waitForTimeout(300);
  const sel = `[...document.querySelectorAll('main h2')].find(h => /home-service/.test(h.textContent))`;
  console.log('h2 css now:', await p.evaluate(`(() => { const cs = getComputedStyle(${sel}); return [cs.textWrap, cs.textWrapStyle, cs.fontSize, cs.maxWidth].join(' | '); })()`));
  const variants = { 'A home-service + "business needs" kept together': 'The kind of site a <span class="nowrap">home-service</span> <span class="nowrap">business needs</span>', 'B "a home-service" + "business needs"': 'The kind of site <span class="nowrap">a home-service</span> <span class="nowrap">business needs</span>' };
  for (const [variant, html] of Object.entries(variants)) {
    await p.evaluate(([s, h]) => { eval(s).innerHTML = h; }, [sel, html]);
    const res = {}; for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 900 }); const s = await p.evaluate(`(${LINES})(${sel})`); (res[s] = res[s] || []).push(w); }
    console.log(variant, '=>', Object.entries(res).map(([k, v]) => JSON.stringify(k) + ' @ ' + ranges(v)).join(' ; '));
  }
  console.log('.nowrap rule:', await p.evaluate(() => { const s = document.createElement('span'); s.className = 'nowrap'; document.body.appendChild(s); const cs = getComputedStyle(s); return cs.whiteSpace + ' / ' + cs.display; }));
  await b.close();
})();
