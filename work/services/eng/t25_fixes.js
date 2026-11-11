const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  let html = fs.readFileSync('/home/user/Knightwebstudio/services/index.html', 'utf8');
  let css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/pages/services.css', 'utf8');
  // Fix A: figure after the copy in the DOM, placed by CSS
  const m = html.match(/(<div class="container split split-sticky">\s*<!--[^>]*-->\s*)(<div class="fig-col">[\s\S]*?<\/figure>\s*<\/div>)(\s*)(<div>\s*<div class="lead stack reveal" id="automation">[\s\S]*?)(\s*<\/div>\s*<\/section>\s*<!-- =+ CLOSING)/);
  if (!m) throw new Error('pattern A not found');
  html = html.replace(m[0], '<div class="container split">' + m[4].trimEnd() + '\n' + m[2] + m[5]);
  css += `\n@media (min-width: 760px) { [data-page="services"] .fig-col { order: -1; } }\n@media (min-width: 980px) { [data-page="services"] .fig-col { position: sticky; top: calc(var(--header-h) + var(--s-6)); } }\n`;
  // Fix B: phone column may not take more than 40% of the row
  css = css.replace('grid-template-columns: var(--phone-w) minmax(0, 1fr)', 'grid-template-columns: min(var(--phone-w), 40%) minmax(0, 1fr)');
  // Fix C: the smaller price size on every phone, not only under 380px
  css = css.replace('@media (max-width: 379.98px) { [data-page="services"] :is(.menu-price, .pl-terms)', '@media (max-width: 599.98px) { [data-page="services"] :is(.menu-price, .pl-terms)');
  for (const [w, h, zoom] of [[390, 844], [380, 844], [384, 844], [360, 740], [430, 932], [560, 800], [820, 1100], [1024, 768], [1440, 900], [820, 1100, 200]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|calendly\.com/, r => r.abort());
    await ctx.route('**/services/', r => r.fulfill({ contentType: 'text/html', body: html })); await ctx.route('**/pages/services.css', r => r.fulfill({ contentType: 'text/css', body: css }));
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/services/'); await p.evaluate(() => document.fonts.ready); if (zoom) await p.evaluate(z => document.documentElement.style.fontSize = z + '%', zoom); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const f = document.querySelector('.fig-col'), t = document.querySelector('#automation'); const fr = f.getBoundingClientRect(), tr = t.getBoundingClientRect(); const cs = getComputedStyle(f);
      const order = [...document.querySelectorAll('#win h2, #win h3, #win figure')].map(e => e.tagName + ':' + e.textContent.trim().slice(0, 12)).slice(0, 3);
      const out = [...document.querySelectorAll('#win *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > innerWidth + 1 && !e.closest('svg'); }).length;
      return { H: document.documentElement.scrollHeight, fig: cs.display === 'none' ? 'hidden' : `${Math.round(fr.left)}..${Math.round(fr.right)} y${Math.round(fr.top + scrollY)} ${cs.position}`, text: `${Math.round(tr.left)}..${Math.round(tr.right)} y${Math.round(tr.top + scrollY)}`, domOrder: order, outOfView: out, menu: [...document.querySelectorAll('.menu a')].map(a => Math.round(a.getBoundingClientRect().height)).join(','), rows: [...document.querySelectorAll('main summary')].map(a => Math.round(a.getBoundingClientRect().height)).join(','), over: document.documentElement.scrollWidth - innerWidth }; });
    console.log(`${w}${zoom ? ' @' + zoom + '% text' : ''}:`, JSON.stringify(r));
    if (w === 820 || w === 1440) await p.locator('#win').screenshot({ path: `fixA-${w}${zoom || ''}.png` }).catch(() => {});
    await ctx.close();
  }
  console.log('css bytes with the three fixes:', Buffer.byteLength(css), ' comments in file:', (css.match(/\/\*[\s\S]*?\*\//g) || []).join('').length);
  await b.close();
})();
