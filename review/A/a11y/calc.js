const { chromium, BASE, ctxFor } = require('./lib');
(async () => { const b = await chromium.launch(); const ctx = await ctxFor(b, { w: 1280, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/consulting/'); await p.waitForTimeout(300);
  await p.evaluate(() => { window.__m = []; new MutationObserver(ms => ms.forEach(m => { const el = m.target.nodeType === 3 ? m.target.parentElement : m.target; window.__m.push((el.id || el.tagName) + ': "' + el.textContent.trim().slice(0, 60) + '"'); })).observe(document.querySelector('.receipt[aria-live]'), { childList: true, subtree: true, characterData: true }); });
  await p.focus('#c-job'); await p.keyboard.press('End'); await p.keyboard.type('0'); await p.waitForTimeout(200);
  const m = await p.evaluate(() => window.__m); console.log('one keystroke in "Average value of a new job" (400 -> 4000): ' + m.length + ' separate text changes inside the aria-live region:'); m.forEach(x => console.log('   ' + x));
  console.log('aria-atomic=' + await p.evaluate(() => document.querySelector('.receipt[aria-live]').getAttribute('aria-atomic')) + ' ; labels for the changed nodes are separate siblings, not part of the changed node');
  await ctx.close(); await b.close(); })();
