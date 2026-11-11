// Keyboard focus: order, ring (computed + contrast vs. background), obscured by sticky header / phone bar; no-JS render.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const OUT = __dirname + '/fshots';
require('fs').mkdirSync(OUT, { recursive: true });

function info() {
  const e = document.activeElement; if (!e || e === document.body) return null;
  const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const over = (t, b) => ({ r: t.r * t.a + b.r * (1 - t.a), g: t.g * t.a + b.g * (1 - t.a), b: t.b * t.a + b.b * (1 - t.a), a: 1 });
  // background outside the element (ring sits outside with offset): use the parent's composite background
  let layers = []; for (let p = e.parentElement; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c.a > 0) { layers.push(c); if (c.a === 1) break; } }
  let bg = { r: 255, g: 255, b: 255, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
  const oc = parse(cs.outlineColor); const ratio = (Math.max(lum(oc), lum(bg)) + .05) / (Math.min(lum(oc), lum(bg)) + .05);
  // obscured?
  const hdr = document.querySelector('.site-header'); const hb = hdr ? hdr.getBoundingClientRect() : null; const hdrSticky = hdr && getComputedStyle(hdr).position === 'sticky';
  const bar = document.getElementById('mobile-cta'); const barShown = bar && bar.classList.contains('show'); const bb = bar ? bar.getBoundingClientRect() : null;
  const underHeader = hdrSticky && !hdr.contains(e) && r.top < hb.bottom - 1 && r.bottom > hb.top;
  const underBar = barShown && !bar.contains(e) && r.bottom > bb.top + 1;
  const offscreen = r.bottom < 0 || r.top > innerHeight;
  // elementFromPoint at centre
  const cx = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), cy = r.top + r.height / 2; const top = cy >= 0 && cy <= innerHeight ? document.elementFromPoint(cx, cy) : null;
  const covered = top && !(e.contains(top) || top.contains(e));
  return { tag: e.tagName.toLowerCase(), text: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44), zone: e.closest('main') ? 'main' : e.closest('footer') ? 'footer' : e.closest('#mobile-cta') ? 'bar' : 'head', outline: cs.outlineStyle + ' ' + cs.outlineWidth, oc: cs.outlineColor, off: cs.outlineOffset, ratio: +ratio.toFixed(2), y: Math.round(r.top), x: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), underHeader, underBar, offscreen, covered: covered ? (top.className && top.className.toString ? top.tagName + '.' + top.className : top.tagName) : false, clipped: (() => { for (let p = e.parentElement; p; p = p.parentElement) { const ps = getComputedStyle(p); if (/(hidden|clip)/.test(ps.overflow + ps.overflowX + ps.overflowY) && p !== document.body) return p.className || p.tagName; } return false; })() };
}

