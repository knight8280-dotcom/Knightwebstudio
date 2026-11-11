const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 360, height: 800 } });
  for (const w of [320, 340, 356, 360, 375, 980, 990]) {
    await p.setViewportSize({ width: w, height: 800 });
    await p.goto('http://localhost:8720/about/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const top = document.querySelector('.bizcard-top'); const span = top.querySelector('span'); const crest = top.querySelector('svg');
      const cs = getComputedStyle(top); const inner = top.clientWidth; const gap = parseFloat(cs.columnGap);
      const c = span.cloneNode(true); c.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden'; span.parentNode.appendChild(c); const nat = c.getBoundingClientRect().width; c.remove();
      // rotation changes getBoundingClientRect; use offsetWidth
      const c2 = span.cloneNode(true); c2.style.cssText = 'position:absolute;white-space:nowrap;visibility:hidden;display:inline-block'; span.parentNode.appendChild(c2); const nat2 = c2.offsetWidth; c2.remove();
      return { inner, crest: crest.clientWidth || parseFloat(getComputedStyle(crest).width), gap, room: inner - parseFloat(getComputedStyle(crest).width) - gap, natural: nat2, natRot: Math.round(nat * 10) / 10, cardW: document.querySelector('.bizcard').offsetWidth, ls: getComputedStyle(span).letterSpacing }; });
    console.log(w, JSON.stringify(r));
  }
  await b.close();
})();
