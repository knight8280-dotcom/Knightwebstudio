#!/usr/bin/env node
/* Horizontal-overflow sweep: node tools/widths.js --urls http://localhost:8720/,http://localhost:8720/pricing/ [--from 360 --to 1920 --step 20]
   Loads each URL at every width, waits for layout, and reports any width where the page is wider than the window
   (or where an element sticks out past the right edge). Exit code 1 if any. */
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const urls = arg('urls', 'http://localhost:8720/').split(',');
const from = +arg('from', 360), to = +arg('to', 1920), step = +arg('step', 20);
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const url of urls) {
    const ctx = await b.newContext({ viewport: { width: from, height: 900 }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const fails = [];
    for (let w = from; w <= to; w += step) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(60);
      const r = await p.evaluate(() => {
        const over = document.documentElement.scrollWidth - innerWidth;
        // body clips overflow, so also look for anything that pokes out past the right edge
        let worst = 0, who = '';
        for (const el of document.querySelectorAll('main *, header *, footer *')) {
          const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden') continue;
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
          if (el.closest('.sr-only, .hp, .jump') || (el.ownerSVGElement)) continue;
          const d = rc.right - innerWidth; if (d > worst + .5) { worst = d; who = [el.parentElement && el.parentElement.parentElement, el.parentElement, el].filter(Boolean).map(e => e.tagName.toLowerCase() + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '')).join(' > '); }
        }
        return { over, worst: Math.round(worst), who };
      });
      if (r.over > 0 || r.worst > 0) fails.push(`${w}px: page +${r.over}, element +${r.worst} ${r.who}`);
    }
    console.log(url, fails.length ? `\n  ${fails.join('\n  ')}` : `no horizontal overflow from ${from} to ${to}`);
    bad += fails.length; await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
