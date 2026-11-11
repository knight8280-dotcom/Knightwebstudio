// Layout robustness: overflow sweep (with motion on), clipping/overlap, measure, zoom, CLS, animations.
const { chromium } = require('playwright');
const BASE = 'http://localhost:8720';
const OUT = __dirname + '/lshots';
require('fs').mkdirSync(OUT, { recursive: true });
const PAGES = ['/about/', '/404.html'];

function probe() {
  const sel = el => { let s = el.tagName.toLowerCase(); if (el.id) s += '#' + el.id; if (el.className && el.className.toString) s += '.' + el.className.toString().trim().split(/\s+/).filter(Boolean).join('.'); return s; };
  const path = el => { const a = []; let e = el; for (let i = 0; i < 3 && e && e !== document.body; i++) { a.unshift(sel(e)); e = e.parentElement; } return a.join(' > '); };
  const res = { over: document.documentElement.scrollWidth - innerWidth, out: [], clipped: [], overlaps: [] };
  const vw = innerWidth;
  const els = [...document.querySelectorAll('body *')].filter(el => { if (el.ownerSVGElement || el.closest('.sr-only,.skip-link,script,style')) return false; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') return false; if (cs.position === 'fixed') return false; if (el.closest('.mobile-cta, #nav')) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 || r.left < -1) res.out.push(path(el) + ` [${Math.round(r.left)}..${Math.round(r.right)}]`);
    const cs = getComputedStyle(el);
    if (el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible' && el.clientWidth > 0) res.clipped.push(path(el) + ` scrollW ${el.scrollWidth} > ${el.clientWidth}`);
    // text escaping its own box horizontally (unbreakable words)
    if (el.children.length === 0 && el.textContent.trim()) {
      const range = document.createRange(); range.selectNodeContents(el);
      for (const rr of range.getClientRects()) { if (rr.right > vw + 1) { res.out.push('TEXT ' + path(el) + ` right ${Math.round(rr.right)}`); break; } }
      // text sticking out of its nearest block container
      const blk = el.closest('li, p, div, a, h1, h2, h3, section'); if (blk) { const br = blk.getBoundingClientRect(); const tr = range.getBoundingClientRect(); if (tr.right > br.right + 2 || tr.left < br.left - 2) { const ps = getComputedStyle(blk); if (!(ps.rotate && ps.rotate !== 'none') && !blk.closest('.tilt')) res.clipped.push('TEXT OUT OF BOX ' + path(el) + ` text ${Math.round(tr.left)}..${Math.round(tr.right)} box ${Math.round(br.left)}..${Math.round(br.right)}`); } }
    }
  }
  // overlap between text leaf blocks in main (siblings/unrelated)
  const leaves = [...document.querySelectorAll('main h1, main h2, main h3, main p, main li > a, main .btn, main .bizcard, main .appt, main .scene, main .towns li, main .label')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width && r.height && cs.visibility !== 'hidden'; });
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i], b = leaves[j]; if (a.contains(b) || b.contains(a)) continue; if (a.closest('.tilt') && b.closest('.tilt')) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 2 && oy > 2) res.overlaps.push(`${path(a)} × ${path(b)} (${Math.round(ox)}×${Math.round(oy)})`);
  }
  return res;
}

function measure() {
  // characters per line for running text
  const out = [];
  const sels = ['.lede', '.opening', '.prose p', '.notes > div > p:not(:has(.more-link))', '.terms p', '.cta-copy p', '.project-kind', '.nf > p'];
  for (const s of sels) {
    let el; try { el = document.querySelector('main ' + s); } catch (e) { el = null; } if (!el) continue;
    const range = document.createRange(); range.selectNodeContents(el);
    const rects = [...range.getClientRects()]; const tops = [...new Set(rects.map(r => Math.round(r.top)))];
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    // exact: walk words
    const lines = []; let cur = '', lastTop = null; const tn = [];
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); while (w.nextNode()) tn.push(w.currentNode);
    for (const n of tn) { for (let i = 0; i < n.length; i++) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const rc = r.getClientRects()[0]; if (!rc) continue; const t = Math.round(rc.top); if (lastTop !== null && Math.abs(t - lastTop) > 6) { lines.push(cur); cur = ''; } cur += n.textContent[i]; lastTop = t; } }
    if (cur) lines.push(cur);
    const lens = lines.map(l => l.trim().length); const full = lens.slice(0, -1);
    out.push({ s, lines: lines.length, max: Math.max(...lens), avgFull: full.length ? Math.round(full.reduce((a, b) => a + b, 0) / full.length) : lens[0], fs: getComputedStyle(el).fontSize, w: Math.round(el.getBoundingClientRect().width) });
  }
  return out;
}

