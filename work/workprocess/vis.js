const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const js of [false, true]) for (const [w, h] of [[390, 844], [1440, 900]]) for (const path of ['/work/', '/process/']) {
    const c = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js, isMobile: w < 500, hasTouch: w < 500 }); const p = await c.newPage();
    await c.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    if (js) { const H = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < H; y += 300) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(80); } await p.waitForTimeout(900); }
    const r = await p.evaluate(() => { const bad = [];
      for (const e of document.querySelectorAll('main *')) { const cs = getComputedStyle(e); if (+cs.opacity < 1 && !e.closest('.bubble-typing')) bad.push(e.tagName + '.' + e.className + ' op=' + cs.opacity); if (cs.visibility === 'hidden') bad.push(e.tagName + '.' + e.className + ' hidden'); }
      const imgs = [...document.querySelectorAll('main img')].map(i => i.complete && i.naturalWidth > 0);
      const links = [...document.querySelectorAll('main a')].map(a => a.getAttribute('href') + (a.target ? ' [' + a.target + ' ' + a.rel + ']' : ''));
      return { bad, imgs, h1: document.querySelectorAll('h1').length, heads: [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(h => h.tagName[1]).join(''), links }; });
    console.log(js ? 'js  ' : 'nojs', w, path, 'faded/hidden:', r.bad.length ? r.bad : 'none', '| imgs', r.imgs.join(','), '| h1', r.h1, '| outline', r.heads);
    if (js && w === 1440) console.log('   links:', r.links.join(' | '));
    await c.close(); }
  await b.close(); })();
