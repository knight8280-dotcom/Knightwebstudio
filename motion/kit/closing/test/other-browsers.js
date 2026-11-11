// The kit in Firefox and WebKit (Safari's engine), when they can be launched, with screenshots of the band and the page end:
//   PLAYWRIGHT_BROWSERS_PATH=<folder holding them> node other-browsers.js [outdir]
// It checks the things that differ between engines: the gold line under the number, the brush, the masks, the name's size
// from container units, the two-up list, the scalloped edge, the folds, and that nothing scrolls sideways.
const pw = require('playwright');
const out = process.argv[2] || '../shots';
const BLOCK = /plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/;
(async () => {
  let fails = 0;
  for (const name of ['firefox', 'webkit']) {
    let b; try { b = await pw[name].launch(); } catch (e) { console.log(`SKIP  ${name}: cannot launch here (${String(e).split('\n')[0].slice(0, 90)})`); continue; }
    for (const [url, tag] of [['test/pricing-with-kit.html', 'pricing'], ['portable.html', 'bare'], ['demo.html', 'demo']]) for (const [w, h] of [[390, 844], [1440, 900]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage(); const errs = [];
      p.on('console', m => { if (m.type() === 'error' && !/calendly|plausible|net::|NetworkError|Failed to load resource|blocked|access control/i.test(m.text())) errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
      await ctx.route(BLOCK, r => r.abort());
      await p.goto('http://localhost:8730/kit/closing/' + url, { waitUntil: 'load' }); await p.waitForTimeout(700);
      await p.addStyleTag({ content: 'html{scroll-behavior:auto !important} .reveal{opacity:1 !important;transform:none !important}' });
      const band = p.locator(tag === 'demo' ? '.kws-close:not(.kws-close--card):not(.kws-close--strip)' : '.kws-close').last();
      await band.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
      if (tag !== 'demo') await p.screenshot({ path: `${out}/other-${name}-${tag}-${w}-band.png` });
      await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(900);
      const r = await p.evaluate(() => {
        const q = s => document.querySelector(s), bb = s => q(s).getBoundingClientRect(), cs = (s, pe) => getComputedStyle(q(s), pe);
        const sc = bb('footer .kws-skyline'), foot = bb('footer.kws-foot'), nameEl = q('footer .kws-skyline-name');
        const range = document.createRange(); range.selectNodeContents(nameEl);
        const tel = cs('.kws-close-tel a'), mark = q('.kws-close-mark > span') ? getComputedStyle(q('.kws-close-mark > span'), '::after') : null, places = q('footer .kws-foot-places');
        const pl = places ? [...places.children].map(e => Math.round(e.getBoundingClientRect().left)) : [];
        const nm = getComputedStyle(nameEl), sky = cs('footer .kws-skyline-sky');
        return { over: document.documentElement.scrollWidth - innerWidth, sceneAtBottom: Math.round(foot.bottom - sc.bottom), artH: Math.round(bb('footer .kws-skyline-art').height), sceneH: Math.round(sc.height),
          nameW: Math.round(range.getBoundingClientRect().width), nameY: Math.round(new DOMMatrix(nm.transform).m42), nameClip: nm.webkitBackgroundClip || nm.backgroundClip, nameMask: (nm.maskImage || nm.webkitMaskImage || '').slice(0, 15),
          telLine: tel.textDecorationLine, telCol: tel.textDecorationColor, telThick: tel.textDecorationThickness, gilt: getComputedStyle(q('.kws-close')).getPropertyValue('border-bottom-color'),
          mark: mark ? (mark.maskImage || mark.webkitMaskImage || '').slice(0, 24) : 'no mark here', scallop: cs('.kws-close', '::before').backgroundImage.slice(0, 15), folds: cs('.kws-close').backgroundImage.slice(0, 15),
          placeCols: new Set(pl).size, skyMask: (sky.maskImage || sky.webkitMaskImage || '').slice(0, 15), cq: CSS.supports('width:1cqw'), sda: CSS.supports('animation-timeline:view()'), mix: CSS.supports('color', 'color-mix(in oklab, red, blue)'),
          foot: Math.round(foot.height) };
      });
      // the full stop after the marked words must stay with them at every phone width (the statement band on the demo page)
      let orphan = 'n/a';
      if (tag === 'demo' && w === 390) {
        const bad = [];
        for (let x = 320; x <= 620; x += 10) { await p.setViewportSize({ width: x, height: 800 }); if (await p.evaluate(() => { const m = document.querySelector('#close-sign .kws-close-mark > span'), rg = document.createRange(); rg.setStart(m.nextSibling, 0); rg.setEnd(m.nextSibling, 1); const rs = m.getClientRects(); return rg.getBoundingClientRect().top >= rs[rs.length - 1].bottom - 4; })) bad.push(x); }
        await p.setViewportSize({ width: w, height: h }); orphan = bad.length ? 'ALONE at ' + bad.join(',') : 'never alone, 320 to 620px';
      }
      const ok = !/ALONE/.test(orphan) && !errs.length && r.over <= 0 && r.sceneAtBottom === 0 && (tag === 'bare' ? r.nameW > 0 : r.nameW <= w && r.nameW > w * .8) && r.nameY === 0 && r.telLine === 'underline' && r.telCol === r.gilt && r.telThick === '2px'
        && /gradient/.test(r.scallop) && /gradient/.test(r.folds) && /gradient/.test(r.nameMask) && /gradient/.test(r.skyMask) && (r.mark === 'no mark here' || /url|gradient/.test(r.mark)) && (tag === 'bare' ? true : r.placeCols >= 2);
      if (!ok) fails++;
      await p.screenshot({ path: `${out}/other-${name}-${tag}-${w}-end.png` });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} ${b.version()}, ${tag} at ${w}px: page ${r.over}px wider than the screen; footer ${r.foot}px; scene ${r.sceneH}px with a ${r.artH}px skyline at the foot of the footer; name ${r.nameW}px wide, at rest (${r.nameY}px), clipped to ${r.nameClip}, masked (${r.nameMask}); number: ${r.telLine} ${r.telThick} ${r.telCol} (gilt is ${r.gilt}); brush: ${r.mark}; scallops ${/gradient/.test(r.scallop)}, folds ${/gradient/.test(r.folds)}, sky mask ${/gradient/.test(r.skyMask)}; places in ${r.placeCols} column positions; container units ${r.cq}, scroll-linked rise ${r.sda}, colour mixing ${r.mix}; full stop after the marked words: ${orphan}${errs.length ? ' ERRORS ' + errs.join('|') : ''}`);
      await ctx.close();
    }
    await b.close();
  }
  process.exit(fails ? 1 : 0);
})();
