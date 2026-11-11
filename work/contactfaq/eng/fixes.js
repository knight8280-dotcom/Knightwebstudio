const { chromium } = require('/opt/node-tools/node_modules/playwright');
const FIX = `
[data-page="contact"] .talk-tel { font-size: min(var(--fs-h2), 8.2vw); }
@media (min-width: 980px) { [data-page="contact"] .talk-tel { font-size: min(var(--fs-h2), 4.2vw); } }
@media (max-width: 599.98px) { [data-page="contact"] .field select { padding-inline: var(--s-3) var(--s-6); } }
@media (max-width: 379.98px) { [data-page="contact"] .field select { font-size: var(--fs-md); } }
[data-page="contact"] .form-status.ok + .form-fine { display: none; }
.js [data-page="contact"] .h-captcha { min-height: calc(var(--btn-h) * 1.5); }
`;
(async () => {
  const b = await chromium.launch();
  for (const w of [360, 375, 390, 430, 600, 980, 1440]) { const ctx = await b.newContext({ viewport: { width: w, height: 844 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/?package=gbp', { waitUntil: 'load' }); await p.addStyleTag({ content: FIX }); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate(() => { const s = document.getElementById('package'); const cs = getComputedStyle(s); const avail = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); const c = document.createElement('canvas').getContext('2d'); c.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; const tel = document.querySelector('.talk-tel'); return { selFont: cs.fontSize, avail: Math.round(avail), cut: [...s.options].filter(o => c.measureText(o.text).width > avail).map(o => o.text), telFont: getComputedStyle(tel).fontSize, total: document.documentElement.scrollHeight, over: document.documentElement.scrollWidth - innerWidth, capH: Math.round(document.getElementById('hcaptcha-slot').getBoundingClientRect().height) }; });
    console.log(w, JSON.stringify(r)); await ctx.close(); }
  // 200% root at 390 with fix
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort()); const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/', { waitUntil: 'load' }); await p.addStyleTag({ content: FIX + 'html{font-size:200% !important}' }); await p.waitForTimeout(200);
    console.log('390 @200% text with fix:', await p.evaluate(() => { const h = document.querySelector('.page-head-split').getBoundingClientRect(); const worst = Math.max(...[...document.querySelectorAll('main *')].filter(e => !e.closest('.sr-only,.hp') && e.getBoundingClientRect().width).map(e => e.getBoundingClientRect().right)); return JSON.stringify({ headW: Math.round(h.width), worstRightInMain: Math.round(worst), vw: innerWidth }); })); await ctx.close(); }
  await b.close();
})();
