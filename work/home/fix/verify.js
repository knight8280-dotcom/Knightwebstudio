// No-script, reduced motion, accessible names, text scaling, list semantics.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/';
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
(async () => {
  const b = await chromium.launch();
  // 1. JavaScript off: nothing invisible or faded, in both themes
  for (const [w, h] of [[390, 844], [1280, 800]]) for (const scheme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, isMobile: w < 700, colorScheme: scheme });
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(600);
    const r = await p.evaluate(() => { const out = [];
      for (const el of document.querySelectorAll('main *')) { if (!el.getClientRects().length || el.closest('svg')) continue; const cs = getComputedStyle(el);
        let o = 1, n = el; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
        if (o < 0.99 && !el.closest('.bubble-typing')) out.push(el.tagName + '.' + el.className + ' opacity ' + o); if (cs.visibility === 'hidden') out.push(el.tagName + '.' + el.className + ' hidden'); }
      return { bad: [...new Set(out)].slice(0, 12), height: document.documentElement.scrollHeight, ovf: document.documentElement.scrollWidth - innerWidth, dead: [...document.querySelectorAll('main a')].filter(a => !a.getAttribute('href')).length }; });
    console.log(`no-script ${w} ${scheme}:`, JSON.stringify(r));
    await p.screenshot({ path: `nojs_${w}_${scheme}.png`, fullPage: true }); await ctx.close();
  }
  // 2. Reduced motion: everything there at once
  for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce', isMobile: w < 700 }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const op = el => { let o = 1, n = el; while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; } return o; };
      const all = [...document.querySelectorAll('main .reveal, main .seq, .hero-phone')]; return { hidden: all.filter(e => op(e) < .99).length, of: all.length, running: document.getAnimations().length }; });
    console.log(`reduced motion ${w}:`, JSON.stringify(r)); await ctx.close();
  }
  // 3. Accessible names (Chromium accessibility tree)
  for (const w of [360, 390, 430, 820, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: w < 700 }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(400);
    const snap = await p.locator('main').ariaSnapshot();
    const h1 = (snap.match(/heading "([^"]+)" \[level=1\]/) || [])[1];
    const heroFig = snap.split('\n').slice(0, 40).filter(l => /img|figure|list|Missed call|Example/.test(l)).slice(0, 8).map(s => s.trim());
    console.log(`a11y ${w}: h1 = "${h1}"`); if (w === 390) console.log('   hero tree:', JSON.stringify(heroFig));
    if (w === 390) { const lists = snap.split('\n').filter(l => /^\s*- list/.test(l)).length; const sum = snap.split('\n').findIndex(l => /About 4 hours/.test(l)); console.log('   summary line:', snap.split('\n')[sum].trim(), '| headings:', snap.split('\n').filter(l => /heading/.test(l)).map(l => l.trim().replace(/^- heading /, '')).join(' | ')); }
    await ctx.close();
  }
  // 4. Text-only scaling on a phone (the default font size raised): does anything on the page stick out?
  for (const [w, scale] of [[390, 1.1], [390, 1.25], [390, 1.5], [360, 1.5], [390, 2]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, isMobile: true }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.addStyleTag({ content: `html { font-size: ${scale * 100}% }` }); await p.waitForTimeout(500);
    const r = await p.evaluate(() => { let worst = 0, who = ''; for (const el of document.querySelectorAll('main *')) { if (el.closest('svg, .sr-only')) continue; const rc = el.getBoundingClientRect(); if (!rc.width) continue; const d = rc.right - innerWidth; if (d > worst) { worst = d; who = el.tagName.toLowerCase() + '.' + String(el.className).split(' ').join('.') + ' in .' + String(el.parentElement.className).split(' ')[0]; } } return { page: document.documentElement.scrollWidth - innerWidth, worst: Math.round(worst), who }; });
    console.log(`text at ${scale * 100}% on ${w}:`, JSON.stringify(r)); await ctx.close();
  }
  await b.close();
})();
