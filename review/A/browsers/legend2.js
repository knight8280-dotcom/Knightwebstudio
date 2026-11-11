// What does a visitor see, and does it mend itself? One build, /contact/ at 390 (or W) with BASE.
const { webkit } = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
const base = process.env.BASE || 'http://localhost:8720'; const W = +process.env.W || 390; const fix = process.env.FIX || ''; const path = process.env.PATHNAME || '/contact/';
(async () => {
  const b = await webkit.launch(); const res = [];
  for (let run = 0; run < (+process.env.RUNS || 3); run++) {
    const ctx = await b.newContext({ viewport: { width: W, height: 844 }, isMobile: W < 500, hasTouch: W < 900 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    if (fix) await ctx.route(/\/assets\/css\/styles\.css/, async r => { const fs = require('fs'); r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8') + '\n' + fix }); });
    const p = await ctx.newPage(); await p.goto(base + path); await p.waitForTimeout(2500);
    const m = () => p.evaluate(() => [...document.querySelectorAll('fieldset > legend')].map(l => { const r = l.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); }).join(','));
    const steps = [];
    steps.push('rest:' + await m());
    if (process.env.SHOT) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300); await p.screenshot({ path: process.env.SHOT + '_run' + run + '.png' }); steps.push('after shot:' + await m()); }
    if (path === '/contact/') {
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
      await p.fill('#name', 'A'); steps.push('typed name:' + await m());
      const box = await p.locator('input[name="services"][value="SEO"]').boundingBox(); await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(200); steps.push('chip tapped:' + await m() + ' checked=' + await p.isChecked('input[name="services"][value="SEO"]'));
      await p.setViewportSize({ width: W + 1, height: 844 }); await p.waitForTimeout(200); steps.push('resized:' + await m());
    }
    res.push(steps.join('  ')); await ctx.close();
  }
  console.log(res.join('\n')); await b.close();
})();
