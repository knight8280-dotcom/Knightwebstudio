const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible|calendly/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  const snap = () => p.evaluate(() => ['.page-head-aside', '.page-head-aside svg', '.points', '.head-copy', '.prints', '.print'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [s, Math.round(r.left), Math.round(r.top + scrollY), Math.round(r.width), Math.round(r.height)].join(' '); }).join(' | '));
  const widths = [360, 390, 600, 820, 1000, 1100, 1280, 1440];
  const before = {}; for (const w of widths) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80); before[w] = await snap(); }
  // remove the suspected-redundant declarations
  await p.evaluate(() => { const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('pages/start.css')); const visit = rules => { for (const r of rules) { if (r.cssRules && r.type === CSSRule.MEDIA_RULE) visit(r.cssRules); else if (r.selectorText === '[data-page="start"] .page-head-aside') { r.style.removeProperty('width'); r.style.removeProperty('justify-self'); } } }; visit(sheet.cssRules); });
  let diff = 0; for (const w of widths) { await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80); const a = await snap(); if (a !== before[w]) { diff++; console.log(w, 'DIFFERS\n  before', before[w], '\n  after ', a); } }
  console.log('removing width/justify-self from both .page-head-aside rules changes layout at', diff, 'of', widths.length, 'widths');
  await b.close();
})();
