const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const browser = await chromium.launch();
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const [p, name] of [['/', 'home'], ['/pricing/', 'pricing'], ['/consulting/', 'consulting'], ['/contact/', 'contact']]) {
      if (theme === 'dark' && !['home', 'pricing'].includes(name)) continue;
      const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p, { waitUntil: 'load' }); await page.waitForTimeout(600);
      await page.pdf({ path: `${__dirname}/print/${name}-${theme}.pdf`, format: 'Letter', printBackground: false });
      await page.pdf({ path: `${__dirname}/print/${name}-${theme}-bg.pdf`, format: 'Letter', printBackground: true });
      await page.emulateMedia({ media: 'print' });
      const info = await page.evaluate(() => {
        const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden'; };
        const eff = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
        const tels = [...document.querySelectorAll('a[href^="tel:"]')].filter(vis).map(a => a.textContent.trim().replace(/\s+/g, ' ') + ' @' + (a.closest('footer') ? 'footer' : a.closest('main') ? 'main' : a.closest('header') ? 'header' : 'other'));
        const hiddenReveal = [...document.querySelectorAll('.reveal, .reveal .seq')].filter(el => vis(el) && eff(el) < 0.99).length;
        const bodyText = document.body.innerText;
        const prices = (bodyText.match(/\$[\d,]+/g) || []).length;
        const low = []; // text whose colour is too pale on white paper
        const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(m[0]) + .7152 * f(m[1]) + .0722 * f(m[2]); };
        const seen = new Set(); const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (tw.nextNode()) { const el = tw.currentNode.parentElement; if (!tw.currentNode.nodeValue.trim() || seen.has(el) || !vis(el) || el.closest('svg')) continue; seen.add(el); const cs = getComputedStyle(el); const L = lum(cs.color); const ratio = 1.05 / (L + .05); if (ratio < 4.5) low.push(ratio.toFixed(1) + ' ' + cs.color + ' ' + el.tagName + '.' + (el.className || '').toString().slice(0, 30) + ' "' + el.textContent.trim().slice(0, 30) + '"'); }
        return { tels, hiddenReveal, prices, lowOnWhite: low.length, lowSample: low.slice(0, 12), header: vis(document.querySelector('.site-header')), topbar: vis(document.querySelector('.topbar')), footer: vis(document.querySelector('footer')), cta: document.querySelector('.cta-band') ? vis(document.querySelector('.cta-band')) : null, mobileCta: document.getElementById('mobile-cta') ? vis(document.getElementById('mobile-cta')) : null, details: [...document.querySelectorAll('details')].length, detailsOpen: [...document.querySelectorAll('details[open]')].length };
      });
      console.log(theme, name, JSON.stringify(info));
      await page.close();
    }
    await ctx.close();
  }
  await browser.close();
})();
