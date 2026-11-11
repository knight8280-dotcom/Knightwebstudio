const { chromium } = require('/opt/node-tools/node_modules/playwright');
// normal motion; scroll like a visitor, then screenshot viewport region around selector
(async () => {
  const [w, path, sel, name, idx] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: +w, height: +w < 700 ? 844 : 900 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('http://localhost')) r.continue(); else r.abort(); });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
  await p.waitForTimeout(600);
  const y = await p.evaluate(([sel, idx]) => { const e = document.querySelectorAll(sel)[idx || 0]; return e.getBoundingClientRect().top + scrollY; }, [sel, +(idx || 0)]);
  for (let s = 0; s < y; s += 500) { await p.evaluate(s => window.scrollTo(0, s), s); await p.waitForTimeout(120); }
  await p.evaluate(y => window.scrollTo(0, y - 90), y);
  await p.waitForTimeout(3500);
  await p.screenshot({ path: __dirname + '/shots/' + name + '.png' });
  // report any still-invisible text in viewport
  const inv = await p.evaluate(() => { const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.nodeValue.trim(); if (!t) continue; const el = n.parentElement; const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.width === 0) continue; let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) { o *= parseFloat(getComputedStyle(e).opacity); } if (o < 0.5 && getComputedStyle(el).visibility !== 'hidden') out.push(o.toFixed(2) + ' ' + t.slice(0, 60)); } return out; });
  console.log(name, 'low-opacity text in view:', JSON.stringify(inv));
  await b.close();
})();
