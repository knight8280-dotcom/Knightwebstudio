// Other item counts and options: spotlight with 1, 2, 4 and 6 cards; wheel with 2, 4 and 14 signs; loop off; start index.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); const p = await ctx.newPage(); const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(300);
    const r = await p.evaluate(async () => {
      const out = []; const host = document.querySelector('#work .container'); document.querySelector('#client').remove();
      const make = (name, sel, count, attrs = {}) => { const src = document.querySelector(sel); const el = src.cloneNode(true); KWS[name].mount(src); el.classList.remove('is-live');
        el.querySelectorAll('[class*="-ctl"],[aria-live]').forEach(x => x.remove()); el.removeAttribute('aria-roledescription');
        const ul = el.querySelector('ul'); const lis = [...ul.children]; lis.forEach(li => { li.classList.remove('is-on'); li.removeAttribute('aria-label'); li.removeAttribute('aria-roledescription'); li.querySelectorAll('[style]').forEach(x => x.removeAttribute('style')); });
        while (ul.children.length > count) ul.lastElementChild.remove();
        for (let i = 0; ul.children.length < count; i++) ul.append(lis[i % lis.length].cloneNode(true));
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        const h = document.createElement('p'); h.className = 'label'; h.style.marginTop = '48px'; h.textContent = `${name} with ${count} items ${JSON.stringify(attrs)}`; host.append(h, el); KWS[name].mount(el); return el; };
      const cases = [['spotlight', '#work .kws-spot', 1], ['spotlight', '#work .kws-spot', 2], ['spotlight', '#work .kws-spot', 4], ['spotlight', '#work .kws-spot', 6, { 'data-start': '2' }], ['spotlight', '#work .kws-spot', 3, { 'data-loop': 'false' }],
        ['arc', '#services .kws-arc', 2], ['arc', '#services .kws-arc', 4], ['arc', '#services .kws-arc', 14], ['arc', '#services .kws-arc', 9, { 'data-loop': 'false', 'data-start': '8' }]];
      for (const [name, sel, count, attrs] of cases) {
        const el = make(name, sel, count, attrs); await new Promise(r => setTimeout(r, 60));
        const lis = [...el.querySelectorAll(':scope > ul > li')]; const on = () => lis.findIndex(li => li.classList.contains('is-on'));
        const start = on(); const next = el.querySelector('button:last-of-type') || { click() {} }, prev = el.querySelector('button') || { click() {} };
        const seq = [start]; for (let i = 0; i < count + 1; i++) { next.click(); await new Promise(r => setTimeout(r, 30)); } await new Promise(r => setTimeout(r, 1200)); seq.push(on());
        prev.click(); await new Promise(r => setTimeout(r, 900)); seq.push(on());
        const vis = lis.filter(li => { const v = li.querySelector('[class$="-tile"],[class$="-frame"]'); return getComputedStyle(v).visibility === 'visible'; }).length;
        const over = Math.max(...[...el.querySelectorAll('*')].filter(x => getComputedStyle(x).visibility !== 'hidden').map(x => x.getBoundingClientRect().right)) - innerWidth;
        out.push({ name, count, attrs, start, afterNextTimes: count + 1, at: seq[1], afterPrev: seq[2], visibleNow: vis, pokesOut: Math.round(over), dots: el.querySelectorAll('[class$="-dot"]').length });
      }
      return out; });
    for (const x of r) {
      const expNext = (x.start + x.count + 1) % x.count, expPrev = (expNext - 1 + x.count) % x.count;
      const ok = x.at === expNext && x.afterPrev === expPrev && x.pokesOut <= 0 && x.dots === (x.count > 1 || x.name === 'arc' ? x.count : 0) && x.visibleNow >= Math.min(x.count, 2) - (x.count === 1 ? 0 : 0);
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${w}px ${x.name} x${x.count} ${JSON.stringify(x.attrs || {})}: start ${x.start}, after ${x.afterNextTimes} nexts at ${x.at}, after prev at ${x.afterPrev}, ${x.visibleNow} showing, past the window edge by ${x.pokesOut}px`); if (!ok) bad++;
    }
    if (errs.length) { console.log('ERRORS', errs); bad++; }
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#work .section-more').getBoundingClientRect().top + scrollY); });
    await p.waitForTimeout(300); await p.screenshot({ path: `${__dirname}/../shots/edge-${w}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
