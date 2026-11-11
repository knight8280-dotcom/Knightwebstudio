process.env.PLAYWRIGHT_BROWSERS_PATH = require('path').resolve(__dirname, '../../../../.browsers-flat');
const { webkit } = require('playwright');
(async () => {
  const b = await webkit.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on('pageerror', e => console.log('ERR', e)); p.on('console', m => console.log('CON', m.text()));
  await p.goto('http://localhost:8730/kit/depth/demo.html'); await p.waitForTimeout(500);
  await p.evaluate(() => { const e = document.querySelector('#included .kws-ring'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 80); }); await p.waitForTimeout(1200);
  console.log(await p.evaluate(() => [...document.querySelectorAll('#included .kws-ring-read')].map(r => { const s = r.querySelector('span'), cs = getComputedStyle(s); return { cls: r.className, txt: s.textContent, op: cs.opacity, fs: cs.fontSize, h: s.offsetHeight, w: s.offsetWidth, rop: getComputedStyle(r).opacity, tr: r.style.transform.slice(0, 200), color: cs.color, rfs: getComputedStyle(r).fontSize }; })));
  await b.close();
})();
