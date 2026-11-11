// independent sweep: errors, overflow, small inputs, menu + theme toggle, on all 19 pages at 390 (and overflow at 1280)
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE || 'webkit'];
const PAGES = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html'.split(',');
(async () => {
  const b = await eng.launch(); const issues = [];
  for (const path of PAGES) for (const w of [390, 1280]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 800 } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push('pageerror: ' + String(e.message).slice(0, 140)));
    p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::|blocked|access control|cancelled|NetworkError|Load failed|ERR_FAILED|could not be loaded|due to access control/i.test(m.text())) errs.push('console: ' + m.text().slice(0, 140)); });
    try { await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); } catch (e) { issues.push(`${path} ${w}: goto ${String(e.message).slice(0, 80)}`); await ctx.close(); continue; }
    await p.waitForTimeout(500);
    const r = await p.evaluate(() => { const o = {}; o.over = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.small = [...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]), select, textarea')].filter(e => e.getClientRects().length && parseFloat(getComputedStyle(e).fontSize) < 16).map(e => (e.id || e.name) + ':' + getComputedStyle(e).fontSize); o.js = document.documentElement.classList.contains('js'); o.h1 = (document.querySelector('h1') || {}).offsetHeight || 0; o.font = getComputedStyle(document.querySelector('h1') || document.body).fontFamily.slice(0, 30); o.fonts = document.fonts ? [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')).filter((v, i, a) => a.indexOf(v) === i).join('+') : '?'; return o; });
    if (r.over > 0) issues.push(`${path} ${w}: horizontal overflow ${r.over}px`);
    if (w === 390 && r.small.length) issues.push(`${path} ${w}: inputs under 16px: ${r.small.join(', ')}`);
    if (!r.js) issues.push(`${path} ${w}: html has no .js class`);
    if (!/Fraunces/.test(r.fonts) || !/Figtree/.test(r.fonts)) issues.push(`${path} ${w}: fonts loaded = ${r.fonts}`);
    // theme toggle
    const tt = await p.$('#theme-toggle');
    if (tt) { const t0 = await p.evaluate(() => document.documentElement.getAttribute('data-theme') + '|' + getComputedStyle(document.body).backgroundColor); await p.evaluate(() => document.querySelector('#theme-toggle').click()); await p.waitForTimeout(150); const t1 = await p.evaluate(() => document.documentElement.getAttribute('data-theme') + '|' + getComputedStyle(document.body).backgroundColor); if (t0 === t1) issues.push(`${path} ${w}: theme toggle did nothing (${t0})`); }
    // phone menu
    if (w === 390 && await p.$('#nav-toggle')) { await p.evaluate(() => document.querySelector('#nav-toggle').click()); await p.waitForTimeout(400); const m = await p.evaluate(() => { const n = document.querySelector('#nav'); const a = n.querySelector('a'); const r = a.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { open: n.classList.contains('open'), vis: getComputedStyle(n).visibility, linkOnTop: !!top && (top === a || a.contains(top)), y: Math.round(r.top) }; }); if (!m.open || m.vis === 'hidden' || !m.linkOnTop) issues.push(`${path} ${w}: phone menu problem ${JSON.stringify(m)}`); }
    // faq details
    if (path === '/faq/') { const d = await p.evaluate(() => { const s = document.querySelector('.faq-item summary'); const it = s.parentElement; const was = it.open; s.click(); return [was, it.open, it.querySelector('.faq-body').offsetHeight]; }); if (d[0] === d[1] || !d[2]) issues.push(`/faq/ ${w}: details did not toggle ${d}`); }
    if (errs.length) issues.push(`${path} ${w}: ${[...new Set(errs)].join(' | ')}`);
    await ctx.close();
  }
  console.log(`  ${b.version()} ${process.env.ENGINE || 'webkit'}: ${issues.length} issue(s)`); issues.forEach(i => console.log('    ' + i));
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
