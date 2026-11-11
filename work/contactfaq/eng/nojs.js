const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720'; const fs = require('fs'); fs.mkdirSync(__dirname + '/nojs', { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.waitForTimeout(300);
    await p.screenshot({ path: `${__dirname}/nojs/${path.replace(/\//g, '')}-${w}.png`, fullPage: true });
    await ctx.close();
    // evaluate needs JS: emulate no-js by blocking main.js and removing the js class... instead use a JS-enabled context with all scripts blocked
    const ctx2 = await b.newContext({ viewport: { width: w, height: h } });
    await ctx2.route(/\.js(\?|$)|plausible|hcaptcha|calendly/, r => r.abort());
    const p2 = await ctx2.newPage(); await p2.goto(base + path, { waitUntil: 'load' });
    await p2.evaluate(() => document.documentElement.classList.remove('js', 'crest-intro'));
    await p2.waitForTimeout(200);
    const r = await p2.evaluate(() => {
      const inv = []; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (el.closest('.sr-only,.hp,[hidden]')) continue; if ((+cs.opacity === 0 || cs.visibility === 'hidden') && el.getBoundingClientRect().width) inv.push(el.tagName + '.' + el.className); }
      const dead = [...document.querySelectorAll('main a[data-booking], main .booking-only, #theme-toggle, #nav-toggle, .nav-foot, #mobile-cta')].map(e => [e.tagName + '.' + (e.className.toString().split(' ')[0]) + '#' + e.id, getComputedStyle(e).display, e.hidden, e.getAttribute('href')]);
      const talk = document.querySelector('.talk'); const stamp = document.querySelector('main .stamp');
      return { inv, dead, talkH: talk && Math.round(talk.getBoundingClientRect().height), stampOpacity: stamp && getComputedStyle(stamp).opacity, navVisible: getComputedStyle(document.getElementById('nav')).visibility + '/' + getComputedStyle(document.getElementById('nav')).display, docH: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, formAction: document.getElementById('contact-form')?.action };
    });
    console.log(path, w, JSON.stringify(r));
    await ctx2.close();
  }
  await b.close();
})();
