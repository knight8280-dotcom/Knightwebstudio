const { chromium } = require('playwright');
const ranges = a => { const out = []; let s = a[0], p = a[0]; for (const x of a.slice(1)) { if (x - p > 10) { out.push(s + '-' + p); s = x; } p = x; } out.push(s + '-' + p); return out.join(', '); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 980, height: 900 } });
  await ctx.route(/plausible|calendly/, r => r.abort());
  // BR h2 "What a Baton Rouge site needs to do"
  let p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-baton-rouge/'); await p.waitForTimeout(300);
  const lineText = `el => { const range = document.createRange(); const out = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const re = /[^\\s\\u00a0]+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const rs = range.getClientRects(); const r = rs[0]; if (!r) continue; let L = out.find(l => Math.abs(l.top - r.top) < 8); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0] + (rs.length > 1 ? '[SPLIT]' : '')); } } return out.map(l => l.w.join(' ')).join(' / ') + ' {w=' + Math.round(el.getBoundingClientRect().width) + ' fs=' + getComputedStyle(el).fontSize + '}'; }`;
  let res = {};
  for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 900 }); const s = await p.evaluate(`(${lineText})([...document.querySelectorAll('main h2')].find(h => /site needs to do/.test(h.textContent)))`); const k = s.replace(/ \{.*\}/, ''); (res[k] = res[k] || []).push(w); if (w === 980 || w === 1100 || w === 390) console.log(w, s); }
  for (const [k, v] of Object.entries(res)) console.log('BR:', k, '@', ranges(v));
  await p.close();
  p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-prairieville/'); await p.waitForTimeout(300);
  res = {};
  for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 900 }); const s = await p.evaluate(`(${lineText})([...document.querySelectorAll('main h2')].find(h => /home-service/.test(h.textContent)))`); const k = s.replace(/ \{.*\}/, ''); (res[k] = res[k] || []).push(w); }
  for (const [k, v] of Object.entries(res)) console.log('PV:', k, '@', ranges(v));
  await p.close();
  await b.close();
})();
