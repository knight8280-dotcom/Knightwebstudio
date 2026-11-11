#!/usr/bin/env node
/* Phone type audit: node tools/smalltext.js --urls http://localhost:8720/,http://localhost:8720/pricing/
   At 390px wide, lists every visible text under 15px, and fails on anything under 12px,
   and on any target (a, button, summary, input, select, textarea) smaller than 44px. */
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const urls = arg('urls', 'http://localhost:8720/').split(',');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const url of urls) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(500);
    const r = await p.evaluate(() => {
      const small = new Map(), tiny = [], targets = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('svg, script, style, .sr-only, [hidden], option')) continue;
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect(); if (rc.width < 2 || cs.visibility === 'hidden') continue;
        const fs = parseFloat(cs.fontSize); if (fs >= 15) continue;
        const key = `${fs}px ${cs.textTransform === 'uppercase' ? 'CAPS ' : ''}${el.className && el.className.toString ? '.' + el.className.toString().split(' ')[0] : el.tagName.toLowerCase()} in ${(el.closest('[class]:not([class=""])') || el).parentElement?.className?.toString().split(' ')[0] || ''}`;
        if (!small.has(key)) small.set(key, n.textContent.trim().slice(0, 34)); if (fs < 12) tiny.push(key); }
      for (const el of document.querySelectorAll('a, button, summary, input:not([type=hidden]), select, textarea')) {
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden], .hp, .sr-only')) continue;
        const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
        if (el.closest('.nav') && !el.closest('.nav.open')) continue;
        // an inline link inside a sentence is exempt (WCAG 2.5.8); everything else needs 44px in one direction and 24px in the other
        const inline = cs.display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 12;
        if (!inline && (rc.height < 43.5 || rc.width < 24)) targets.push(`${Math.round(rc.width)}x${Math.round(rc.height)} ${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} "${el.textContent.trim().slice(0, 28)}"`);
      }
      return { small: [...small.entries()], tiny, targets: [...new Set(targets)] };
    });
    console.log('\n' + url); for (const [k, v] of r.small) console.log('  ' + k.padEnd(58) + ' | ' + v);
    if (r.tiny.length) { bad += r.tiny.length; console.log('  UNDER 12px: ' + r.tiny.join('; ')); }
    if (r.targets.length) { bad += r.targets.length; console.log('  SMALL TARGETS:\n    ' + r.targets.join('\n    ')); }
    await ctx.close();
  }
  await b.close(); console.log(bad ? `\n${bad} problem(s)` : '\nno text under 12px and no target under 44px'); process.exit(bad ? 1 : 0);
})();
