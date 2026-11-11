const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720';
const OUT = __dirname + '/final/';
(async () => {
  const b = await chromium.launch();
  const mk = async (w, h, theme, path, opts = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: w < 700, hasTouch: w < 700, deviceScaleFactor: opts.dsf || 1, javaScriptEnabled: !opts.nojs, reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
    if (!opts.nojs) await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push(String(e)));
    await p.goto(base + path, { waitUntil: 'load' });
    if (!opts.nojs) await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    return [ctx, p, errs];
  };
  // 1. no JS
  for (const path of ['/contact/', '/faq/']) for (const [w, h] of [[390, 844], [1440, 900]]) {
    const [ctx, p] = await mk(w, h, 'light', path, { nojs: true });
    const name = path.replace(/\//g, '');
    await p.screenshot({ path: OUT + `nojs-${name}-${w}.png`, fullPage: true });
    await ctx.close();
  }
  // nojs hidden check through a JS-enabled context with scripts blocked
  for (const path of ['/contact/', '/faq/']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(/\.js(\?|$)|plausible|hcaptcha/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' });
    await p.evaluate(() => document.documentElement.classList.remove('js'));
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const bad = []; document.querySelectorAll('main *').forEach(e => { const cs = getComputedStyle(e); if (e.closest('.hp,.sr-only,[hidden]')) return; if (cs.opacity === '0' || cs.visibility === 'hidden') bad.push(e.tagName + '.' + e.className); }); return { htmlClass: document.documentElement.className, bad, stamp: (() => { const s = document.querySelector('.stamp'); return s ? getComputedStyle(s).opacity + ' ' + getComputedStyle(s).animationName : null; })(), captchaMin: (() => { const c = document.querySelector('.h-captcha'); return c ? getComputedStyle(c).minHeight : null; })(), booking: (() => { const c = document.querySelector('.booking-only'); return c ? c.hidden : null; })() }; });
    console.log('scripts blocked', path, JSON.stringify(r));
    await ctx.close();
  }
  // 2. keyboard order + ring
  for (const [path, w] of [['/contact/', 1440], ['/contact/', 390], ['/faq/', 1440], ['/faq/', 390]]) {
    const [ctx, p] = await mk(w, 900, 'light', path);
    const stops = [];
    for (let i = 0; i < 60; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const cs = getComputedStyle(e); let ring = cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) : 0; let via = 'self'; if (!ring && e.matches('.chip input')) { const sp = e.nextElementSibling; const c2 = getComputedStyle(sp); ring = c2.outlineStyle !== 'none' ? parseFloat(c2.outlineWidth) : 0; via = 'span'; } const r = e.getBoundingClientRect(); return { tag: e.tagName.toLowerCase(), id: e.id, cls: (e.className || '').toString().slice(0, 30), text: (e.innerText || e.value || e.getAttribute('aria-label') || '').trim().slice(0, 28), ring, inMain: !!e.closest('main'), inFooter: !!e.closest('footer'), top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight }; });
      if (!s) break; stops.push(s); if (s.inFooter) break;
    }
    const main = stops.filter(s => s.inMain);
    console.log('TAB', path, w, 'stops in main:', main.length, 'weak rings:', JSON.stringify(stops.filter(s => s.ring < 2).map(s => s.tag + '#' + s.id + ' ' + s.text)), 'offscreen:', JSON.stringify(main.filter(s => s.bottom < 0 || s.top > s.vh).map(s => s.text)));
    console.log('   order:', main.map(s => s.id || s.text).join(' > '));
    await ctx.close();
  }
  // 3. text-only zoom 200% at 390 and narrow widths: is the page head inside the viewport?
  for (const [w, fs] of [[390, '200%'], [390, '100%'], [320, '100%'], [280, '100%']]) {
    const [ctx, p] = await mk(w, 844, 'light', '/contact/');
    await p.addStyleTag({ content: `html{font-size:${fs}}` }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const q = s => document.querySelector(s).getBoundingClientRect(); return { head: Math.round(q('.page-head .container').width), tel: Math.round(q('.talk-tel').right), telFs: getComputedStyle(document.querySelector('.talk-tel')).fontSize, h1right: Math.round(q('h1').right), vw: document.documentElement.clientWidth, form: Math.round(q('.ticket').right) }; });
    console.log('zoom', w, fs, JSON.stringify(r));
    await ctx.close();
  }
  // 4. reduced motion: stamp shown, no animation
  { const [ctx, p] = await mk(390, 844, 'light', '/contact/', { rm: true });
    const r = await p.evaluate(() => { const s = document.querySelector('.stamp'); const cs = getComputedStyle(s); return { opacity: cs.opacity, anim: cs.animationName, transform: cs.transform }; });
    console.log('reduced motion stamp', JSON.stringify(r)); await ctx.close(); }
  // 5. stamp lands: before and after scrolling
  { const [ctx, p, errs] = await mk(390, 844, 'light', '/contact/');
    const before = await p.evaluate(() => getComputedStyle(document.querySelector('.stamp')).opacity);
    await p.evaluate(() => document.querySelector('.stamp').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1500);
    const after = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('.stamp')); return cs.opacity + ' ' + cs.transform + ' rotate ' + cs.rotate; });
    console.log('stamp before', before, 'after', after, 'errors', errs.length); await ctx.close(); }
  // 6. package preselect for all values + draft
  { const [ctx, p] = await mk(390, 844, 'light', '/contact/');
    const vals = await p.evaluate(() => [...document.getElementById('package').options].map(o => o.value).filter(Boolean));
    let ok = 0; for (const v of vals) { await p.goto(base + '/contact/?package=' + v, { waitUntil: 'load' }); if (await p.evaluate(() => document.getElementById('package').value) === v) ok++; }
    console.log('preselect', ok, 'of', vals.length); await ctx.close(); }
  await b.close();
})();
