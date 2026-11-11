const { launch, ctx, URL, PORT } = require('./common');
(async () => {
  const b = await launch();
  for (const url of [URL, PORT]) {
    const c = await ctx(b, { viewport: { width: 360, height: 900 } }); const p = await c.newPage();
    await p.goto(url, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1200);
    const fails = []; let tabInfo = [];
    for (let w = 320; w <= 1920; w += 20) {
      await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(90);
      // scroll through to trigger draws at a few widths
      if (w % 200 === 0) { await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 40)); } scrollTo({ top: 0, behavior: 'instant' }); }); }
      const r = await p.evaluate(() => {
        const over = document.documentElement.scrollWidth - innerWidth; let worst = 0, who = '';
        for (const el of document.querySelectorAll('main *, section *, .kws-motion')) {
          const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden') continue;
          if (el.tagName === 'CANVAS') continue; // scaled, clipped by its layer
          const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue; if (el.closest('.sr-only, .hp') || el.ownerSVGElement) continue;
          const d = Math.max(rc.right - innerWidth, -rc.left); if (d > worst + .5) { worst = d; who = el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ').join('.'); }
        }
        // tab text overflow: does the text of each tab fit its box?
        const tabs = [...document.querySelectorAll('[role=tab]')].map(t => { const rg = document.createRange(); rg.selectNodeContents(t); let tw = 0; for (const q of rg.getClientRects()) tw = Math.max(tw, q.width); const cs = getComputedStyle(t); const inner = t.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); return { n: t.textContent.trim().slice(0, 12), spare: +(inner - tw).toFixed(1), sw: t.scrollWidth - t.clientWidth, fs: parseFloat(cs.fontSize) }; });
        const tightest = tabs.sort((a, b) => a.spare - b.spare)[0];
        // clipped/overflowing text in kit elements
        const clip = [...document.querySelectorAll('[class*="kws-"]')].filter(e => { const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || e.classList.contains('kws-shader') || e.closest('.kws-shader')) return false; return (e.scrollWidth > e.clientWidth + 1) && e.clientWidth > 0 && cs.display !== 'inline'; }).map(e => (e.className || '').toString().split(' ')[0] + '+' + (e.scrollWidth - e.clientWidth));
        return { over, worst: Math.round(worst), who, tightest, clip: [...new Set(clip)].slice(0, 4) };
      });
      if (r.over > 0 || r.worst > 0) fails.push(`${w}px: page +${r.over}, element +${r.worst} ${r.who}`);
      if (r.clip.length) fails.push(`${w}px: overflowing content ${r.clip.join(', ')}`);
      if (r.tightest && (w <= 440 || r.tightest.spare < 3)) tabInfo.push(`${w}: tightest tab "${r.tightest.n}" spare ${r.tightest.spare}px at ${r.tightest.fs}px`);
    }
    console.log(url.split('/').pop(), fails.length ? '\n  ' + fails.join('\n  ') : 'no overflow 320..1920');
    console.log('  tabs:', tabInfo.slice(0, 12).join(' | '));
    await c.close();
  }
  await b.close();
})();
