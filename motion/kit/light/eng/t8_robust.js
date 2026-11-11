const { launch, ctx, URL, PORT } = require('./common');
const tabFit = p => p.evaluate(() => [...document.querySelectorAll('[role=tab]')].map(t => {
  const cs = getComputedStyle(t), box = t.getBoundingClientRect(); const L = box.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth), R = box.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth);
  let over = 0, lines = 0; const tw = document.createTreeWalker(t, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { if (!/\S/.test(n.data)) continue; const r = document.createRange(); r.selectNodeContents(n); const rects = [...r.getClientRects()].filter(q => q.width > 0); lines += rects.length; for (const q of rects) over = Math.max(over, q.right - R, L - q.left, q.right - box.right); }
  const cv = document.createElement('canvas').getContext('2d'); let spare = 1e9;
  for (const el of [t, ...t.querySelectorAll('b,span')]) { const c2 = getComputedStyle(el); cv.font = c2.fontWeight + ' ' + c2.fontSize + ' ' + c2.fontFamily; for (const w of [...el.childNodes].filter(x => x.nodeType === 3).map(x => x.data.trim()).join(' ').split(/\s+/).filter(Boolean)) spare = Math.min(spare, (R - L) - cv.measureText(w).width); }
  return { n: t.textContent.trim().replace(/\s+/g, ' ').slice(0, 26), w: Math.round(box.width), h: Math.round(box.height), fs: parseFloat(cs.fontSize), lines, over: +over.toFixed(1), spare: +spare.toFixed(1) };
}));
(async () => {
  const b = await launch();
  // 1. tabs fit at phone widths, with and without web fonts
  for (const fonts of ['web fonts', 'fonts blocked (fallback)']) {
    for (const w of [360, 375, 390, 412, 430]) {
      const c = await ctx(b, { viewport: { width: w, height: 800 } }); const p = await c.newPage();
      if (fonts !== 'web fonts') await p.route(/\.woff2?/, r => r.abort());
      await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(700);
      const t = (await tabFit(p)).slice(0, 4);
      console.log('tabs @' + w + ' ' + fonts + ': ' + t.map(x => '"' + x.n + '" ' + x.w + 'x' + x.h + ' ' + x.fs + 'px lines ' + x.lines + ' over ' + x.over + ' spare ' + x.spare).join(' | '));
      if (w === 360) await p.locator('#pricing .kws-folders-tabs').screenshot({ path: 'tabs-360-' + (fonts === 'web fonts' ? 'web' : 'fallback') + '.png' });
      await c.close();
    }
  }
  // 2. text-size increase (root font 200%) at 390 and 1280: overflow?
  for (const w of [390, 1280]) {
    const c = await ctx(b, { viewport: { width: w, height: 800 } }); const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'load' }); await p.addStyleTag({ content: 'html{font-size:200%}' }); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, clipped: [...document.querySelectorAll('[class*="kws-"]')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && getComputedStyle(e).visibility !== 'hidden' && e.tagName !== 'CANVAS'; }).map(e => e.className.toString().split(' ')[0]).slice(0, 5), tabFs: getComputedStyle(document.querySelector('[role=tab]')).fontSize, labelFs: getComputedStyle(document.querySelector('.kws-label')).fontSize, h3Fs: getComputedStyle(document.querySelector('.kws-mark h3')).fontSize }));
    console.log('root font-size 200% @' + w + ':', JSON.stringify(r), JSON.stringify((await tabFit(p)).slice(0, 4).map(x => [x.n, x.fs, 'over ' + x.over])));
    await p.evaluate(() => document.querySelector('#pricing').scrollIntoView({ behavior: 'instant' })); await p.screenshot({ path: 'textzoom200-' + w + '.png' });
    await c.close();
  }
  // 3. 200% browser zoom of a 1280 desktop = 640 CSS px; 400% = 320 CSS px (reflow)
  for (const w of [640, 320]) {
    const c = await ctx(b, { viewport: { width: w, height: 700 }, deviceScaleFactor: 2 }); const p = await c.newPage();
    await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const r = await p.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, bodyOverflowX: getComputedStyle(document.body).overflowX }));
    console.log('zoom-equivalent ' + w + 'px:', JSON.stringify(r), JSON.stringify((await tabFit(p)).slice(0, 4).map(x => [x.n, x.fs, 'lines ' + x.lines, 'over ' + x.over])));
    await p.evaluate(() => document.querySelector('#pricing .kws-folders').scrollIntoView({ behavior: 'instant' })); await p.screenshot({ path: 'zoom-' + w + '.png' });
    await c.close();
  }
  // 4. item counts and long names on the bare page (no site CSS)
  {
    const c = await ctx(b, { viewport: { width: 360, height: 800 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(PORT, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const mk = (n, names, attrs) => p.evaluate(({ n, names, attrs }) => {
      const old = document.querySelector('.kws-test'); if (old) old.parentNode.removeChild(old);
      const root = document.createElement('div'); root.className = 'kws-folders kws-folders--stack kws-test'; root.setAttribute('data-kws', 'folders'); root.setAttribute('data-label', 'Test'); for (const k in (attrs || {})) root.setAttribute(k, attrs[k]);
      for (let i = 0; i < n; i++) { const a = document.createElement('article'); a.className = 'kws-folder'; const price = '$' + ((i + 1) * 1000); a.innerHTML = '<h3 class="kws-folder-tab">' + (names ? names[i % names.length] : 'Item ' + (i + 1)) + ' <b>' + price + '</b></h3><div class="kws-folder-body"><p class="kws-folder-price">' + price + '</p><p>Body ' + (i + 1) + ' Donaudampfschifffahrtsgesellschaftskapitänswitwe and a long line of words that should wrap normally.</p><p><a href="#x' + i + '">Link ' + (i + 1) + '</a></p></div>'; root.appendChild(a); }
      document.querySelector('.wrap').prepend(root); window.__end = KWS.folders.mount(root); scrollTo(0, 0);
      const tabs = [...root.querySelectorAll('[role=tab]')]; const list = root.querySelector('[role=tablist]');
      return { tabs: tabs.length, tablist: !!list, selected: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length, front: root.querySelectorAll('.is-front').length, visiblePanels: [...root.querySelectorAll('.kws-folder')].filter(f => getComputedStyle(f).visibility === 'visible').length, pageOver: document.documentElement.scrollWidth - innerWidth, rootW: Math.round(root.getBoundingClientRect().width), minTabW: tabs.length ? Math.round(Math.min(...tabs.map(t => t.getBoundingClientRect().width))) : null, bodyOver: [...root.querySelectorAll('.kws-folder-body')].map(b => b.scrollWidth - b.clientWidth).filter(x => x > 0) };
    }, { n, names, attrs });
    for (const [label, n, names, attrs] of [['0 folders', 0], ['1 folder', 1], ['2 folders', 2], ['7 folders', 7], ['4 long names', 4, ['Extraordinarily-long-package-name', 'Wirtschaftsprüfungsgesellschaft', 'Internationalisation', 'Supercalifragilistic']], ['data-start=9 (out of range)', 3, null, { 'data-start': '9' }], ['data-start=0', 3, null, { 'data-start': '0' }], ['data-start=abc', 3, null, { 'data-start': 'abc' }]]) {
      const r = await mk(n, names, attrs); const fit = (await tabFit(p)).slice(0, n);
      console.log(label + ' @360:', JSON.stringify(r), 'tab text overflow px:', JSON.stringify(fit.map(x => x.over)), 'lines', JSON.stringify(fit.map(x => x.lines)));
      await p.screenshot({ path: 'items-' + label.replace(/[^a-z0-9]+/gi, '-') + '.png', clip: { x: 0, y: 0, width: 360, height: 420 } });
      await p.evaluate(() => window.__end && window.__end());
    }
    // long words in cards
    const lw = await p.evaluate(() => { const h = document.querySelector('.kws-mark h3 a'); h.firstChild.data = 'Donaudampfschifffahrtsgesellschaftskapitän & Wirtschaftsprüfung'; document.querySelector('.kws-mark-price').textContent = '$1,000,000,000,000,000 or $2,000,000,000,000,000'; document.querySelector('.kws-folder-body h3 a').firstChild.data = 'Rindfleischetikettierungsüberwachungsaufgabenübertragungsgesetz'; document.querySelector('.kws-label').textContent = 'AVERYLONGUPPERCASELABELWITHOUTANYSPACESATALLTOBREAK'; return { pageOver: document.documentElement.scrollWidth - innerWidth, offenders: [...document.querySelectorAll('.kws-mark, .kws-mark *, .kws-folder-body, .kws-folder-body *, .kws-label')].filter(e => e.getBoundingClientRect().right > innerWidth + .5 || e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).display !== 'inline').map(e => (e.className || e.tagName).toString().split(' ')[0] + ' sw+' + (e.scrollWidth - e.clientWidth)).slice(0, 8) }; });
    console.log('long words in cards @360:', JSON.stringify(lw)); await p.evaluate(() => document.querySelector('#cards').scrollIntoView({ behavior: 'instant' })); await p.screenshot({ path: 'longwords-360.png' });
    console.log('page errors:', errs.join(' | ') || 'none');
    await c.close();
  }
  await b.close();
})();
