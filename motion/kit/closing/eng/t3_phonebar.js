// The site's sticky phone bar against the closing band: today's page and the kit copy. main.js hides the bar over '.cta-band'.
const { launch, open } = require('./common');
(async () => {
  const b = await launch();
  for (const [label, url, sel] of [['today /pricing/', 'http://localhost:8730/pricing/', '.cta-band'], ['kit pricing copy', 'test/pricing-with-kit.html', '.kws-close'], ['today /start/', 'http://localhost:8730/start/', '.cta-band'], ['kit start copy', 'test/start-with-kit.html', '.kws-close']]) {
    const p = await open(b, url, { ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    await p.waitForTimeout(800);
    const out = [];
    for (const frac of [0.15, 0.5, 0.85]) {
      // put the band's point `frac` of the way down at the middle of the screen, footer not yet in view where possible
      const r = await p.evaluate(async ({ sel, frac }) => {
        document.documentElement.style.scrollBehavior = 'auto';
        const band = document.querySelector(sel), q = band.getBoundingClientRect();
        scrollTo(0, q.top + scrollY + q.height * frac - innerHeight * 0.5);
        await new Promise(r => setTimeout(r, 500));
        const bar = document.getElementById('mobile-cta'), bq = bar.getBoundingClientRect(), fq = document.querySelector('.site-footer').getBoundingClientRect();
        const shown = bar.classList.contains('show');
        const covered = [...band.querySelectorAll('a')].filter(a => { const aq = a.getBoundingClientRect(); return shown && aq.bottom > bq.top && aq.top < bq.bottom; }).map(a => a.textContent.trim().slice(0, 26));
        return { shown, barTop: Math.round(bq.top), barH: Math.round(bq.height), footerInView: fq.top < innerHeight, covered, barText: bar.textContent.trim().replace(/\s+/g, ' ').slice(0, 60) };
      }, { sel, frac });
      out.push(`band ${Math.round(frac * 100)}% -> bar shown: ${r.shown}${r.shown ? ' (covers y ' + r.barTop + '..' + (r.barTop + r.barH) + '; band links under it: ' + (r.covered.join(', ') || 'none') + ')' : ''}; footer in view: ${r.footerInView}`);
      if (frac === 0.5) await p.screenshot({ path: `phonebar-${label.replace(/\W+/g, '-')}.png` });
    }
    console.log(label + ':\n  ' + out.join('\n  '));
    await p.context().close();
  }
  await b.close();
})();
