// Evidence shot: /pricing/ care plans at 341x162 (1366x768 laptop at 400% zoom), scrolled slowly to the table, then a tall capture of the area.
const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch(); const ctx = await ctxFor(b, { w: 341, h: 162 }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
  const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y <= H; y += 40) { await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), y); await p.waitForTimeout(25); }
  const t = await p.evaluate(() => { const el = document.querySelector('table.table-stack'); const r = el.getBoundingClientRect(); return { y: Math.round(r.top + scrollY), h: Math.round(r.height), op: getComputedStyle(el).opacity, cls: el.className }; }); console.log(JSON.stringify(t));
  await p.evaluate(yy => scrollTo({ top: yy, behavior: 'instant' }), t.y + 200); await p.waitForTimeout(1500); await p.screenshot({ path: 'shots/zoom/never_341x162_pricing_viewport.png' });
  console.log('after resting on it 1.5s: ' + await p.evaluate(() => getComputedStyle(document.querySelector('table.table-stack')).opacity));
  // tab to a button inside it
  await p.evaluate(() => document.querySelector('table.table-stack a').focus()); await p.waitForTimeout(1200); console.log('focused "' + await p.evaluate(() => document.activeElement.getAttribute('aria-label')) + '" block opacity=' + await p.evaluate(() => getComputedStyle(document.querySelector('table.table-stack')).opacity)); await p.screenshot({ path: 'shots/zoom/never_341x162_pricing_focus.png' });
  // tall capture of the region for the record
  await p.setViewportSize({ width: 341, height: 162 }); await p.screenshot({ path: 'shots/zoom/never_341x162_pricing_region.png', fullPage: true, clip: { x: 0, y: t.y - 260, width: 341, height: 900 } });
  await ctx.close(); await b.close(); })();
