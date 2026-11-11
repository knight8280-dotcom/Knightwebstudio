const { chromium } = require('playwright');
const base = 'http://localhost:8720';
const HDR = `@media (min-width: 1100px) { .site-header .header-cta { white-space: nowrap; } .nav-links a { padding-inline: var(--s-2); } .nav-links a::after { inset-inline: var(--s-2); } } .header-inner { flex-wrap: wrap; row-gap: var(--s-1); }`;
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  for (const [label, css] of [['normal', ''], ['root 125%', 'html{font-size:125%}'], ['root 150%', 'html{font-size:150%}'], ['root 200%', 'html{font-size:200%}'], ['1.4.12 spacing', '*{letter-spacing:.12em!important;word-spacing:.16em!important;line-height:1.5!important}']]) for (const w of [320, 360, 390, 820, 1280]) {
    const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 844 }); await p.goto(base + '/pricing/'); await p.addStyleTag({ content: HDR + css }); await p.waitForTimeout(200);
    const r = await p.evaluate(() => { const vw = innerWidth; const f = s => { const e = document.querySelector(s); if (!e || getComputedStyle(e).display === 'none') return null; return Math.round(e.getBoundingClientRect().right - vw); }; return { actions: f('.header-actions'), toggle: f('#nav-toggle'), cta: f('.header-cta'), brand: f('.brand'), topTel: f('.topbar-tel'), headerH: Math.round(document.querySelector('.header-inner').getBoundingClientRect().height) }; });
    const over = Object.entries(r).filter(([k, v]) => k !== 'headerH' && v > 0).map(([k, v]) => k + '+' + v).join(' ');
    console.log(label.padEnd(15), String(w).padEnd(5), 'header ' + r.headerH + 'px', over ? 'STICKS OUT: ' + over : 'nothing sticks out');
    if (label === 'normal' && w === 390) { await p.click('#nav-toggle'); await p.waitForTimeout(400); console.log('   menu opens with the fix at 390:', await p.evaluate(() => document.getElementById('nav').classList.contains('open') && getComputedStyle(document.getElementById('nav')).visibility)); }
    await p.close(); }
  await b.close();
})();
