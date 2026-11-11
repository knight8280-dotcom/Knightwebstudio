// No script, WCAG text spacing, larger text, and reduced motion: anything outside the viewport or invisible?
const { chromium } = require('playwright');
const outside = () => { const vw = document.documentElement.clientWidth; const bad = [];
  for (const e of document.querySelectorAll('main *')) { const r = e.getBoundingClientRect(); if (r.width && r.height && (r.right > vw + 1 || r.left < -1) && getComputedStyle(e).visibility !== 'hidden' && !e.closest('.sr-only')) bad.push((e.className || e.tagName).toString().slice(0, 30) + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); }
  return { vw, scrollW: document.documentElement.scrollWidth, n: bad.length, first: bad.slice(0, 6) }; };
(async () => {
  const b = await chromium.launch();
  // 1. No JavaScript: everything visible
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(400);
    const r = await p.evaluate(() => { let hidden = 0; for (const e of document.querySelectorAll('main .reveal, main .seq, main h2, main h3, main p, main li, main a')) { const cs = getComputedStyle(e); if (e.closest('details:not([open]) .faq-body')) continue; if (+cs.opacity < 1 || cs.visibility === 'hidden') hidden++; } return { hidden, H: document.documentElement.scrollHeight, rows: document.querySelectorAll('details').length }; });
    console.log('no script', w, JSON.stringify(r));
    await p.click('#build summary'); console.log('  no script, row opens on tap:', await p.$eval('#build details', d => d.open));
    await p.screenshot({ path: __dirname + '/nojs-' + w + '.png', fullPage: true }); await ctx.close();
  }
  // 2. WCAG 1.4.12 text spacing
  for (const w of [360, 390, 820, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
    await p.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' }); await p.waitForTimeout(200);
    console.log('text spacing', w, JSON.stringify(await p.evaluate(outside))); if (w === 390) await p.screenshot({ path: __dirname + '/spacing-390.png' }); await ctx.close();
  }
  // 3. Larger default text (text-only zoom): root font size 200% at 820, 130% at 390
  for (const [w, pct] of [[820, 200], [390, 130], [1280, 150]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
    await p.addStyleTag({ content: 'html { font-size: ' + pct + '% }' }); await p.waitForTimeout(200);
    console.log('text ' + pct + '%', w, JSON.stringify(await p.evaluate(outside)));
    const y = await p.evaluate(() => document.querySelector('#win').getBoundingClientRect().top + scrollY - 80); await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(300); await p.screenshot({ path: __dirname + '/zoom-' + w + '-' + pct + '.png' }); await ctx.close();
  }
  // 4. Reflow at 320
  { const ctx = await b.newContext({ viewport: { width: 320, height: 700 }, reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300); console.log('reflow 320', JSON.stringify(await p.evaluate(outside))); await ctx.close(); }
  await b.close();
})();
