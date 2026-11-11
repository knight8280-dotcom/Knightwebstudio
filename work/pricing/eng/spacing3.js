const { chromium } = require('playwright');
const measure = () => { const rows = [...document.querySelectorAll('.spec tbody tr')]; const out = []; rows.forEach((tr, i) => { const trr = tr.getBoundingClientRect(); let worst = 0, what = '';
  const tw = document.createTreeWalker(tr, NodeFilter.SHOW_TEXT); while (tw.nextNode()) { const n = tw.currentNode; if (!n.textContent.trim()) continue; const el = n.parentElement; if (el.closest('.cell-label,.popular')) continue; const rg = document.createRange(); rg.selectNodeContents(n); for (const rc of rg.getClientRects()) { const d = rc.right - trr.right; if (d > worst) { worst = d; what = n.textContent.trim().slice(0, 18); } } }
  out.push(Math.round(worst) + (worst > 0 ? `("${what}")` : '')); }); return out.join(' '); };
(async () => {
  const b = await chromium.launch();
  for (const mode of ['text-spacing', 'text-spacing + fix', 'normal', 'normal + fix']) {
    console.log('--', mode, ': px of text past each column\'s right edge (One-page, Starter, Business, Commerce)');
    for (const w of [1100, 1120, 1140, 1160, 1180, 1200, 1240, 1280, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      if (/spacing/.test(mode)) await p.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-bottom: 2em !important; }' });
      if (/fix/.test(mode)) await p.addStyleTag({ content: '@supports (grid-template-rows: subgrid) { @media (min-width: 1100px) { [data-page="pricing"] .spec tr { grid-template-columns: minmax(0, 1fr); } } }' });
      await p.waitForTimeout(250);
      const r = await p.evaluate(measure); const al = await p.evaluate(() => { const ys = [...document.querySelectorAll('.spec-act .btn-block')].map(e => Math.round(e.getBoundingClientRect().top)); return new Set(ys).size === 1; });
      console.log('  ', w, r, al ? '' : '(buttons no longer aligned)');
      if (w === 1100 && mode === 'text-spacing + fix') { const y = await p.evaluate(() => document.querySelector('.spec').getBoundingClientRect().top + scrollY - 40); await p.screenshot({ path: 'shots/spacing-1100-fixed.png', fullPage: true, clip: { x: 0, y, width: w, height: 520 } }); }
      await ctx.close();
    }
  }
  await b.close();
})();
