// Which selectors in styles.css match nothing on ANY of the 19 pages (in any theme / js / no-js state)?
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html', '/checkout/?plan=starter', '/contact/?package=business'];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const matched = new Map(); // selector -> pages
  let all = null;
  for (const p of PAGES) {
    const page = await ctx.newPage();
    await page.goto('http://localhost:8720' + p, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const res = await page.evaluate(() => {
      const out = [];
      const strip = s => s
        .replace(/::?(before|after|placeholder|marker|selection|first-line|first-letter|backdrop|file-selector-button|details-content|-webkit-[a-z-]+|-moz-[a-z-]+)(\([^)]*\))?/g, '')
        .replace(/:(hover|focus-visible|focus-within|focus|active|checked|disabled|invalid|valid|target|visited|placeholder-shown|user-invalid|open|any-link|link|autofill|-webkit-autofill|indeterminate|required|optional)\b/g, '')
        .replace(/:(not|is|where|has)\(\s*\)/g, '')
        .replace(/\[open\]/g, '')
        .replace(/\.(open|visible|scrolled|show|invalid|nav-anim|play|error|ok|js|crest-intro|loading|done|is-[a-z-]+|has-[a-z-]+)\b/g, '')
        .replace(/\[(aria-expanded|aria-invalid|aria-busy|aria-current|data-theme|hidden|inert)[^\]]*\]/g, '')
        .replace(/:not\(\s*\)/g, '').replace(/:is\(\s*\)/g, '').replace(/:where\(\s*\)/g, '');
      const walk = (rules, ctxs) => {
        for (const r of rules) {
          if (r.type === 1) {
            for (const sel of r.selectorText.split(/,(?![^(]*\))/)) {
              const s = sel.trim(); let m = null, err = null;
              let q = strip(s).trim().replace(/^[>+~]\s*/, '').replace(/[>+~]\s*$/, '').replace(/^\s*$/, '*');
              q = q.replace(/([>+~])\s*([>+~])/g, '$1 * $2').replace(/([>+~])\s*$/, '$1 *').replace(/^\s*([>+~])/, '* $1').replace(/:root\b/g, 'html').replace(/html\s*html/g, 'html');
              try { m = !!document.querySelector(q); } catch (e) { err = String(e).slice(0, 80); }
              out.push({ s, q, m, err, ctx: ctxs.join(' / ') });
            }
            if (r.cssRules && r.cssRules.length) walk(r.cssRules, ctxs.concat(['&' + r.selectorText.slice(0, 30)]));
          } else if (r.cssRules) walk(r.cssRules, ctxs.concat([(r.conditionText || r.name || r.cssText.slice(0, 40)).slice(0, 60)]));
        }
      };
      for (const sh of document.styleSheets) { try { walk(sh.cssRules, []); } catch (e) {} }
      return out;
    });
    if (!all) all = res.map(r => ({ ...r, pages: [] }));
    res.forEach((r, i) => { if (r.m) all[i].pages.push(p); if (r.err) all[i].err = r.err; });
    await page.close();
  }
  const dead = all.filter(r => !r.pages.length);
  fs.writeFileSync(__dirname + '/cssdead.json', JSON.stringify({ total: all.length, dead }, null, 1));
  console.log('selectors:', all.length, 'dead:', dead.length, 'errors:', dead.filter(d => d.err).length);
  for (const d of dead) console.log((d.err ? 'ERR ' : '    ') + d.s + '   [' + d.ctx + ']' + (d.err ? '  q=' + d.q : ''));
  await browser.close();
})();