(async () => {
  const b = await chromium.launch();

  // 1. Sweep 360..1920 step 20, motion ON, both pages; plus 320 (reflow)
  for (const path of PAGES) {
    const ctx = await b.newContext({ viewport: { width: 360, height: 900 } });
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
    let bad = 0;
    for (const w of [320, ...Array.from({ length: 79 }, (_, i) => 360 + i * 20)]) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(70);
      // make reveals visible
      await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));
      const r = await p.evaluate(probe);
      if (r.over > 0 || r.out.length || r.clipped.length || r.overlaps.length) { bad++; console.log(`${path} @${w}: over=${r.over}`, r.out.slice(0, 4), r.clipped.slice(0, 4), r.overlaps.slice(0, 4)); }
    }
    console.log(`${path}: sweep done, ${bad} widths with findings`);
    // measure at key widths
    for (const w of [360, 390, 430, 768, 820, 980, 1024, 1100, 1280, 1440, 1920]) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(80);
      const m = await p.evaluate(measure);
      console.log(`  measure ${path} @${w}: ` + m.map(x => `${x.s} ${x.fs} w${x.w}: avg ${x.avgFull} max ${x.max} (${x.lines} lines)`).join(' | '));
    }
    await ctx.close();
  }

  // 2. Text zoom 200%: (a) browser zoom equivalent = half the viewport width with DPR 2; (b) text-only: root font-size 200%
  for (const path of PAGES) {
    for (const [name, w, h, rootPct] of [['zoom200-of-1280', 640, 450, 100], ['zoom400-of-1280', 320, 256, 100], ['text200-at-390', 390, 844, 200], ['text200-at-1440', 1440, 900, 200]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
      await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' });
      if (rootPct !== 100) await p.addStyleTag({ content: `html{font-size:${rootPct}%}` });
      await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(900);
      await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')));
      const r = await p.evaluate(probe);
      console.log(`${name} ${path}: over=${r.over} out=${JSON.stringify(r.out.slice(0, 5))} clipped=${JSON.stringify(r.clipped.slice(0, 5))} overlaps=${JSON.stringify(r.overlaps.slice(0, 5))}`);
      await p.screenshot({ path: `${OUT}/${name}-${path.replace(/\W/g, '')}.png`, fullPage: true });
      await ctx.close();
    }
  }

  // 3. Long words: inject unbreakable strings into main text nodes
  {
    const ctx = await b.newContext({ viewport: { width: 360, height: 800 } });
    const p = await ctx.newPage(); await p.goto(BASE + '/about/', { waitUntil: 'load' }); await p.waitForTimeout(500);
    await p.evaluate(() => { const L = 'Donaudampfschifffahrtsgesellschaftskapitaenswitwe'; document.querySelector('.opening').append(' ' + L); document.querySelector('.project-name').textContent = L; document.querySelector('.towns li').firstChild.textContent = L; document.querySelector('.terms .pl-name').textContent = L; document.querySelectorAll('.reveal').forEach(e => e.classList.add('visible')); });
    const r = await p.evaluate(probe);
    console.log(`long-words /about/ @360: over=${r.over} out=${JSON.stringify(r.out.slice(0, 8))} clipped=${JSON.stringify(r.clipped.slice(0, 6))}`);
    await ctx.close();
  }

  // 4. Layout shift as fonts load: throttle the fonts, record CLS
  for (const path of PAGES) for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    await ctx.route('**/*.woff2', async r => { await new Promise(s => setTimeout(s, 1200)); r.continue(); });
    const p = await ctx.newPage();
    await p.addInitScript(() => { window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => (s.node && s.node.nodeType === 1 ? s.node.tagName.toLowerCase() + '.' + (s.node.className && s.node.className.toString ? s.node.className.toString() : '') : '?') + ' ' + JSON.stringify([Math.round(s.previousRect.y), Math.round(s.previousRect.height), '→', Math.round(s.currentRect.y), Math.round(s.currentRect.height)])) }); } } }).observe({ type: 'layout-shift', buffered: true }); });
    await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(6000);
    const r = await p.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts }));
    console.log(`CLS ${path} @${w}: ${r.cls}`, JSON.stringify(r.shifts));
    await ctx.close();
  }

  // 5. Animations: list running/finished animations, iteration counts, properties; reduced-motion
  for (const path of PAGES) for (const rm of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm });
    await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'commit' });
    await p.waitForTimeout(150);
    const an = await p.evaluate(() => document.getAnimations().map(a => { const t = a.effect.getComputedTiming(); const kf = a.effect.getKeyframes(); return { name: a.animationName || (a.transitionProperty ? 'transition:' + a.transitionProperty : '?'), target: (a.effect.target && (a.effect.target.className && a.effect.target.className.baseVal !== undefined ? a.effect.target.className.baseVal : a.effect.target.className)) + (a.effect.pseudoElement || ''), dur: t.duration, delay: t.delay, iter: t.iterations, fill: t.fill, props: [...new Set(kf.flatMap(k => Object.keys(k)).filter(k => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)))] }; }));
    const uniq = {}; an.forEach(a => { const k = a.name + '|' + a.dur + '|' + a.delay + '|' + a.iter + '|' + a.props.join(','); uniq[k] = (uniq[k] || 0) + 1; });
    console.log(`animations ${path} motion=${rm}:`, JSON.stringify(uniq), an.filter(a => /about-/.test(a.name)).map(a => a.name + ' on ' + a.target));
    await p.waitForTimeout(2500);
    const still = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName || 'transition'));
    console.log(`   still running after 2.6s:`, still);
    if (path === '/about/') { const st = await p.evaluate(() => { const c = document.querySelector('.bizcard'); const cs = getComputedStyle(c); const m = getComputedStyle(document.querySelector('.mark'), '::after'); return { cardOpacity: cs.opacity, cardTransform: cs.transform, cardRotate: cs.rotate, markTransform: m.transform }; }); console.log('   resting state:', JSON.stringify(st)); }
    await ctx.close();
  }
  await b.close();
})();
