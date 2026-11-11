// Smoke test in Firefox and WebKit, when they can be launched here:
//   PLAYWRIGHT_BROWSERS_PATH=<motion>/.browsers-flat node test/other-browsers.js
const pw = require('playwright');
(async () => {
  for (const name of ['firefox', 'webkit']) {
    let b; try { b = await pw[name].launch(); } catch (e) { console.log(`SKIP  ${name}: cannot launch here (${String(e).split('\n')[0].slice(0, 90)})`); continue; }
    for (const [w, h] of [[390, 844], [1280, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = [];
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
      await p.goto('http://localhost:8730/kit/depth/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(600);
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
      const live = await p.evaluate(() => document.querySelectorAll('.is-live').length);
      const C = '#how .kws-cyl', R = '#included .kws-ring';
      const on = () => p.evaluate(s => [...document.querySelectorAll(s + ' .kws-cyl-card')].findIndex(c => c.classList.contains('is-on')), C);
      const front = () => p.evaluate(s => [...document.querySelectorAll(s + ' .kws-ring-card')].findIndex(c => c.classList.contains('is-front')), R);
      await p.evaluate(s => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 100), C); await p.waitForTimeout(300);
      await p.click(`${C} .kws-cyl-nav:last-child`); await p.waitForTimeout(1000); const a = await on();
      await p.evaluate(s => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 100), C); await p.waitForTimeout(200); // the click may have scrolled the page
      const box = await p.locator(`${C} .kws-cyl-card.is-on`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 200;
      await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(x - i * 16, y); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1100); const c = await on();
      await p.focus(`${C} .kws-cyl-dot`); await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(1000); const d = await on();
      const flatOn = await p.evaluate(s => getComputedStyle(document.querySelector(s + ' .kws-cyl-card.is-on')).transform, C);
      await p.screenshot({ path: `${__dirname}/../shots/${name}-${w}-cylinder.png` });
      await p.evaluate(s => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 500), R); await p.waitForTimeout(900); const f0 = await front();
      await p.evaluate(s => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - 150), R); await p.waitForTimeout(1200); const f1 = await front();
      const sb = await p.locator(`${R} .kws-ring-stage`).boundingBox();
      await p.mouse.move(sb.x + sb.width * .6, sb.y + sb.height * .5); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(sb.x + sb.width * .6 - i * 14, sb.y + sb.height * .5); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1500); const f2 = await front();
      await p.screenshot({ path: `${__dirname}/../shots/${name}-${w}-ring.png` });
      const wide = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const pass = !errs.length && live === 4 && a === 1 && c === 2 && d === 1 && flatOn === 'none' && f1 !== f0 && f2 !== f1 && wide <= 0;
      console.log(`${pass ? 'PASS' : 'FAIL'}  ${name} ${b.version()} at ${w}px: ${live} mounted; cylinder next ${a === 1 ? 'ok' : 'BAD ' + a}, drag ${c === 2 ? 'ok' : 'BAD ' + c}, arrow key ${d === 1 ? 'ok' : 'BAD ' + d}, centre card transform ${flatOn}; ring front card ${f0} > ${f1} by scroll, > ${f2} by drag; page wider by ${wide}px${errs.length ? ' ERRORS ' + errs.join('|') : ''}`);
      await ctx.close();
    }
    await b.close();
  }
})();
