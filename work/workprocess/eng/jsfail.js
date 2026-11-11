const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/work/', '/process/']) {
    // main.js blocked
    let ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/main\.js|plausible/, r => r.abort());
    let p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(600);
    const early = await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => getComputedStyle(e).opacity));
    await p.waitForTimeout(4200);
    const late = await p.evaluate(() => ({ js: document.documentElement.classList.contains('js'), rv: [...document.querySelectorAll('.reveal')].map(e => getComputedStyle(e).opacity + '/' + getComputedStyle(e).transform), nav: getComputedStyle(document.getElementById('nav')).display, toggle: getComputedStyle(document.getElementById('theme-toggle')).display }));
    console.log(path, 'main.js blocked: reveal opacity at 0.6s', JSON.stringify(early), 'after 4.8s', JSON.stringify(late));
    await ctx.close();
    // page css blocked (what the page looks like if the page stylesheet fails): no overflow?
    ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }); await ctx.route(/pages\/(work|process)\.css|plausible/, r => r.abort());
    p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    console.log('   page css blocked: overflow', await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), 'height', await p.evaluate(() => document.documentElement.scrollHeight));
    await ctx.close();
    // reduced motion + JS: stamp state before scroll
    ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await ctx.route(/plausible/, r => r.abort());
    p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    console.log('   reduced motion:', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.reveal')].map(e => getComputedStyle(e).opacity + '/' + getComputedStyle(e).transform + '/' + getComputedStyle(e).transitionDuration))));
    await ctx.close();
  }
  await b.close();
})();
