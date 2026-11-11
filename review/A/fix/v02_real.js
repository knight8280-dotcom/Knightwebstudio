// A11Y-02: the corrected rule (position: relative, and only in windows under 300px tall).
const { chromium } = require('playwright');
const CSS = '@media (max-height: 300px) { .site-header { position: relative; } .mobile-cta, .mobile-cta.show { display: none; } html { scroll-padding: var(--s-5) 0; } }';
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[320, 256], [341, 162], [844, 390], [390, 844], [1280, 290]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
    
    // menu at the top
    let menu = 'n/a (desktop)';
    if (w < 1100) {
      const [x, y] = await p.evaluate(() => { const r = document.getElementById('nav-toggle').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      await p.mouse.click(x, y); await p.waitForTimeout(500);
      menu = await p.evaluate(() => { const links = [...document.querySelectorAll('#nav .nav-links a')]; let on = 0, hit = 0; for (const a of links) { const r = a.getBoundingClientRect(); const yy = r.top + r.height / 2; if (yy < 0 || yy > innerHeight) continue; on++; const e = document.elementFromPoint(r.left + 30, yy); if (e && (e === a || a.contains(e))) hit++; } return `open=${document.getElementById('nav').classList.contains('open')} links on screen ${on}, clickable ${hit}`; });
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    }
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 2500); }); await p.waitForTimeout(700);
    const m = await p.evaluate(() => {
      // everything fixed or sticky that currently overlaps the window
      const cover = []; let top = 0, bottom = innerHeight;
      for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if (cs.position !== 'fixed' && cs.position !== 'sticky') continue; if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue; const r = el.getBoundingClientRect(); if (r.height < 2 || r.bottom <= 0 || r.top >= innerHeight || r.width < innerWidth * .5) continue; if (cs.position === 'sticky' && Math.abs(r.top - parseFloat(cs.top || 0)) > 1) continue; cover.push(el.className.toString().slice(0, 30) + ' ' + Math.round(r.top) + '-' + Math.round(r.bottom)); if (r.top < innerHeight / 2) top = Math.max(top, r.bottom); else bottom = Math.min(bottom, r.top); }
      return { cover, free: Math.round(bottom - top), pct: Math.round((bottom - top) / innerHeight * 100), sw: document.documentElement.scrollWidth };
    });
    console.log(`${w}x${h}: menu ${menu}; mid-page free ${m.free}px (${m.pct}%); pinned: ${m.cover.join(' | ') || 'nothing'}; scrollWidth ${m.sw}`);
    if (h < 300) await p.screenshot({ path: `/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/review/A/fix/shots-a11y/v02real_${w}x${h}.png` });
    await ctx.close();
  }
  await b.close();
})();
