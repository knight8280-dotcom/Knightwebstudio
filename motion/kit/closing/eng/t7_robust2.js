// 6b. Missing crest, zoom, theme toggle while live, duplicate ids, bfcache, rotation, print, forced colours, how long a word the title holds.
const { launch, open, end, BLOCK } = require('./common');
const ROOTS = '.kws-close, .kws-appt, .kws-foot';
(async () => {
  const b = await launch();
  // (a) the crest marker left empty (art build not run, or a client with no mark)
  for (const w of [390, 1440]) {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: w, height: 900 } } });
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const l = document.querySelector('.kws-foot-logo'); const before = l.getBoundingClientRect(); const first = l.firstElementChild; const tag = first.tagName + (first.getAttribute('aria-hidden') ? '[aria-hidden]' : ''); first.remove(); const s = l.querySelector('span').getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(l.querySelector('span')); const t = range.getBoundingClientRect(); return { crestWas: tag, linkBefore: Math.round(before.width) + 'x' + Math.round(before.height), spanBox: Math.round(s.width) + 'x' + Math.round(s.height), textBox: Math.round(t.width) + 'x' + Math.round(t.height), link: Math.round(l.getBoundingClientRect().width) + 'x' + Math.round(l.getBoundingClientRect().height) }; });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.kws-foot-logo').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(300);
    const q = await p.evaluate(() => { const r = document.querySelector('.kws-foot-logo').getBoundingClientRect(); return { x: 0, y: Math.max(0, Math.min(innerHeight - 110, r.top - 20)), width: Math.min(innerWidth, 500), height: 110 }; });
    await p.screenshot({ path: `nocrest-${w}.png`, clip: q });
    console.log(`crest removed ${w}: ${JSON.stringify(r)}`);
    await p.context().close();
  }
  // (b) zoom: 200% browser zoom of 1280 and 1440 wide windows, of a 390 phone (=195 css px is not required; 320 is), and text-only 200%
  for (const [label, w, h, fs] of [['1280 at 200% (640 css px)', 640, 360, null], ['1440 at 200%', 720, 450, null], ['1280 at 400% (320 css px, reflow)', 320, 256, null], ['text only 200% at 1440', 1440, 900, '200%'], ['text only 200% at 390', 390, 844, '200%'], ['text only 200% at 760', 760, 900, '200%']]) {
    for (const url of ['test/pricing-with-kit.html', 'portable.html']) {
      const p = await open(b, url, { ctx: { viewport: { width: w, height: h } } });
      if (fs) await p.addStyleTag({ content: `html{font-size:${fs}}` });
      await p.waitForTimeout(500);
      const r = await p.evaluate(ROOTS => { const off = [], clip = []; for (const el of document.querySelectorAll(':is(' + ROOTS + ') :is(a, p, h2, li, dt, dd, button, span)')) { if (el.closest('[aria-hidden="true"], [hidden]')) continue; const q = el.getBoundingClientRect(); if (!q.width) continue; if (q.left < -0.5 || q.right > innerWidth + 0.5) off.push(String(el.className || el.tagName).split(' ')[0] + ' ' + Math.round(q.left) + '..' + Math.round(q.right)); }
        const ov = []; const els = [...document.querySelectorAll(':is(' + ROOTS + ') :is(a, dt, dd, h2, button)')].filter(e => !e.closest('[aria-hidden="true"], [hidden]') && e.getBoundingClientRect().width); for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { if (els[i].contains(els[j]) || els[j].contains(els[i])) continue; const a = els[i].getBoundingClientRect(), c = els[j].getBoundingClientRect(); if (Math.min(a.right, c.right) - Math.max(a.left, c.left) > 2 && Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top) > 2) ov.push(els[i].textContent.trim().slice(0, 14) + ' x ' + els[j].textContent.trim().slice(0, 14)); }
        return { over: document.documentElement.scrollWidth - innerWidth, off: [...new Set(off)].slice(0, 5), ov: ov.slice(0, 5), foot: Math.round(document.querySelector('.kws-foot').getBoundingClientRect().height), tel: getComputedStyle(document.querySelector('.kws-foot-tel')).fontSize, title: getComputedStyle(document.querySelector('.kws-close-title')).fontSize }; }, ROOTS);
      console.log(`zoom ${label} | ${url}: sideways ${r.over}px; off-screen ${r.off.join(', ') || 'none'}; overlapping ${r.ov.join(', ') || 'none'}; footer ${r.foot}px; title ${r.title}, number ${r.tel}`);
      if (fs && w !== 760) { await end(p); await p.waitForTimeout(200); await p.screenshot({ path: `zoomtext-${w}-${url.replace(/\W+/g, '-')}.png`, fullPage: false }); }
      await p.context().close();
    }
  }
  // (c) theme toggled while the band and the sky are live
  {
    const p = await open(b, 'test/pricing-with-kit.html', { theme: 'light', ctx: { viewport: { width: 1440, height: 900 } } });
    await p.waitForTimeout(1500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; const c = document.querySelector('.kws-close'); scrollTo(0, c.getBoundingClientRect().top + scrollY - 80); });
    await p.waitForTimeout(1500);
    const snap = () => p.evaluate(() => ({ band: getComputedStyle(document.querySelector('.kws-close')).backgroundColor, foot: getComputedStyle(document.querySelector('.kws-foot')).backgroundColor, card: getComputedStyle(document.querySelector('.kws-appt')).backgroundColor, btn: getComputedStyle(document.querySelector('.kws-appt-btn')).backgroundColor, live: document.querySelectorAll('.kws-shader.is-live').length, theme: document.documentElement.getAttribute('data-theme') }));
    const a = await snap(); await p.screenshot({ path: 'theme-a-light.png' });
    for (let i = 0; i < 5; i++) { await p.evaluate(() => document.getElementById('theme-toggle').click()); await p.waitForTimeout(60); }   // rapid toggling: ends on dark
    await p.waitForTimeout(1500);
    const c = await snap(); await p.screenshot({ path: 'theme-b-dark.png' });
    console.log(`theme toggled 5x quickly while live: before ${JSON.stringify(a)} | after ${JSON.stringify(c)} | console ${p.errs.filter(e => !/404/.test(e)).join(' | ') || 'clean'}`);
    await p.context().close();
  }
  // (d) duplicate ids on a page that holds several bands and footers
  for (const url of ['demo.html', 'test/pricing-with-kit.html', 'test/start-with-kit.html']) {
    const p = await open(b, url, { ctx: { viewport: { width: 1440, height: 900 } } });
    const d = await p.evaluate(() => { const m = {}; document.querySelectorAll('[id]').forEach(e => { m[e.id] = (m[e.id] || 0) + 1; }); const dup = Object.entries(m).filter(x => x[1] > 1).map(x => x[0] + '×' + x[1]); const broken = [...document.querySelectorAll('[aria-labelledby]')].filter(e => !document.getElementById(e.getAttribute('aria-labelledby'))).map(e => e.className); const top = !!document.getElementById('top'); return { dup, broken, top, year: document.querySelectorAll('#year').length }; });
    console.log(`ids ${url}: duplicates ${d.dup.join(', ') || 'none'}; broken aria-labelledby ${d.broken.join(', ') || 'none'}; #top target present: ${d.top}; #year count ${d.year}`);
    await p.context().close();
  }
  // (e) back/forward cache
  {
    const c = await b.newContext({ viewport: { width: 390, height: 844 } }); await c.route(BLOCK, r => r.abort());
    const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, document.documentElement.scrollHeight); window.__marker = 'kept'; addEventListener('pageshow', e => { window.__persisted = e.persisted; }); });
    await p.waitForTimeout(1200);
    await p.evaluate(() => document.querySelector('.kws-foot .kws-motion').click()); // pause, then leave
    const before = await p.evaluate(() => ({ y: scrollY, live: document.querySelectorAll('.kws-shader.is-live').length, motion: document.documentElement.getAttribute('data-motion') }));
    await p.goto('http://localhost:8730/kit/closing/portable.html', { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.goBack({ waitUntil: 'load' }).catch(() => {}); await p.waitForTimeout(1500);
    const after = await p.evaluate(() => { const n = document.querySelector('.kws-skyline-name'); return { marker: window.__marker || 'page was reloaded', persisted: window.__persisted, y: scrollY, atEnd: Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) < 2, live: document.querySelectorAll('.kws-shader.is-live').length, motion: document.documentElement.getAttribute('data-motion'), label: document.querySelector('.kws-foot .kws-motion').getAttribute('aria-label'), nameY: new DOMMatrix(getComputedStyle(n).transform).m42, anims: n.getAnimations().length, year: document.getElementById('year').textContent, bar: document.getElementById('mobile-cta').classList.contains('show') }; });
    console.log(`bfcache: before ${JSON.stringify(before)} | after back ${JSON.stringify(after)} | errors ${errs.join('|') || 'none'}`);
    await c.close();
  }
  // (f) rotation: phone portrait -> landscape -> portrait at the page end
  {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    await p.waitForTimeout(1000);
    const st = async () => { await end(p); await p.waitForTimeout(500); return p.evaluate(() => { const n = document.querySelector('.kws-skyline-name'), s = n.parentElement.getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(n); const t = r.getBoundingClientRect(); const a = n.getAnimations()[0]; return { vw: innerWidth, over: document.documentElement.scrollWidth - innerWidth, nameW: Math.round(t.width), sceneW: Math.round(s.width), sceneH: Math.round(s.height), y: +new DOMMatrix(getComputedStyle(n).transform).m42.toFixed(2), prog: a && +a.effect.getComputedTiming().progress.toFixed(3), cols: getComputedStyle(document.querySelector('.kws-foot-grid')).gridTemplateColumns.split(' ').length, canvas: [...document.querySelectorAll('.kws-foot canvas, .kws-close canvas')].map(c => c.width + 'x' + c.height).join(',') }; }); };
    const a = await st(); await p.setViewportSize({ width: 844, height: 390 }); const l = await st(); await p.screenshot({ path: 'landscape-end.png' }); await p.setViewportSize({ width: 390, height: 844 }); const c = await st();
    console.log(`rotation: portrait ${JSON.stringify(a)}\n          landscape ${JSON.stringify(l)}\n          portrait again ${JSON.stringify(c)}`);
    await p.context().close();
  }
  // (g) print and (h) forced colours
  {
    const p = await open(b, 'test/pricing-with-kit.html', { ctx: { viewport: { width: 1000, height: 900 } } });
    await p.emulateMedia({ media: 'print' }); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ band: getComputedStyle(document.querySelector('.kws-close')).display, bandBg: getComputedStyle(document.querySelector('.kws-close')).backgroundImage.slice(0, 60), sky: getComputedStyle(document.querySelector('.kws-skyline')).display, foot: getComputedStyle(document.querySelector('.kws-foot')).display, footColor: getComputedStyle(document.querySelector('.kws-foot')).color, footBg: getComputedStyle(document.querySelector('.kws-foot')).backgroundColor, link: getComputedStyle(document.querySelector('.kws-foot a')).color, bandTitle: getComputedStyle(document.querySelector('.kws-close-title')).color }));
    await p.evaluate(() => document.querySelector('.kws-close').scrollIntoView()); await p.screenshot({ path: 'print-band.png' });
    console.log('print (site print rule as it stands today, .kws-close not yet in it):', JSON.stringify(r));
    await p.context().close();
    const c = await b.newContext({ viewport: { width: 390, height: 844 }, forcedColors: 'active' }); await c.route(BLOCK, r => r.abort());
    const q = await c.newPage(); await q.goto('http://localhost:8730/kit/closing/test/pricing-with-kit.html'); await q.waitForTimeout(1200);
    await q.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('.kws-close').scrollIntoView(); }); await q.waitForTimeout(400); await q.screenshot({ path: 'forced-band.png' });
    const f = await q.evaluate(() => { const o = {}; for (const s of ['.kws-close-btn', '.kws-appt-btn', '.kws-foot-go', '.kws-foot .kws-motion']) { const e = document.querySelector(s), cs = getComputedStyle(e); o[s] = 'border ' + cs.borderTopWidth + ' ' + cs.borderTopStyle + ', bg ' + cs.backgroundColor + ', text ' + cs.color; } return o; });
    await q.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await q.waitForTimeout(300); await q.screenshot({ path: 'forced-foot.png' });
    console.log('forced colours:', JSON.stringify(f));
    await c.close();
  }
  // (i) how long a single word the title, a button and a card value hold before the page scrolls sideways
  for (const w of [320, 360, 390]) {
    const p = await open(b, 'demo.html', { ctx: { viewport: { width: w, height: 844 } } });
    await p.waitForTimeout(400);
    const r = await p.evaluate(() => { const out = {}; const probe = (sel, label) => { const el = document.querySelector(sel); const keep = el.innerHTML; let n = 6; for (; n < 60; n++) { el.textContent = 'Electrodomesticosymantenimientogeneralparasuhogarynegociolocal'.slice(0, n); if (document.documentElement.scrollWidth > innerWidth) break; } el.innerHTML = keep; out[label] = n; };
      probe('.kws-close:not(.kws-close--card):not(.kws-close--strip) .kws-close-title', 'statement title'); probe('.kws-close--strip .kws-close-title', 'strip title'); probe('.kws-close--card .kws-close-title', 'card-layout title'); probe('.kws-close-btn--main', 'band button'); probe('.kws-appt-btn', 'card button'); probe('.kws-appt dd', 'card value'); probe('.kws-foot-bye', 'footer sign-off'); probe('.kws-foot li a', 'footer link'); return out; });
    console.log(`longest unbroken word before sideways scroll at ${w}px (letters; 60 = never):`, JSON.stringify(r));
    await p.context().close();
  }
  await b.close();
})();
