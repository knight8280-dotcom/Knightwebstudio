// Firefox and WebKit, if they launch: layout sanity at 390 and 1440, feature support, screenshots of band + footer end.
const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const name of ['firefox', 'webkit']) {
    let b; try { b = await pw[name].launch(); } catch (e) { console.log(`SKIP ${name}: ${String(e).split('\n').slice(0, 6).join(' / ').slice(0, 500)}`); continue; }
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      const c = await b.newContext({ viewport: { width: w, height: h } }); const p = await c.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
      await c.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      for (const url of ['test/pricing-with-kit.html', 'portable.html']) {
        await p.goto('http://localhost:8730/kit/closing/' + url, { waitUntil: 'load' }); await p.waitForTimeout(900);
        await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.kws-close').scrollIntoView(); }); await p.waitForTimeout(700);
        await p.screenshot({ path: `br-${name}-${w}-${url.replace(/\W+/g, '-')}-band.png` });
        await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(900);
        await p.screenshot({ path: `br-${name}-${w}-${url.replace(/\W+/g, '-')}-end.png` });
        const r = await p.evaluate(() => { const q = s => document.querySelector(s), bb = s => q(s).getBoundingClientRect(); const n = q('.kws-skyline-name'), range = document.createRange(); range.selectNodeContents(n); const sc = bb('.kws-skyline');
          const small = [...document.querySelectorAll(':is(.kws-close, .kws-appt, .kws-foot) :is(a, button)')].filter(e => !e.closest('[hidden],[aria-hidden="true"]') && e.getBoundingClientRect().width && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5)).map(e => e.textContent.trim().slice(0, 14) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
          return { over: document.documentElement.scrollWidth - innerWidth, nameW: Math.round(range.getBoundingClientRect().width), sceneW: Math.round(sc.width), sceneH: Math.round(sc.height), nameY: Math.round(new DOMMatrix(getComputedStyle(n).transform).m42), anims: n.getAnimations ? n.getAnimations().length : 'n/a', cols: [...document.querySelectorAll('.kws-foot-grid')].map(g => getComputedStyle(g).gridTemplateColumns.split(' ').length).join('+'), folds: getComputedStyle(q('.kws-close')).backgroundImage.slice(0, 18), band: Math.round(bb('.kws-close').height), foot: Math.round(bb('.kws-foot').height), small, cq: CSS.supports('width:1cqw'), sda: CSS.supports('animation-timeline:view()'), mix: CSS.supports('color', 'color-mix(in oklab, red, blue)'), mask: CSS.supports('mask', 'linear-gradient(black, transparent)'), balance: CSS.supports('text-wrap', 'balance'), clip: CSS.supports('overflow', 'clip'), anylink: CSS.supports('selector(:any-link)'), live: document.querySelectorAll('.kws-shader.is-live').length }; });
        console.log(`${name} ${b.version()} ${w}px ${url}: ${JSON.stringify(r)} ${errs.length ? 'ERRORS ' + errs.join('|') : ''}`);
      }
      await c.close();
    }
    await b.close();
  }
})();
