// Screenshots before, mid-drag and settled for both carousels. node test/drag.js [--w 1440 --h 900 --theme light]
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
(async () => {
  const w = +arg('w', 1440), h = +arg('h', 900), theme = arg('theme', 'light');
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 700 ? 2 : 1 });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(400);
  for (const [name, sel, cls] of [['arc', '#services', '.kws-arc-list'], ['spot', '#work', '.kws-spot-list']]) {
    await p.evaluate(([s, o]) => { document.documentElement.style.scrollBehavior = 'auto'; const e = document.querySelector(s); scrollTo(0, e.getBoundingClientRect().top + scrollY + o); }, [sel, name === 'arc' ? -80 : (w < 700 ? 150 : 60)]);
    await p.waitForTimeout(400);
    const box = await p.locator(sel + ' ' + cls).boundingBox();
    const cx = box.x + box.width / 2, cy = box.y + Math.min(90, box.height / 4);
    const shot = s => p.screenshot({ path: `${__dirname}/../shots/drag-${name}-${w}-${theme}-${s}.png` });
    await shot('1-before');
    await p.mouse.move(cx, cy); await p.mouse.down();
    const dist = Math.min(box.width * .3, 260);
    for (let i = 1; i <= 12; i++) { await p.mouse.move(cx - dist * i / 12, cy + (i % 2)); await p.waitForTimeout(16); }
    await p.waitForTimeout(80); await shot('2-mid');
    for (let i = 1; i <= 4; i++) { await p.mouse.move(cx - dist - 12 * i, cy); await p.waitForTimeout(16); }
    await p.mouse.up(); await p.waitForTimeout(120); await shot('3-release');
    await p.waitForTimeout(900); await shot('4-settled');
    console.log(name, await p.evaluate(s => { const el = document.querySelector(s + ' [data-kws]'); return { on: [...el.querySelectorAll('li')].findIndex(li => li.classList.contains('is-on')), moving: el.classList.contains('is-moving'), said: el.querySelector('[aria-live]').textContent }; }, sel));
  }
  if (errs.length) console.log('ERRORS', errs);
  await b.close();
})();
