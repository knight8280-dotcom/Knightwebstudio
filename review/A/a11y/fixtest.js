// Proposed fix for the header focus jump: move the offset from html scroll-padding to scroll-margin on everything outside the sticky header.
const { chromium, BASE, ctxFor } = require('./lib');
const FIX = `html{scroll-padding:0 !important}
main :is(a,button,input,select,textarea,summary,[tabindex],[id]), main[id], .site-footer :is(a,button), .cta-band :is(a,button){scroll-margin-top:calc(var(--header-h) + var(--s-5));scroll-margin-bottom:var(--s-5)}
@media (max-width:1099.98px){main :is(a,button,input,select,textarea,summary,[tabindex],[id]), .site-footer :is(a,button){scroll-margin-bottom:calc(var(--btn-h) + var(--s-6))}}`;
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const ctx = await ctxFor(b, { w, h, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300); await p.addStyleTag({ content: FIX });
    const sy = () => p.evaluate(() => Math.round(scrollY));
    await p.evaluate(() => scrollTo({ top: 3000, behavior: 'instant' })); await p.waitForTimeout(300);
    await p.evaluate(() => document.getElementById('theme-toggle').focus()); await p.waitForTimeout(200); const a = await sy();
    await p.keyboard.press('Shift+Tab'); await p.waitForTimeout(200); const c = await sy();
    // cover check, nearest edge, both directions, with the fix
    const cov = await p.evaluate(async () => { const els = [...document.querySelectorAll('main a[href], main button, main summary, footer a')].filter(e => e.checkVisibility({ checkVisibilityCSS: true })); let bad = 0, n = 0; const worst = [];
      for (const dir of ['down', 'up']) for (const el of els) { const r0 = el.getBoundingClientRect(); const top = r0.top + scrollY; scrollTo({ top: dir === 'down' ? Math.max(0, top - innerHeight - 300) : top + 300, behavior: 'instant' }); await new Promise(r => setTimeout(r, 60)); el.scrollIntoView({ block: 'nearest', behavior: 'instant' }); await new Promise(r => setTimeout(r, 330)); n++;
        const r = el.getBoundingClientRect(); let c = 0; for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) { const t = document.elementFromPoint(r.left + r.width * (i + .5) / 5, r.top + r.height * (j + .5) / 3); if (t && t.closest('.site-header,.mobile-cta')) c++; } if (c) { bad++; worst.push(el.textContent.trim().slice(0, 20) + ' ' + dir + ' ' + c + '/15'); } }
      return { n, bad, worst: worst.slice(0, 5) }; });
    // anchor jump to #care
    await p.evaluate(() => { location.hash = '#care'; }); await p.waitForTimeout(400); const anchorTop = await p.evaluate(() => Math.round(document.getElementById('care').getBoundingClientRect().top));
    console.log(`${w}: script focus on header control from 3000 -> ${a}; Shift+Tab within header -> ${c}; nearest-edge cover with fix: ${JSON.stringify(cov)}; #care lands at y=${anchorTop} (header ${await p.evaluate(() => document.getElementById('site-header').offsetHeight)})`);
    await ctx.close();
  }
  await b.close();
})();
