// Extra checks for /about/ and /404.html: no-JS render, keyboard order and focus rings, 404 at a deep missing URL.
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = __dirname + '/extra';
const BASE = 'http://localhost:8720';
(async () => {
  const b = await chromium.launch();

  // 1. JavaScript off
  for (const [name, path, w, h] of [['about-nojs-390', '/about/', 390, 844], ['about-nojs-1440', '/about/', 1440, 900], ['404-nojs-390', '/404.html', 390, 844]]) {
    const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: w, height: h } });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    const hiddenText = await p.evaluate(() => 0).catch(() => 0);
    await ctx.close();
  }
  // nothing invisible without JS: evaluate needs JS in page context, so use a JS-enabled context with the "js" class never added
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route('**/assets/js/main.js', r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + '/about/'); await p.waitForTimeout(4500);
    const faded = await p.evaluate(() => [...document.querySelectorAll('main *')].filter(e => { const cs = getComputedStyle(e); return +cs.opacity < 1 && e.getBoundingClientRect().height > 0; }).map(e => e.className).slice(0, 5));
    console.log('about, main.js blocked, after 4.5s: faded elements =', JSON.stringify(faded));
    await ctx.close();
  }

  // 2. Keyboard: tab through, record order, check each stop has a visible outline, shoot a few
  for (const [path, w] of [['/about/', 1440], ['/about/', 390], ['/404.html', 1440], ['/404.html', 390]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(500);
    const stops = []; let noRing = 0;
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        // chips and the like draw the ring on a sibling; here every stop is a link or a button
        return { tag: e.tagName.toLowerCase(), text: (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 32), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, inMain: !!e.closest('main'), inFooter: !!e.closest('footer'), y: Math.round(r.top + scrollY), x: Math.round(r.left) }; });
      if (!s) break; if (stops.length && s.text === stops[0].text && s.y === stops[0].y) break;
      stops.push(s); if (!/solid [23]px/.test(s.outline)) noRing++;
      if (s.inMain && [1, 3, 6, 9].includes(stops.filter(x => x.inMain).length)) await p.screenshot({ path: `${OUT}/focus-${path.replace(/\W/g, '')}-${w}-${stops.length}.png` });
      if (s.inFooter) break;
    }
    console.log(`\n${path} @${w}: ${stops.length} stops before the footer, ${noRing} without a 2-3px ring`);
    console.log(stops.filter(s => s.inMain).map(s => `  ${String(s.y).padStart(5)} ${String(s.x).padStart(5)}  ${s.tag} "${s.text}"  [${s.outline}]`).join('\n'));
    await ctx.close();
  }

  // 3. The 404 page as a host serves it: at a deep missing address
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const html = fs.readFileSync('/home/user/Knightwebstudio/404.html', 'utf8');
    const p = await ctx.newPage(); const failed = [], asked = [];
    await p.route('**/services/old/missing-page/', r => r.fulfill({ status: 404, contentType: 'text/html', body: html }));
    p.on('response', r => { asked.push(r.status() + ' ' + r.url().replace(BASE, '')); if (r.status() >= 400 && !/missing-page/.test(r.url())) failed.push(r.status() + ' ' + r.url()); });
    p.on('requestfailed', r => failed.push('failed ' + r.url()));
    await p.goto(BASE + '/services/old/missing-page/'); await p.waitForTimeout(500);
    const info = await p.evaluate(() => ({ scripts: document.querySelectorAll('script[src]').length, links: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')), resolved: [...document.querySelectorAll('a[href]')].map(a => a.href), font: getComputedStyle(document.querySelector('h1')).fontFamily.slice(0, 20), sheetRules: [...document.styleSheets].map(s => s.href + ':' + s.cssRules.length) }));
    console.log('\n404 at /services/old/missing-page/: failed requests =', JSON.stringify(failed), '| external scripts =', info.scripts);
    console.log('  stylesheets:', info.sheetRules.join(' , '));
    const rel = info.links.filter(h => !/^(\/|tel:|mailto:|#)/.test(h)); console.log('  hrefs that are not root-absolute:', JSON.stringify(rel));
    for (const u of [...new Set(info.resolved)].filter(u => u.startsWith('http'))) { const r = await p.request.get(u); console.log('  ', r.status(), u.replace(BASE, '')); }
    await p.screenshot({ path: `${OUT}/404-deep-390.png` });
    await ctx.close();
  }
  await b.close();
})();
