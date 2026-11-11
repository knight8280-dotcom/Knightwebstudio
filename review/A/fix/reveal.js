// A11Y-01: (a) tall blocks never shown in a short window, (b) blocks below the fold shown early. JS=<file> swaps main.js
const { chromium } = require('playwright'); const fs = require('fs');
const js = process.env.JS ? fs.readFileSync(process.env.JS) : null;
(async () => { const b = await chromium.launch();
  for (const [w, h, path] of [[341, 162, '/pricing/'], [341, 162, '/consulting/'], [390, 844, '/'], [390, 844, '/pricing/'], [1280, 800, '/'], [1280, 800, '/consulting/']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    if (js) await ctx.route(/main\.js/, r => r.fulfill({ body: js, contentType: 'text/javascript' }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(800);
    const early = await p.evaluate(() => [...document.querySelectorAll('.reveal.visible')].filter(e => e.getBoundingClientRect().top > innerHeight).length);
    // rest 200px into each tall block for 1s
    const never = await p.evaluate(async () => { document.documentElement.style.scrollBehavior = 'auto'; let n = 0; for (const e of document.querySelectorAll('.reveal')) { window.scrollTo(0, e.getBoundingClientRect().top + scrollY + 200 - 60); await new Promise(r => setTimeout(r, 300)); } await new Promise(r => setTimeout(r, 600)); return [...document.querySelectorAll('.reveal:not(.visible)')].map(e => e.tagName + '.' + e.className.split(' ')[0] + ' ' + Math.round(e.offsetHeight) + 'px'); });
    console.log(`${w}x${h} ${path}: shown below the fold at load ${early}; never shown ${never.length} ${never.join(', ')}`);
    await ctx.close(); }
  await b.close(); })();
