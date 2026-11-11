const { chromium } = require('/opt/node-tools/node_modules/playwright');
const base = 'http://localhost:8720';
const inpage = () => {
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return [0, 0, 0, 0]; const p = m[1].split(/[, /]+/).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const over = (fg, bg) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
  const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (c[3] > 0) stack.push(c); if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage) && e !== el && !/select/i.test(e.tagName)) stack.push('img:' + e.className); if (c[3] === 1) break; } let bg = [255, 255, 255, 1]; let img = null; for (let i = stack.length - 1; i >= 0; i--) { if (typeof stack[i] === 'string') { img = stack[i]; continue; } bg = over(stack[i], bg); } return { bg, img }; };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
  const name = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
  const res = { fails: [], small: [], min: 99, count: 0 };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  const seen = new Set();
  while ((n = walker.nextNode())) {
    if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || seen.has(el)) continue; 
    if (el.closest('script,style,noscript,.sr-only,.hp,.skip-link,option')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    let hiddenAnc = false; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') hiddenAnc = true; if (e.tagName === 'DETAILS' && !e.open && !el.closest('summary')) hiddenAnc = true; } if (hiddenAnc) continue;
    seen.add(el);
    let fg = parse(cs.color); const { bg } = bgOf(el); 
    // opacity of ancestors
    let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
    fg = over([fg[0], fg[1], fg[2], fg[3] * op], bg);
    const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700; const large = size >= 24 || (size >= 18.66 && bold);
    const rr = ratio(fg, bg); res.count++; res.min = Math.min(res.min, rr);
    if (rr < (large ? 3 : 4.5)) res.fails.push(`${rr.toFixed(2)} ${name(el)} "${n.textContent.trim().slice(0, 30)}" ${size}px fg ${fg.map(Math.round).slice(0, 3)} bg ${bg.map(Math.round).slice(0, 3)}`);
    const caps = cs.textTransform === 'uppercase';
    if (size < 15) res.small.push(`${size}px${caps ? ' CAPS' : ''} ${name(el)} "${n.textContent.trim().slice(0, 30)}"`);
  }
  // placeholders
  for (const f of document.querySelectorAll('input[placeholder],textarea[placeholder]')) { const pc = parse(getComputedStyle(f, '::placeholder').color); const { bg } = bgOf(f); const rr = ratio(over(pc, bg), bg); if (rr < 4.5) res.fails.push(`${rr.toFixed(2)} placeholder ${name(f)}`); res.placeholder = rr.toFixed(2); }
  // control borders 3:1
  res.borders = [];
  for (const f of document.querySelectorAll('main input:not([type=hidden]):not([type=checkbox]), main select, main textarea, main .chip span, main .btn')) { const cs = getComputedStyle(f); if (cs.display === 'none' || !f.getBoundingClientRect().width) continue; const bc = parse(cs.borderTopColor); const outer = bgOf(f.parentElement).bg; const inner = bgOf(f).bg; const rr = ratio(over(bc, outer), outer); const fill = ratio(inner, outer); if (rr < 3 && fill < 3) res.borders.push(`${rr.toFixed(2)} border of ${name(f)} (${cs.borderTopWidth}) vs ${outer.map(Math.round).slice(0, 3)}; fill ${fill.toFixed(2)}`); }
  return res;
};
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const scheme of ['light', 'dark']) for (const w of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: scheme, reducedMotion: 'reduce', isMobile: w < 500, hasTouch: w < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    await ctx.route('https://api.web3forms.com/submit', r => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"success":true}' }));
    const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const tag = `${path} ${scheme} ${w}`;
    if (path === '/faq/') await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    let r = await p.evaluate(inpage);
    console.log(tag, 'default: texts', r.count, 'min', r.min.toFixed(2), 'placeholder', r.placeholder, 'fails', r.fails.length); r.fails.forEach(f => console.log('   FAIL', f)); r.borders.forEach(f => console.log('   BORDER', f));
    if (w === 390 && scheme === 'light') { console.log('   under 15px:'); [...new Set(r.small)].forEach(s => console.log('     ', s)); }
    if (path === '/contact/') {
      // error state
      await p.click('#submit-btn'); await p.waitForTimeout(200);
      await p.check('input[name="services"][value="SEO"]', { force: true });
      r = await p.evaluate(inpage); console.log(tag, 'error state + checked chip: min', r.min.toFixed(2), 'fails', r.fails.length); r.fails.forEach(f => console.log('   FAIL', f)); r.borders.forEach(f => console.log('   BORDER', f));
      // invalid field border vs card
      const inv = await p.evaluate(() => { const f = document.getElementById('name'); const cs = getComputedStyle(f); return [cs.borderTopColor, cs.boxShadow, cs.outlineColor, cs.outlineWidth, cs.outlineStyle]; }); console.log('   invalid focused field:', JSON.stringify(inv));
      await p.fill('#name', 'Sam'); await p.fill('#email', 's@example.com'); await p.fill('#message', 'A long enough message here.'); await p.click('#submit-btn'); await p.waitForTimeout(500);
      r = await p.evaluate(inpage); console.log(tag, 'success state: min', r.min.toFixed(2), 'fails', r.fails.length, await p.evaluate(() => document.getElementById('form-status').className)); r.fails.forEach(f => console.log('   FAIL', f));
    }
    await ctx.close();
  }
  await b.close();
})();
