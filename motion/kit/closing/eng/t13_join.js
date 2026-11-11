// The join between the end of <main> and the new footer on pages that end on paper (no band), with main's bottom padding removed as NOTES asks.
// Uses the real pages from the repository with the kit footer swapped in at run time.
const { launch, open, end } = require('./common');
const fs = require('fs');
(async () => {
  const b = await launch();
  const kitFoot = fs.readFileSync('../footer.inc', 'utf8').replace('{{skyline}}', fs.readFileSync('../skyline.inc', 'utf8'));
  const css = ['../closing.css', '../appt.css', '../footer.css', '../skyline.css'].map(f => fs.readFileSync(f, 'utf8')).join('\n') + '\nmain{padding-bottom:0}';
  for (const path of ['/contact/', '/privacy/', '/faq/', '/about/', '/checkout/', '/web-design-gonzales/']) for (const w of [390, 1440]) {
    const p = await open(b, 'http://localhost:8730' + path, { ctx: { viewport: { width: w, height: 900 } } });
    await p.waitForTimeout(500);
    const r = await p.evaluate(({ kitFoot, css }) => {
      document.documentElement.style.scrollBehavior = 'auto'; document.documentElement.classList.remove('js');
      const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
      const old = document.querySelector('footer.site-footer'); const crest = old.querySelector('svg.crest, .brand svg, .brand img'); const t = document.createElement('div'); t.innerHTML = kitFoot; const nf = t.querySelector('footer');
      if (crest) nf.querySelector('.kws-foot-logo').insertBefore(crest.cloneNode(true), nf.querySelector('.kws-foot-logo').firstChild);
      old.replaceWith(nf);
      const main = document.querySelector('main'), last = main.lastElementChild, lq = last.getBoundingClientRect(), fq = nf.getBoundingClientRect();
      // the last visible content inside main: how far is its bottom from the footer's top?
      let bottom = 0; main.querySelectorAll('p, a, h1, h2, h3, li, button, input, img, svg, td, dd').forEach(e => { const q = e.getBoundingClientRect(); if (q.width && q.height && !e.closest('[hidden]')) bottom = Math.max(bottom, q.bottom); });
      return { lastSection: last.tagName + '.' + String(last.className).split(' ').slice(0, 2).join('.'), band: !!main.querySelector('.cta-band'), gapContentToFooter: Math.round(fq.top - bottom), lastBg: getComputedStyle(last).backgroundColor, mainPB: getComputedStyle(main).paddingBottom };
    }, { kitFoot, css });
    await end(p); await p.waitForTimeout(300);
    const y = await p.evaluate(() => { const f = document.querySelector('footer.kws-foot').getBoundingClientRect(); scrollTo(0, f.top + scrollY - 420); return 0; });
    await p.waitForTimeout(300);
    if (w === 390 || path === '/contact/') await p.screenshot({ path: `join-${path.replace(/\W+/g, '') || 'home'}-${w}.png` });
    console.log(`${path} ${w}: last block in main ${r.lastSection}${r.band ? ' (old band still in this page)' : ''}; last content ends ${r.gapContentToFooter}px above the footer's top edge; main padding-bottom ${r.mainPB}`);
    await p.context().close();
  }
  await b.close();
})();
