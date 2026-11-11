const { chromium } = require('playwright');
const probe = () => {
  const sel = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
  const issues = []; const over = document.documentElement.scrollWidth - innerWidth; if (over > 0) issues.push('PAGE WIDER by ' + over);
  for (const el of document.querySelectorAll('main *, .site-header *, .topbar *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.sr-only, .nav') || el.ownerSVGElement) continue; const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue;
    const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
    if (rc.right > innerWidth + 1 || rc.left < -1) issues.push(`OUT OF VIEWPORT ${sel(el)} ${Math.round(rc.left)}..${Math.round(rc.right)} "${el.textContent.trim().slice(0, 20)}"`);
    if (/(hidden|clip)/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) issues.push(`CLIPPED ${sel(el)} ${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}`); }
  const rects = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) { const n = w.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.sr-only, svg, script, style, .nav, .mobile-cta, footer')) continue; const dd = el.closest('details:not([open])'); if (dd && !el.closest('summary')) continue; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const q of rg.getClientRects()) if (q.width > 1 && q.height > 1) rects.push({ el, q, t: n.textContent.trim().slice(0, 24) }); }
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], c = rects[j]; if (a.el === c.el || a.el.contains(c.el) || c.el.contains(a.el)) continue; const ix = Math.min(a.q.right, c.q.right) - Math.max(a.q.left, c.q.left), iy = Math.min(a.q.bottom, c.q.bottom) - Math.max(a.q.top, c.q.top); if (ix > 2 && iy > 0.45 * Math.min(a.q.height, c.q.height)) issues.push(`TEXT OVERLAP "${a.t}" x "${c.t}"`); }
  return { issues: [...new Set(issues)], H: document.documentElement.scrollHeight };
};
(async () => {
  const b = await chromium.launch();
  for (const [w, h, mode] of [[390, 844, 'spacing'], [360, 740, 'spacing'], [820, 1100, 'spacing'], [1100, 800, 'spacing'], [1440, 900, 'spacing']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true));
    if (mode === 'spacing') await p.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
    if (mode === 'longword') await p.evaluate(() => { const L = 'Donaudampfschifffahrtsgesellschaftskapitaen'; document.querySelector('h1 .l').textContent = L + ' ' + L; document.querySelectorAll('.menu-name, .pl-name, .lead h3').forEach((e, i) => { if (i % 2 === 0) e.textContent = L; }); document.querySelectorAll('.menu-price, .pl-price, .tag').forEach((e, i) => { if (i % 3 === 0) e.textContent = '$1,000,000,000,000,000,000,000,000,000,000'; }); document.querySelectorAll('.faq-body p, .lead p:not(.tag)').forEach(e => e.textContent = L + L + ' ' + e.textContent); document.querySelectorAll('.more-link, main .btn').forEach(e => { e.firstChild.textContent = L + L; }); });
    await p.waitForTimeout(250);
    const r = await p.evaluate(probe);
    console.log(`\n== ${mode} at ${w}: H ${r.H}\n   ` + (r.issues.length ? r.issues.slice(0, 25).join('\n   ') : 'no overflow, clipping or overlap'));
    await p.screenshot({ path: `${mode}-${w}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
