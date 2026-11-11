// Fonts blocked, then images blocked: overflow, clipped text, alt text, layout.
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#.]/g, '_') || 'home');
(async () => {
  const browser = await chromium.launch({ env: { ...process.env, FONTCONFIG_FILE: __dirname + '/simfonts/fonts.conf' } });
  for (const what of ['fonts', 'images']) for (const [vw, vh] of [[360, 740], [390, 844], [1280, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, isMobile: vw < 500, hasTouch: vw < 500 });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    await ctx.route(what === 'fonts' ? /\.woff2/ : /\.(jpg|jpeg|png|webp)(\?|$)/, r => r.abort());
    for (const p of PAGES) {
      if (what === 'images' && !['/', '/work/', '/start/', '/web-design-baton-rouge/'].includes(p)) continue;
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(500);
      // reveal everything so it can be measured
      await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } window.scrollTo(0, 0); }); await page.waitForTimeout(300);
      const r = await page.evaluate(() => {
        const out = { ovf: document.documentElement.scrollWidth - innerWidth, clipped: [], wide: [], imgs: [] };
        document.querySelectorAll('main *, header *, footer *, .topbar *').forEach(el => {
          const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
          const r = el.getBoundingClientRect(); if (!r.width) return;
          if (el.closest('svg')) return;
          if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 1 && el.textContent.trim() && !/sr-only|skip/.test(el.className)) out.clipped.push((el.tagName + '.' + el.className).slice(0, 50) + ' sw=' + el.scrollWidth + ' cw=' + el.clientWidth + ' "' + el.textContent.trim().slice(0, 30) + '"');
          if (r.right > innerWidth + 1 && r.left < innerWidth && !el.closest('.sr-only, .skip-link') && cs.position !== 'fixed') out.wide.push((el.tagName + '.' + el.className).slice(0, 50) + ' right=' + Math.round(r.right));
        });
        [...document.images].forEach(i => { const b = i.getBoundingClientRect(); out.imgs.push(i.getAttribute('src').split('/').pop() + ' ok=' + (i.naturalWidth > 0) + ' box=' + Math.round(b.width) + 'x' + Math.round(b.height) + ' alt="' + i.alt.slice(0, 30) + '"'); });
        return out;
      });
      const flag = r.ovf > 0 || r.clipped.length || r.wide.length;
      if (flag || what === 'images') console.log(`${what} blocked ${(p + '@' + vw).padEnd(34)} overflowX=${r.ovf} clipped=${r.clipped.length} beyondRight=${r.wide.length} ${r.clipped.slice(0, 3).join(' | ')} ${r.wide.slice(0, 3).join(' | ')} ${what === 'images' ? r.imgs.join('; ') : ''}`);
      if ((what === 'images' && ['/', '/work/', '/start/'].includes(p) && vw !== 360) || (what === 'fonts' && ['/', '/pricing/'].includes(p) && vw === 390)) await page.screenshot({ path: `${__dirname}/shots/${what}blocked-${slug(p)}-${vw}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
    console.log(`-- ${what} blocked @${vw}: done`);
  }
  await browser.close();
})();
