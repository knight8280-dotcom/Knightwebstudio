// Keyboard order and focus rings, accessible names, table roles, and the page with JavaScript off.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  // --- keyboard, at 1440 and 390
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    await p.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    const total = await p.evaluate(() => [...document.querySelectorAll('main a, main button, main summary, main input')].filter(e => e.offsetParent !== null).length);
    await p.evaluate(() => { const m = document.querySelector('main'); m.tabIndex = -1; m.focus(); });
    const stops = []; let noRing = 0, hidden = 0;
    for (let i = 0; i < total + 3; i++) {
      await p.keyboard.press('Tab');
      const s = await p.evaluate(() => { const e = document.activeElement; if (!e || !e.closest('main')) return null; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const bar = document.querySelector('.mobile-cta.show'); const hb = document.querySelector('.site-header').getBoundingClientRect().bottom; const barTop = bar ? bar.getBoundingClientRect().top : innerHeight; return { t: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 44), ring: parseFloat(cs.outlineWidth) >= 2 && cs.outlineStyle !== 'none', y: Math.round(r.top + scrollY), covered: r.top < hb - 1 || r.bottom > barTop + 1 }; });
      if (!s) break; stops.push(s); if (!s.ring) noRing++; if (s.covered) hidden++;
    }
    const order = stops.every((s, i) => i === 0 || s.y >= stops[i - 1].y - 80);
    console.log(`keyboard ${w}: ${stops.length} stops of ${total} links in main; without a ring: ${noRing}; under the header or phone bar when focused: ${hidden}; top-to-bottom order: ${order}`);
    if (w === 1440) console.log('   order: ' + stops.map(s => s.t).join(' > '));
    await p.close();
  }
  // --- accessible names and roles
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  const names = await p.evaluate(() => {
    const nm = e => (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ');
    const links = [...document.querySelectorAll('main a')].map(e => ({ name: nm(e), vis: [...e.childNodes].filter(n => n.nodeType === 3 || !n.classList || !n.classList.contains('sr-only')).map(n => n.textContent).join('').trim().replace(/\s+/g, ' '), href: e.getAttribute('href') }));
    const dup = {}; links.forEach(l => { (dup[l.name] = dup[l.name] || new Set()).add(l.href); });
    return { labelInName: links.filter(l => !l.name.toLowerCase().startsWith(l.vis.toLowerCase())).map(l => l.vis + ' => ' + l.name), sameNameDifferentPlace: Object.entries(dup).filter(([k, v]) => v.size > 1).map(([k, v]) => k + ' -> ' + [...v].join(', ')), care: links.filter(l => /plan:/.test(l.name)).map(l => l.name), enquiry: links.filter(l => /enquiry first/.test(l.name)).map(l => l.name),
      h: [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map(e => e.tagName[1]).join(''), h1: document.querySelectorAll('h1').length,
      roles: ['.spec', '.table'].map(s => { const t = document.querySelector(s); return s + ': table=' + t.getAttribute('role') + ' rows=' + t.querySelectorAll('[role=row]').length + ' cells=' + t.querySelectorAll('[role=cell]').length + ' colheaders=' + t.querySelectorAll('[role=columnheader]').length + ' rowheaders=' + t.querySelectorAll('[role=rowheader]').length + ' missingRole=' + [...t.querySelectorAll('tr,th,td,thead,tbody')].filter(e => !e.getAttribute('role')).length; }) };
  });
  console.log('label in name failures:', names.labelInName.length ? names.labelInName : 'none');
  console.log('same name, different destination:', names.sameNameDifferentPlace.length ? names.sameNameDifferentPlace : 'none');
  console.log('care buttons:', names.care.join(' | '));
  console.log('enquiry links:', names.enquiry.join(' | '));
  console.log('headings:', names.h, '| h1 count', names.h1);
  console.log(names.roles.join('\n'));
  const ax = await p.accessibility.snapshot({ interestingOnly: true }).catch(() => null);
  if (ax) { const flat = []; (function walk(n) { if (n.role === 'link' && /plan|enquiry first/i.test(n.name)) flat.push(n.name); (n.children || []).forEach(walk); })(ax); console.log('accessibility tree link names:', flat.join(' | ')); }
  await p.close();
  // --- JavaScript off
  for (const w of [390, 1440]) {
    const ctx = await b.newContext({ javaScriptEnabled: false, viewport: { width: w, height: 900 } });
    const q = await ctx.newPage();
    await q.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    const r = await q.evaluate(() => { const inv = [...document.querySelectorAll('main *')].filter(e => { const cs = getComputedStyle(e); return e.getClientRects().length && (parseFloat(cs.opacity) < 1 || cs.visibility === 'hidden') && !e.closest('.sr-only'); }); return { invisible: inv.length, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, height: document.documentElement.scrollHeight }; }).catch(e => String(e));
    console.log('no JavaScript', w, JSON.stringify(r));
    await q.screenshot({ path: `s/nojs-${w}.png`, fullPage: false });
    await ctx.close();
  }
  await b.close();
})();
