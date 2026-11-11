// A11Y-01: do .reveal blocks stay invisible in short windows? Independent re-check.
const chromium = require(process.env.PWCORE)[process.env.ENGINE];
const BASE = 'http://localhost:8720';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com|web3forms\.com/;
const PAGES = (process.argv[2] || '/,/pricing/,/consulting/,/about/,/services/,/work/,/process/,/faq/,/contact/,/start/,/web-design-baton-rouge/').split(',');
const SIZES = (process.argv[3] || '341x162,320x170,320x256,360x350,390x844').split(',').map(s => s.split('x').map(Number));
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of SIZES) {
    for (const path of PAGES) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } });
      await ctx.route(BLOCK, r => r.abort()); if (process.env.JS) await ctx.route(/main\.js/, r => r.fulfill({ body: require('fs').readFileSync(process.env.JS), contentType: 'text/javascript' }));
      const p = await ctx.newPage();
      await p.goto(BASE + path, { waitUntil: 'load' });
      await p.waitForTimeout(300);
      const total = await p.evaluate(() => document.documentElement.scrollHeight);
      // scroll in steps of a third of the window, real wheel-like scrolling via scrollTo
      const step = Math.max(40, Math.floor(h / 3));
      for (let y = 0; y <= total; y += step) {
        await p.evaluate(yy => window.scrollTo(0, yy), y);
        await p.waitForTimeout(25);
      }
      await p.waitForTimeout(700);
      const res = await p.evaluate(() => {
        const all = [...document.querySelectorAll('.reveal')];
        const hidden = all.filter(el => getComputedStyle(el).opacity === '0' || !el.classList.contains('visible'));
        return { n: all.length, hidden: hidden.map(el => ({ tag: el.tagName.toLowerCase() + '.' + [...el.classList].join('.'), h: Math.round(el.getBoundingClientRect().height), op: getComputedStyle(el).opacity, words: el.innerText.trim().split(/\s+/).length, links: el.querySelectorAll('a,button').length, text: el.innerText.trim().slice(0, 60).replace(/\n/g, ' | ') })) };
      });
      console.log(`${w}x${h} ${path}: ${res.hidden.length} of ${res.n} never shown`);
      for (const x of res.hidden) console.log('    ', JSON.stringify(x));
      await ctx.close();
    }
  }
  await b.close();
})();
