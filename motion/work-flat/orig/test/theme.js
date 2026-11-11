// The site's theme button works on the demo, both carousels follow it with no script involvement, and the pause button is honoured at once.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(300);
  const read = () => p.evaluate(() => ({ theme: document.documentElement.getAttribute('data-theme'), tile: getComputedStyle(document.querySelector('.kws-arc-tile')).backgroundColor, name: getComputedStyle(document.querySelector('.kws-arc-name')).color, frame: getComputedStyle(document.querySelector('.kws-spot-frame')).backgroundColor, dot: getComputedStyle(document.querySelector('.kws-arc-dot[aria-current=true]'), '::before').backgroundColor }));
  const a = await read(); await p.click('#theme-toggle'); await p.waitForTimeout(200); const c = await read();
  console.log(a.theme !== c.theme && a.tile !== c.tile && a.name !== c.name && a.frame !== c.frame && a.dot !== c.dot ? 'PASS' : 'FAIL', ' theme button flips the theme and every kit colour follows', JSON.stringify(a), JSON.stringify(c));
  await p.click('#demo-motion'); const r = await p.evaluate(() => { const el = document.querySelector('#services .kws-arc'); el.querySelector('button:last-of-type').click(); return [document.documentElement.dataset.motion, el.classList.contains('is-moving'), [...el.querySelectorAll('li')].findIndex(li => li.classList.contains('is-on'))]; });
  console.log(r[0] === 'off' && !r[1] && r[2] === 1 ? 'PASS' : 'FAIL', ' pause button sets data-motion="off" and the next move is instant', r.join());
  console.log(errs.length ? 'FAIL  console errors: ' + errs.join('|') : 'PASS  no console errors');
  await b.close();
})();
