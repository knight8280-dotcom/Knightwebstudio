// Odds and ends: the pause button's icon inside the footer; old .site-footer rules still acting on the new footer; statement title word length;
// what the kit looks like when the tone-scope class is forgotten; non-text contrast of controls.
const { launch, open, end } = require('./common');
(async () => {
  const b = await launch();
  for (const w of [390, 1440]) {
    const p = await open(b, 'demo.html', { ctx: { viewport: { width: w, height: 900 } } });
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => [...document.querySelectorAll('.kws-motion')].filter(x => !x.hidden).map(btn => { const q = btn.getBoundingClientRect(), s = [...btn.querySelectorAll('svg')].find(v => getComputedStyle(v).display !== 'none').getBoundingClientRect(), cs = getComputedStyle(btn); return { where: btn.closest('.kws-foot') ? 'footer' + (btn.closest('.kws-foot--slim') ? ' (slim)' : '') : 'demo header', display: cs.display, justify: cs.justifyContent, btn: Math.round(q.width) + 'x' + Math.round(q.height), iconOffCentreX: +(s.left + s.width / 2 - (q.left + q.width / 2)).toFixed(1), iconOffCentreY: +(s.top + s.height / 2 - (q.top + q.height / 2)).toFixed(1), bg: cs.backgroundColor, border: cs.borderTopColor, color: cs.color }; }));
    console.log(`pause button ${w}:`, JSON.stringify(r));
    const el = p.locator('.site-footer .kws-motion'); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    await el.screenshot({ path: `pausebtn-${w}.png` });
    await p.context().close();
  }
  // What do the site's old .site-footer rules still give the new footer? (they are to be deleted at integration)
  {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 1440, height: 900 } } });
    await p.waitForTimeout(800);
    const r = await p.evaluate(() => { const f = document.querySelector('footer.kws-foot'); const props = ['position', 'paddingTop', 'paddingBottom', 'fontSize', 'marginTop', 'height']; const grab = () => { const cs = getComputedStyle(f); const o = {}; props.forEach(k => o[k] = cs[k]); o.h = Math.round(f.getBoundingClientRect().height); o.crest = Math.round(f.querySelector('.kws-foot-logo > :first-child').getBoundingClientRect().width); return o; }; const a = grab(); f.classList.remove('site-footer'); const c = grab(); f.classList.add('site-footer'); return { with: a, without: c }; });
    console.log('footer with class site-footer:', JSON.stringify(r.with), '\n   without it (as after the old rules are deleted):', JSON.stringify(r.without));
    await p.context().close();
  }
  // statement title: longest single word at each phone width (the site's own statement band, last on the demo page)
  for (const w of [320, 360, 390, 430]) {
    const p = await open(b, 'demo.html', { ctx: { viewport: { width: w, height: 844 } } });
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const all = [...document.querySelectorAll('.kws-close:not(.kws-close--card):not(.kws-close--strip) .kws-close-title')]; const el = all[all.length - 1]; const keep = el.innerHTML; let n = 4; for (; n < 60; n++) { el.textContent = 'Electrodomesticosymantenimientogeneralparasuhogarynegociolocal'.slice(0, n); if (document.documentElement.scrollWidth > innerWidth) break; } const fs = getComputedStyle(el).fontSize; el.innerHTML = keep;
      const mk = el.querySelector('.kws-close-mark'); const keep2 = mk.textContent; const tries = ['free call', 'free estimate', 'your free estimate', 'free estimate visit', 'thirty-minute call', 'a free thirty-minute call']; const res = {}; for (const t of tries) { mk.textContent = t; res[t] = document.documentElement.scrollWidth - innerWidth; } mk.textContent = keep2; return { fs, letters: n, mark: res }; });
    console.log(`statement title at ${w}px: font ${r.fs}; first single word that makes the page scroll sideways: ${r.letters} letters; marked phrase -> px of sideways scroll: ${JSON.stringify(r.mark)}`);
    await p.context().close();
  }
  // tone-scope class forgotten on this site (band without on-blue, footer without on-ink, card on blue without on-paper)
  for (const theme of ['light', 'dark']) {
    const p = await open(b, 'test/pricing-with-kit.html', { theme, ctx: { viewport: { width: 390, height: 844 } } });
    await p.waitForTimeout(800);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.kws-close').classList.remove('on-blue'); document.querySelector('.kws-close').scrollIntoView(); });
    await p.waitForTimeout(700);
    const r = await p.evaluate(() => { const c = document.querySelector('.kws-close'), t = c.querySelector('.kws-close-title'); return { band: getComputedStyle(c).backgroundColor, title: getComputedStyle(t).color, text: getComputedStyle(c).color, kicker: getComputedStyle(c.querySelector('.kws-close-kicker')).color }; });
    await p.screenshot({ path: `noscope-band-${theme}.png` });
    console.log(`band WITHOUT on-blue, ${theme}:`, JSON.stringify(r));
    await p.context().close();
  }
  // non-text contrast: button edges and the focus rings against what is around them (computed colours)
  {
    const lin = v => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); };
    const L = c => { const m = c.match(/[\d.]+/g).map(Number); return .2126 * lin(m[0]) + .7152 * lin(m[1]) + .0722 * lin(m[2]); };
    const cr = (a, c) => { const x = L(a), y = L(c); return ((Math.max(x, y) + .05) / (Math.min(x, y) + .05)).toFixed(2); };
    for (const theme of ['light', 'dark']) {
      const p = await open(b, 'test/pricing-with-kit.html', { theme, ctx: { viewport: { width: 1440, height: 900 } } });
      await p.waitForTimeout(600);
      const c = await p.evaluate(() => { const g = (s, k) => getComputedStyle(document.querySelector(s))[k]; return { band: g('.kws-close', 'backgroundColor'), foot: g('.kws-foot', 'backgroundColor'), card: g('.kws-appt', 'backgroundColor'), apptBtn: g('.kws-appt-btn', 'backgroundColor'), apptBtnText: g('.kws-appt-btn', 'color'), secBorder: g('.kws-close-btn', 'borderTopColor'), goBorder: g('.kws-foot-go', 'borderTopColor'), line: g('.kws-foot-grid + *', 'borderTopColor'), focusBand: g('.kws-close', '--focus'), gold: g('.kws-foot-title', 'color'), lit: g('.kws-skyline-lit', 'fill'), muted: g('.kws-foot li > span', 'color'), dt: g('.kws-appt dt', 'color'), head: g('.kws-appt-head', 'color') }; });
      console.log(`${theme}: card button on card ${cr(c.apptBtn, c.card)}:1, its label ${cr(c.apptBtnText, c.apptBtn)}:1; second button outline on band ${cr(c.secBorder, c.band)}:1; "Start a project" outline on footer ${cr(c.goBorder, c.foot)}:1; gold on band ${cr(c.gold, c.band)}:1, gold on footer ${cr(c.gold, c.foot)}:1; plain place names on footer ${cr(c.muted, c.foot)}:1; card label ${cr(c.dt, c.card)}:1, card head ${cr(c.head, c.card)}:1`);
      await p.context().close();
    }
  }
  await b.close();
})();
