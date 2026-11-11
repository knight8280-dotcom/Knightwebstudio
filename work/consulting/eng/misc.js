const { chromium } = require('/opt/node-tools/node_modules/playwright');
const URL = 'http://localhost:8720/consulting/';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1100, height: 800 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
  // header button height by width
  let last = null; const runs = [];
  for (let w = 1100; w <= 1340; w += 10) { await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(60); const h = await p.evaluate(() => { const a = document.querySelector('.site-header .btn'); return Math.round(a.getBoundingClientRect().height); }); if (h !== last) { runs.push(`${w}px: ${h}px`); last = h; } }
  console.log('header "Book a free call" button height changes:', runs.join(' | '));
  // sticky receipt vs short viewports
  for (const [w, h] of [[1024, 600], [1024, 768], [1280, 640], [1366, 768], [1440, 900]]) { await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const rc = document.querySelector('#growth-calc .receipt'); const cs = getComputedStyle(rc); const inputs = document.querySelector('.calc-inputs').getBoundingClientRect(); const hdr = document.querySelector('.site-header').getBoundingClientRect(); return { pos: cs.position, top: cs.top, receiptH: Math.round(rc.getBoundingClientRect().height), inputsH: Math.round(inputs.height), room: Math.round(innerHeight - hdr.height - parseFloat(cs.top) + hdr.height), fits: rc.getBoundingClientRect().height <= innerHeight - parseFloat(cs.top) }; });
    // while the last input is in view, how much of the receipt total and CTA is visible?
    await p.evaluate(() => { document.getElementById('c-auto').scrollIntoView({ block: 'center', behavior: 'instant' }); }); await p.waitForTimeout(150);
    const v = await p.evaluate(() => { const vis = el => { const r = el.getBoundingClientRect(); const hdr = document.querySelector('.site-header').getBoundingClientRect().bottom; return r.top >= hdr && r.bottom <= innerHeight; }; return { totalVisible: vis(document.getElementById('r-month')), linesVisible: vis(document.getElementById('r-timeval')), ctaVisible: vis(document.querySelector('#growth-calc .receipt .btn')) }; });
    console.log(`${w}x${h}`, JSON.stringify(r), 'with last field centred:', JSON.stringify(v)); }
  // sticky section heading vs short viewport
  await p.setViewportSize({ width: 1280, height: 640 }); await p.evaluate(() => document.querySelector('#plans').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(150);
  console.log('sticky steps heading at 1280x640:', JSON.stringify(await p.evaluate(() => { const h = document.querySelector('#process .section-head'); const r = h.getBoundingClientRect(); const cs = getComputedStyle(h); return { pos: cs.position, top: Math.round(r.top), bottom: Math.round(r.bottom), headerBottom: Math.round(document.querySelector('.site-header').getBoundingClientRect().bottom) }; })));
  // print
  await p.setViewportSize({ width: 1280, height: 900 }); await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(200);
  console.log('print:', JSON.stringify(await p.evaluate(() => ({ bars: [...document.querySelectorAll('.ledger-bar span')].map(s => Math.round(s.getBoundingClientRect().width)), revealOpacity: [...new Set([...document.querySelectorAll('.reveal')].map(e => getComputedStyle(e).opacity))], headerPos: getComputedStyle(document.querySelector('.site-header')).position, barDisplay: getComputedStyle(document.getElementById('mobile-cta')).display }))));
  await b.close();
})();
