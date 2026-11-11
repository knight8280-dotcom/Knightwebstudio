// VA-08 .. VA-11 : own measurements + screenshots
const { open, done, close, shotEl } = require('./lib');
const path = require('path');
const OUT = __dirname;
// lines of text of an element, by rendered line
const LINES = `(el) => {
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const lines = []; let cur = null; let n;
  while ((n = tw.nextNode())) {
    const pe = n.parentElement; if (!pe) continue; const cs = getComputedStyle(pe);
    if (cs.display === 'none' || cs.visibility === 'hidden' || pe.closest('.sr-only')) continue;
    const txt = n.textContent;
    // split in words
    const re = /\\S+/g; let m;
    while ((m = re.exec(txt))) {
      const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
      const b = r.getClientRects()[0]; if (!b) continue;
      const top = Math.round(b.top + scrollY);
      if (!cur || Math.abs(cur.top - top) > 6) { cur = { top, words: [] }; lines.push(cur); }
      cur.words.push(m[0]);
    }
  }
  return lines.map(l => l.words.join(' '));
}`;
(async () => {
  // ---- VA-08: two-line buttons on the five pages
  const pages = ['/', '/start/', '/pricing/', '/consulting/', '/services/'];
  const widths = [360, 390, 430, 600, 760, 820, 980, 1100, 1280, 1440, 1920];
  const two = {};
  for (const w of widths) {
    for (const p of pages) {
      const page = await open(p, w);
      const r = await page.evaluate(() => [...document.querySelectorAll('main .btn')].filter(b => b.offsetParent).map(b => {
        const cs = getComputedStyle(b); const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
        const rg = document.createRange(); rg.selectNodeContents(b); const rects = [...rg.getClientRects()].filter(x => x.width > 2);
        const tops = [...new Set(rects.map(x => Math.round(x.top / 4)))];
        return { t: b.textContent.trim().replace(/\s+/g, ' '), w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height), lines: tops.length, padL: cs.paddingLeft, textW: Math.round(Math.max(...rects.map(x => x.right)) - Math.min(...rects.map(x => x.left))) };
      }));
      for (const b of r) if (b.lines > 1) { const k = p + ' | ' + b.t; (two[k] = two[k] || []).push(`${w}(w${b.w} h${b.h})`); }
      if (p === '/consulting/' && [390, 1280].includes(w)) {
        const b = r.find(x => /Check my real numbers/.test(x.t)); console.log('VA-08 consulting btn', w, JSON.stringify(b));
        await shotEl(page, 'a.btn[href="/contact/?package=audit"].btn-block', path.join(OUT, `va08_consulting_${w}_btn.png`), 60);
      }
      if (p === '/' && [390].includes(w)) { await shotEl(page, '.board-foot', path.join(OUT, `va08_home_${w}_btn.png`), 60); }
      await done(page);
    }
  }
  for (const k in two) console.log('VA-08 two-line', k, '@', two[k].join(', '));
  // single-line natural width of the consulting label
  {
    const page = await open('/consulting/', 1280);
    const r = await page.evaluate(() => { const b = [...document.querySelectorAll('main .btn')].find(x => /Check my real numbers/.test(x.textContent)); const cs = getComputedStyle(b); const s = document.createElement('span'); s.style.cssText = `font:${cs.font};letter-spacing:${cs.letterSpacing};white-space:nowrap;position:absolute;visibility:hidden`; s.textContent = b.textContent; document.body.appendChild(s); const w = s.getBoundingClientRect().width; return { natural: w, btnW: b.getBoundingClientRect().width, padL: cs.paddingLeft, padR: cs.paddingRight, borderL: cs.borderLeftWidth, wrap: cs.textWrap, parentW: b.parentElement.getBoundingClientRect().width, parent: b.parentElement.className }; });
    console.log('VA-08 consulting natural', JSON.stringify(r));
    await done(page);
  }

  // ---- VA-09 board at 1100-1280
  for (const p of ['/', '/start/']) {
    for (const w of [1080, 1100, 1120, 1140, 1160, 1179, 1180, 1200, 1279, 1280]) {
      const page = await open(p, w);
      const r = await page.evaluate(() => [...document.querySelectorAll('.board-tiers .tier')].map(t => { const q = s => t.querySelector(s).getBoundingClientRect(); return { name: t.querySelector('.tier-name').textContent, planH: Math.round(q('.tier-plan').height), noteTop: Math.round(q('.tier-note').top + scrollY), amtTop: Math.round(q('.tier-amt').top + scrollY) }; }));
      console.log('VA-09', p, w, JSON.stringify(r));
      if (p === '/' && [1100, 1160, 1180].includes(w)) await shotEl(page, '.board-tiers', path.join(OUT, `va09_home_${w}_board.png`), 20);
      await done(page);
    }
  }

  // ---- VA-10 wraps
  const LINESFN = eval(LINES);
  const targets = [
    ['/consulting/', '.receipt li:first-child span:first-child', [360, 390, 430, 600], 'receipt 5 pages'],
    ['/start/', '.board-tiers li:nth-child(4) .tier-note', [1100, 1280, 1440, 1920, 390], 'commerce note'],
    ['/', '.board-tiers li:nth-child(4) .tier-note', [1100, 1280, 1440, 1920, 390], 'home commerce note'],
  ];
  for (const [p, sel, ws, label] of targets) {
    for (const w of ws) {
      const page = await open(p, w);
      const r = await page.evaluate(`(${LINES})(document.querySelector(${JSON.stringify(sel)}))`).catch(e => 'ERR ' + e.message);
      console.log('VA-10', label, p, w, JSON.stringify(r));
      await done(page);
    }
  }
  // generic: find elements whose text contains a phrase and print lines
  const phrases = [
    ['/pricing/', "days' written notice", [360, 390, 600, 760, 980, 1100, 1280, 1440, 1920]],
    ['/pricing/', 'nothing lost', [360, 390, 600, 760, 820, 980, 1100, 1280, 1440, 1920]],
    ['/pricing/', 'hands-on work', [390, 760, 980, 1100, 1280, 1440, 1920]],
    ['/consulting/', 'up to 5 pages', [360, 390, 430, 600, 1280]],
  ];
  for (const [p, phrase, ws] of phrases) {
    for (const w of ws) {
      const page = await open(p, w);
      const r = await page.evaluate(`(() => { const LN = ${LINES}; const els = [...document.querySelectorAll('main *')].filter(e => e.offsetParent && e.textContent.includes(${JSON.stringify(phrase)}) && ![...e.children].some(c => c.textContent.includes(${JSON.stringify(phrase)}))); return els.map(e => ({ tag: e.tagName + '.' + e.className, w: Math.round(e.getBoundingClientRect().width), lines: LN(e) })); })()`);
      console.log('VA-10', p, w, phrase, JSON.stringify(r));
      if ((phrase === "days' written notice" && [390, 1440].includes(w)) || (phrase === 'nothing lost' && [1440].includes(w)) || (phrase === 'hands-on work' && w === 1440) || (phrase === 'up to 5 pages' && w === 390)) {
        const h = await page.evaluateHandle(`(() => { const els = [...document.querySelectorAll('main *')].filter(e => e.offsetParent && e.textContent.includes(${JSON.stringify(phrase)}) && ![...e.children].some(c => c.textContent.includes(${JSON.stringify(phrase)}))); let e = els[0]; return e.closest('.card, .receipt, li, tr') || e.parentElement; })()`);
        const el = h.asElement(); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
        await page.evaluate(e => scrollTo(0, e.getBoundingClientRect().top + scrollY - 250), el); await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(OUT, `va10_${p.replace(/\//g, '')}_${w}_${phrase.replace(/[^a-z0-9]+/gi, '_')}.png`) });
      }
      await done(page);
    }
  }

  // ---- VA-11 eyebrows on section heads, five pages, plus the whole site for the convention
  const all = ['/', '/start/', '/pricing/', '/consulting/', '/services/', '/work/', '/process/', '/faq/', '/contact/', '/about/', '/web-design-baton-rouge/'];
  for (const p of all) {
    const page = await open(p, 1440);
    const r = await page.evaluate(() => [...document.querySelectorAll('main h2')].filter(h => !h.classList.contains('eyebrow') && !h.closest('.cta-band')).map(h => {
      const head = h.closest('.section-head, header, .board-head') || h.parentElement; const ey = head.querySelector('.eyebrow, .label');
      return (ey && ey !== h ? 'E ' : '- ') + h.textContent.trim().replace(/\s+/g, ' ').slice(0, 44) + (ey && ey !== h ? ' [' + ey.textContent.trim() + ']' : '') + ' <' + head.className.split(' ')[0] + '>';
    }));
    console.log('VA-11', p, '\n   ' + r.join('\n   '));
    await done(page);
  }
  await close();
})();