(async () => {
  const b = await chromium.launch();
  for (const [path, w, h, theme] of [['/about/', 1440, 900, 'light'], ['/about/', 1440, 900, 'dark'], ['/about/', 390, 844, 'light'], ['/about/', 390, 844, 'dark'], ['/404.html', 1440, 900, 'light'], ['/404.html', 390, 844, 'dark'], ['/404.html', 390, 844, 'light']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(1300);
    const stops = []; let shots = 0;
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(w < 500 ? 420 : 120);
      const s = await p.evaluate(info); if (!s) break;
      if (stops.length > 3 && s.text === stops[0].text && s.zone === stops[0].zone) break;
      stops.push(s);
      if (s.zone === 'main' && (s.underBar || s.underHeader || s.covered) && shots < 6) { shots++; await p.screenshot({ path: `${OUT}/obscured-${path.replace(/\W/g, '')}-${w}-${theme}-${stops.length}.png` }); }
      if (s.zone === 'main' && [1, 2, 4, 5, 9, 12, 15].includes(stops.filter(x => x.zone === 'main').length) && theme !== 'x') await p.screenshot({ path: `${OUT}/focus-${path.replace(/\W/g, '')}-${w}-${theme}-${stops.length}.png` });
    }
    console.log(`\n== ${path} @${w} ${theme}: ${stops.length} stops; zones: ${stops.map(s => s.zone[0]).join('')}`);
    const bad = stops.filter(s => !/solid 3px/.test(s.outline) || s.ratio < 3 || s.underBar || s.underHeader || s.offscreen || s.covered);
    for (const s of stops.filter(s => s.zone === 'main' || s.zone === 'bar')) console.log(`  ${s.zone} y${s.y} x${s.x} ${s.w}x${s.h} ${s.tag} "${s.text}" ring ${s.outline} ${s.oc} off ${s.off} ratio ${s.ratio}${s.underBar ? ' UNDER-BAR' : ''}${s.underHeader ? ' UNDER-HEADER' : ''}${s.offscreen ? ' OFFSCREEN' : ''}${s.covered ? ' COVERED-BY ' + s.covered : ''}${s.clipped ? ' (in clipping box ' + s.clipped + ')' : ''}`);
    console.log('  problems:', bad.length ? JSON.stringify(bad.map(s => ({ t: s.text, z: s.zone, o: s.outline, r: s.ratio, ub: s.underBar, uh: s.underHeader, off: s.offscreen, cov: s.covered })), null, 0) : 'none');
    // shift+tab back from the bottom at 390: focus under the sticky header?
    if (w === 390 && theme === 'light') {
      const back = [];
      for (let i = 0; i < 40; i++) { await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(420); const s = await p.evaluate(info); if (!s) break; back.push(s); if (s.zone === 'head') break; }
      const badBack = back.filter(s => s.underBar || s.underHeader || s.offscreen || s.covered);
      console.log('  shift+tab back up:', back.length, 'stops; problems:', badBack.length ? JSON.stringify(badBack.map(s => ({ t: s.text, y: s.y, ub: s.underBar, uh: s.underHeader, cov: s.covered }))) : 'none');
      if (badBack.length) await p.screenshot({ path: `${OUT}/back-${path.replace(/\W/g, '')}-${w}.png` });
    }
    await ctx.close();
  }

  // No JavaScript
  for (const [path, w, h] of [['/about/', 390, 844], ['/about/', 1440, 900], ['/404.html', 390, 844], ['/404.html', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false });
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/nojs-${path.replace(/\W/g, '')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
  // main.js blocked (so we can evaluate): anything invisible or dead?
  for (const [path, w, h] of [['/about/', 390, 844], ['/about/', 1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route('**/assets/js/main.js', r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(700);
    const early = await p.evaluate(() => [...document.querySelectorAll('main .reveal')].map(e => getComputedStyle(e).opacity));
    await p.waitForTimeout(4200);
    const r = await p.evaluate(() => { const vis = e => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
      const faded = [...document.querySelectorAll('body *')].filter(e => vis(e) && +getComputedStyle(e).opacity < 1).map(e => e.tagName + '.' + (e.className.baseVal !== undefined ? e.className.baseVal : e.className));
      const dead = [...document.querySelectorAll('button, [data-booking]')].filter(vis).map(e => (e.id || e.className) + ' → ' + (e.getAttribute('href') || 'button'));
      return { cls: document.documentElement.className, faded, dead, hdrPos: getComputedStyle(document.querySelector('.site-header')).position, navVisible: vis(document.querySelector('#nav')), barVisible: vis(document.querySelector('#mobile-cta')), barHidden: document.querySelector('#mobile-cta').hidden }; });
    console.log(`\nmain.js blocked ${path} @${w}: reveal opacity during first 4s = ${JSON.stringify(early)}; after 4.9s:`, JSON.stringify(r));
    await p.screenshot({ path: `${OUT}/blocked-${path.replace(/\W/g, '')}-${w}.png`, fullPage: true });
    await ctx.close();
  }
  // 320px screenshot
  { const ctx = await b.newContext({ viewport: { width: 320, height: 640 } }); const p = await ctx.newPage(); await p.goto(BASE + '/about/'); await p.waitForTimeout(1300); await p.screenshot({ path: `${OUT}/about-320.png` });
    console.log('\n320: h1 word width', await p.evaluate(() => { const l = [...document.querySelectorAll('h1 .l')].pop(); const r = document.createRange(); r.selectNodeContents(l); return [Math.round(r.getBoundingClientRect().right), innerWidth, document.documentElement.scrollWidth, getComputedStyle(document.body).overflowX, getComputedStyle(document.documentElement).overflowX]; }));
    await p.evaluate(() => scrollTo(50, 0)); console.log('320: can scroll sideways to', await p.evaluate(() => scrollX)); await ctx.close(); }
  await b.close();
})();
