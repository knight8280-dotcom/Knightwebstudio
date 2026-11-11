// Smoke test in Firefox and WebKit, when they can be launched:
//   PLAYWRIGHT_BROWSERS_PATH=<folder holding them> node test/other-browsers.js
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const name of ['firefox', 'webkit']) {
    let b; try { b = await pw[name].launch(); } catch (e) { console.log(`SKIP  ${name}: cannot launch here (${String(e).split('\n')[0].slice(0, 90)})`); continue; }
    for (const [w, h] of [[390, 844], [1280, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = [];
      p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
      await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(500);
      const live = await p.evaluate(() => document.querySelectorAll('.is-live').length);
      const out = [];
      for (const [kind, sel, part] of [['arc', '#services .kws-arc', '.kws-arc-tile'], ['spotlight', '#work .kws-spot', '.kws-spot-frame']]) {
        await p.locator(sel).scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
        const on = () => p.evaluate(s => [...document.querySelectorAll(s + ' > ul > li')].findIndex(li => li.classList.contains('is-on')), sel);
        await p.click(`${sel} button:last-of-type`); await p.waitForTimeout(900); const a = await on();
        const box = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); const x = box.x + box.width / 2, y = box.y + 30;
        await p.mouse.move(x, y); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(x - i * 14, y); await p.waitForTimeout(16); } await p.mouse.up(); await p.waitForTimeout(1000); const c = await on();
        await p.keyboard.press('Tab'); await p.focus(`${sel} li >> nth=0 >> a`); await p.waitForTimeout(900); const d = await on();
        // the nested hover rule and the light edge of a sign (color-mix) are the newest CSS in the kit: check they are understood here
        const fb = await p.locator(`${sel} li.is-on ${part}`).boundingBox(); await p.mouse.move(fb.x + fb.width / 2, fb.y + fb.height / 2); await p.waitForTimeout(120);
        const css = await p.evaluate(([s, q]) => { const e = document.querySelector(`${s} li.is-on ${q}`); return getComputedStyle(e).translate + ' / ' + (getComputedStyle(e).boxShadow.split('inset').length - 1) + ' inset edges'; }, [sel, part]);
        await p.mouse.move(2, 2);
        const geo = await p.evaluate(s => { const el = document.querySelector(s); const vis = [...el.querySelectorAll('[class$="-tile"],[class$="-frame"]')].filter(x => getComputedStyle(x).visibility === 'visible').map(x => x.getBoundingClientRect());
          const cap = el.querySelector('li.is-on [class$="-cap"]').getBoundingClientRect(); const ctl = el.querySelector('[class$="-ctl"]').getBoundingClientRect();
          return { showing: vis.length, past: Math.round(Math.max(...vis.map(r => r.right)) - innerWidth), capUnderPicture: cap.top > vis[0].top, ctlUnderCap: ctl.top >= cap.bottom - 1, pageWider: document.documentElement.scrollWidth - innerWidth, h: Math.round(el.getBoundingClientRect().height) }; }, sel);
        out.push(`${kind}: hover ${/-2px/.test(css) && (w < 700 || true) ? 'lifts' : 'BAD ' + css} (${css}), next ${a === 1 ? 'ok' : 'BAD ' + a}, drag ${c > a ? 'ok' : 'BAD ' + c}, focus-to-centre ${d === 0 ? 'ok' : 'BAD ' + d}, ${geo.showing} showing, past edge ${geo.past}px, caption under picture ${geo.capUnderPicture}, controls under caption ${geo.ctlUnderCap}, page wider by ${geo.pageWider}px, height ${geo.h}`);
      }
      console.log(`${errs.length || live !== 4 || /BAD|false/.test(out.join()) ? 'FAIL' : 'PASS'}  ${name} ${b.version()} at ${w}px: ${live} mounted; ${out.join(' | ')}${errs.length ? ' ERRORS ' + errs.join('|') : ''}`);
      await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.querySelector('#services').getBoundingClientRect().top + scrollY - 80); }); await p.waitForTimeout(300);
      await p.screenshot({ path: `${__dirname}/../shots/${name}-${w}-arc.png` });
      await p.evaluate(() => scrollTo(0, document.querySelector('#work').getBoundingClientRect().top + scrollY - 10)); await p.waitForTimeout(500);
      await p.screenshot({ path: `${__dirname}/../shots/${name}-${w}-spotlight.png` });
      await ctx.close();
    }
    await b.close();
  }
})();
