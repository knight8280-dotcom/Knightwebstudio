// A11Y-03: the one-line fix, served as a patched main.js.
const { chromium } = require('playwright');
const fs = require('fs');
const src = fs.readFileSync('/home/user/Knightwebstudio/assets/js/main.js', 'utf8');
const OLD = "closeNav();\n        navToggle.focus();";
if (!src.includes(OLD)) { console.log('pattern not found'); process.exit(1); }
const patched = src.replace(OLD, "closeNav();\n        navToggle.focus({ preventScroll: true });");
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [820, 1000]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    await ctx.route(/\/assets\/js\/main\.js/, r => r.fulfill({ contentType: 'application/javascript', body: patched }));
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 3000); }); await p.waitForTimeout(500);
    const [x, y] = await p.evaluate(() => { const r = document.getElementById('nav-toggle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await p.mouse.click(x, y); await p.waitForTimeout(500);
    const open = await p.evaluate(() => document.getElementById('nav').classList.contains('open'));
    await p.keyboard.press('Escape'); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ y: Math.round(scrollY), focusOnToggle: document.activeElement === document.getElementById('nav-toggle'), focusVisible: document.activeElement.matches(':focus-visible') }));
    console.log(w + 'x' + h, 'opened', open, 'after Escape', JSON.stringify(r));
    await ctx.close();
  }
  await b.close();
})();
