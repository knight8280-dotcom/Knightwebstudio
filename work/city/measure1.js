const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto('http://localhost:8720/pricing/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  const r = await p.evaluate(() => {
    const out = {};
    const s = document.createElement('span');
    s.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;font-size:100px;letter-spacing:-.03em;';
    s.className = 'display';
    document.body.appendChild(s);
    for (const t of ['Baton Rouge', 'Denham Springs', 'Gonzales', 'Prairieville', 'Website design for', 'businesses']) { s.textContent = t; out[t] = s.getBoundingClientRect().width / 100; }
    s.style.fontFamily = 'Georgia, serif'; 
    for (const t of ['Baton Rouge', 'Denham Springs', 'Gonzales', 'Prairieville']) { s.textContent = t; out['georgia ' + t] = s.getBoundingClientRect().width / 100; }
    s.style.fontFamily = '"Fraunces Fallback"'; 
    for (const t of ['Baton Rouge', 'Denham Springs', 'Gonzales', 'Prairieville']) { s.textContent = t; out['fallback ' + t] = s.getBoundingClientRect().width / 100; }
    s.remove();
    out.footer = document.querySelector('footer').getBoundingClientRect().height;
    out.header = document.querySelector('main').getBoundingClientRect().top + scrollY;
    out.page = document.documentElement.scrollHeight;
    return out;
  });
  console.log(r);
  for (const u of ['http://localhost:8700/web-design-baton-rouge/', 'http://localhost:8720/web-design-baton-rouge/', 'http://localhost:8700/web-design-prairieville/']) {
    await p.goto(u); await p.waitForTimeout(400);
    console.log(u, await p.evaluate(() => ({ page: document.documentElement.scrollHeight, footer: document.querySelector('footer').getBoundingClientRect().height })));
  }
  await b.close();
})();
