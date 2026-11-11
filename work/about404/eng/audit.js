// Independent audit of /about/ and /404.html: structure, a11y, contrast, targets, text sizes.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const PAGES = ['/about/', '/404.html'];

function inPage() {
  const out = {};
  const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const sel = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).filter(Boolean).join('.'); return s; };
  const path = el => { const a = []; let e = el; for (let i = 0; i < 3 && e && e !== document.body; i++) { a.unshift(sel(e)); e = e.parentElement; } return a.join(' > '); };

  // headings
  out.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].filter(vis).map(h => h.tagName + ' ' + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 60));
  // landmarks
  out.landmarks = [...document.querySelectorAll('header,main,nav,footer,aside,section[aria-label],section[aria-labelledby],[role]')].map(e => e.tagName.toLowerCase() + (e.getAttribute('role') ? '[role=' + e.getAttribute('role') + ']' : '') + (e.getAttribute('aria-label') ? ' "' + e.getAttribute('aria-label') + '"' : '') + (e.getAttribute('aria-labelledby') ? ' labelledby=' + e.getAttribute('aria-labelledby') + '→"' + ((document.getElementById(e.getAttribute('aria-labelledby')) || {}).textContent || 'MISSING') + '"' : ''));
  // imgs / svgs
  out.imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.getAttribute('loading') }));
  out.svgs = [...document.querySelectorAll('main svg')].map(s => ({ cls: s.getAttribute('class'), hidden: s.getAttribute('aria-hidden'), role: s.getAttribute('role'), label: s.getAttribute('aria-label'), title: !!s.querySelector('title'), text: [...s.querySelectorAll('text')].map(t => t.textContent).join('|').slice(0, 80), w: s.getAttribute('width'), h: s.getAttribute('height'), vb: s.getAttribute('viewBox'), focusable: s.getAttribute('focusable') }));
  // lists
  out.lists = [...document.querySelectorAll('main ul, main ol, main dl')].map(l => ({ sel: sel(l), ls: getComputedStyle(l).listStyleType, disp: getComputedStyle(l).display, role: l.getAttribute('role'), n: l.children.length, badKids: [...l.children].filter(c => !/^(LI|DIV|DT|DD)$/.test(c.tagName)).length }));

  // targets
  const targets = [];
  for (const el of document.querySelectorAll('a, button, summary, input, select, textarea, [tabindex]')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // inline text link inside a paragraph: WCAG 2.5.8 exception
    const inline = cs.display === 'inline' && el.closest('p, li') && el.parentElement.textContent.trim().length > el.textContent.trim().length + 4;
    if ((r.width < 44 || r.height < 44)) targets.push({ el: path(el), text: el.textContent.trim().replace(/\s+/g, ' ').slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), inline });
  }
  out.smallTargets = targets;

  // text nodes: size + contrast
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = el => { const layers = []; let e = el; while (e) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; } if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/skyline/.test(e.className)) layers.push({ img: cs.backgroundImage, el: sel(e) }); e = e.parentElement; } let base = { r: 255, g: 255, b: 255, a: 1 }; let img = null; for (let i = layers.length - 1; i >= 0; i--) { if (layers[i].img) { img = layers[i]; continue; } base = over(layers[i], base); } return { c: base, img }; };
  const small = [], contrast = [], all = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; const t = n.textContent.trim(); if (!t) continue;
    const el = n.parentElement; if (!el || seen.has(el)) continue;
    if (el.closest('script,style,noscript,.sr-only')) continue;
    if (el.ownerSVGElement) continue;
    if (!vis(el)) continue;
    const range = document.createRange(); range.selectNodeContents(n); const rr = range.getBoundingClientRect(); if (!rr.width || !rr.height) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    // effective opacity
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    const fs = parseFloat(cs.fontSize), fw = +cs.fontWeight;
    const fg0 = parse(cs.color); const bg = bgOf(el); const fg = over({ ...fg0, a: fg0.a * op }, bg.c);
    const L1 = lum(fg), L2 = lum(bg.c); const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
    const large = fs >= 24 || (fs >= 18.66 && fw >= 700);
    const rec = { el: path(el), text: t.replace(/\s+/g, ' ').slice(0, 40), fs, fw, ratio: +ratio.toFixed(2), fg: cs.color, bg: `rgb(${Math.round(bg.c.r)},${Math.round(bg.c.g)},${Math.round(bg.c.b)})`, img: bg.img ? bg.img.el : null, upper: cs.textTransform === 'uppercase', lh: cs.lineHeight, ls: cs.letterSpacing };
    all.push(rec);
    if (fs < 15) small.push(rec);
    if (ratio < (large ? 3 : 4.5)) contrast.push(rec);
  }
  out.small = small; out.contrastFails = contrast;
  out.minRatio = all.slice().sort((a, b) => a.ratio - b.ratio).slice(0, 6);
  out.fontSizes = [...new Set(all.map(a => a.fs))].sort((a, b) => a - b);
  out.docH = document.documentElement.scrollHeight;
  return out;
}

(async () => {
  const b = await chromium.launch();
  for (const path of PAGES) for (const [w, h] of [[390, 844], [1440, 900]]) for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: w < 500, hasTouch: w < 500, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror ' + e)); p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|Failed to load resource/.test(m.text())) errs.push(m.text()); });
    p.on('requestfailed', r => { if (!/plausible|calendly|hcaptcha|onrender/.test(r.url())) errs.push('requestfailed ' + r.url()); });
    p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
    await p.goto(BASE + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    // scroll through so reveals become visible
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(40); }
    await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
    const r = await p.evaluate(inPage);
    console.log(`\n================ ${path} ${w} ${theme}  theme-attr=${await p.getAttribute('html', 'data-theme')} docH=${r.docH}`);
    if (errs.length) console.log('ERRORS', errs);
    if (theme === 'light') {
      console.log('headings:', JSON.stringify(r.headings, null, 0));
      if (w === 1440) { console.log('landmarks:', r.landmarks.join('\n   ')); console.log('imgs:', JSON.stringify(r.imgs)); console.log('svgs:', JSON.stringify(r.svgs)); console.log('lists:', JSON.stringify(r.lists)); }
      console.log('small targets (<44):', JSON.stringify(r.smallTargets, null, 1));
      console.log('text <15px:', r.small.map(s => `${s.fs}px ${s.upper ? 'CAPS' : 'lower'} ${s.el} | ${s.text}`).join('\n   '));
      console.log('font sizes:', r.fontSizes.join(', '));
    }
    console.log('contrast fails:', r.contrastFails.length ? JSON.stringify(r.contrastFails, null, 1) : 'none');
    console.log('lowest ratios:', r.minRatio.map(m => `${m.ratio} (${m.fs}px/${m.fw}) ${m.fg} on ${m.bg} ${m.img ? '[img ' + m.img + ']' : ''} ${m.el} | ${m.text}`).join('\n   '));
    await ctx.close();
  }
  await b.close();
})();
