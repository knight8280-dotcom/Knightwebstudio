// Tries each proposed fix in the browser only (DOM/CSS injected into the loaded page; nothing on disk changes).
const { chromium } = require('playwright');
const ranges = a => { const out = []; let s = a[0], p = a[0]; for (const x of a.slice(1)) { if (x - p > 10) { out.push(s + '-' + p); s = x; } p = x; } out.push(s + '-' + p); return out.join(', '); };
const LINES = `el => { const range = document.createRange(); const out = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { if (getComputedStyle(n.parentElement).display === 'none') continue; const re = /[^\\s\\u00a0]+/g; let m; while ((m = re.exec(n.data))) { range.setStart(n, m.index); range.setEnd(n, m.index + m[0].length); const rs = range.getClientRects(); const r = rs[0]; if (!r) continue; let L = out.find(l => Math.abs(l.top - r.top) < 8); if (!L) { L = { top: r.top, w: [] }; out.push(L); } L.w.push(m[0] + (rs.length > 1 ? '[SPLIT]' : '')); } } return out.map(l => l.w.join(' ')).join(' / '); }`;
const sweep = async (page, js, from, to, step) => { const res = {}; for (let w = from; w <= to; w += step) { await page.setViewportSize({ width: w, height: 900 }); const s = await page.evaluate(js); (res[s] = res[s] || []).push(w); } return Object.entries(res).map(([k, v]) => JSON.stringify(k) + ' @ ' + ranges(v)).join(' ; '); };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 980, height: 900 } });
  await ctx.route(/plausible|calendly|hcaptcha/, r => r.abort());
  // 1 Prairieville h2
  let p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-prairieville/'); await p.waitForTimeout(300);
  await p.evaluate(() => { const h = [...document.querySelectorAll('main h2')].find(h => /home-service/.test(h.textContent)); h.innerHTML = 'The kind of site a <span class="nowrap">home-service</span> business needs'; });
  console.log('PV h2 fixed:', await sweep(p, `(${LINES})([...document.querySelectorAll('main h2')].find(h => /home-service/.test(h.textContent)))`, 320, 1920, 10)); await p.close();
  // 4 Baton Rouge h2
  p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-baton-rouge/'); await p.waitForTimeout(300);
  for (const f of [.9, .88, .86]) { await p.addStyleTag({ content: `@media (min-width:980px) and (max-width:1279.98px){[data-page="city"] #what-we-build h2{font-size:calc(var(--fs-h2)*${f})}}` }); console.log('BR h2 factor', f, ':', await sweep(p, `(${LINES})(document.querySelector('#what-we-build h2'))`, 960, 1300, 10)); }
  await p.close();
  // 2a city eyebrow
  for (const c of ['denham-springs', 'baton-rouge', 'gonzales', 'prairieville']) {
    p = await ctx.newPage(); await p.goto('http://localhost:8720/web-design-' + c + '/'); await p.waitForTimeout(300);
    await p.evaluate(() => { const e = document.querySelector('.page-head .eyebrow > span'); const halves = e.querySelectorAll('.nowrap'); const town = halves[1].textContent.replace(/^·\s*/, ''); e.innerHTML = '<span class="nowrap">' + halves[0].textContent + '</span><span class="sep"> · </span><span class="nowrap">' + town + '</span>'; });
    await p.addStyleTag({ content: '@media (max-width:599.98px){[data-page="city"] .page-head .eyebrow .sep{display:none}[data-page="city"] .page-head .eyebrow .sep + span{display:block}}' });
    console.log('eyebrow fixed', c, ':', await sweep(p, `(${LINES})(document.querySelector('.page-head .eyebrow'))`, 320, 700, 20)); await p.close();
  }
  // 2b work eyebrows
  p = await ctx.newPage(); await p.goto('http://localhost:8720/work/'); await p.waitForTimeout(300);
  await p.evaluate(() => { for (const e of document.querySelectorAll('.case .eyebrow')) { const [a, bb] = e.textContent.split(/ ·\s/); e.innerHTML = '<span><span class="nowrap">' + a + '</span><span class="sep"> · </span><span class="nowrap">' + bb.replace('&', '&amp;') + '</span></span>'; } });
  await p.addStyleTag({ content: '@media (max-width:1279.98px){[data-page="work"] .case .eyebrow .sep{display:none}[data-page="work"] .case .eyebrow .sep + span{display:block}}' });
  for (const i of [0, 1, 2]) console.log('work eyebrow fixed', i, ':', await sweep(p, `(${LINES})(document.querySelectorAll('.case .eyebrow')[${i}])`, 320, 1920, 20));
  await p.setViewportSize({ width: 390, height: 900 }); await p.evaluate(() => document.querySelectorAll('.case .eyebrow')[2].scrollIntoView({ block: 'center' })); await p.waitForTimeout(600); await p.screenshot({ path: __dirname + '/evidence/fix-preview-work-eyebrow-390.png' });
  await p.close();
  await b.close();
})();
