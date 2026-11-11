// Dead-selector and scoping audit of the one stylesheet, using the browser's own parser.
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8720';
const PAGES = ['/','/services/','/consulting/','/work/','/process/','/pricing/','/faq/','/contact/','/about/','/start/','/web-design-baton-rouge/','/web-design-denham-springs/','/web-design-gonzales/','/web-design-prairieville/','/privacy/','/terms/','/checkout/','/checkout/?plan=starter-deposit','/checkout/success/','/404.html'];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8');
  const marker = css.indexOf('PAGES\n');
  let rules = null; const hits = {}; const hitsLoose = {};
  for (const p of PAGES) {
    const page = await ctx.newPage();
    await page.goto(BASE + p, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const res = await page.evaluate(() => {
      const out = [];
      const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('styles.css'));
      const walk = (list, ctx) => { for (const r of list) {
        if (r.type === 1) out.push({ sel: r.selectorText, ctx, decl: r.style.cssText });
        else if (r.cssRules) walk(r.cssRules, ctx + ' | ' + (r.conditionText !== undefined ? (r.constructor.name.replace('CSS','').replace('Rule','') + ' ' + r.conditionText) : r.constructor.name));
      } };
      walk(sheet.cssRules, '');
      const loose = s => s
        .replace(/::?(before|after|marker|placeholder|selection|-webkit-details-marker)/g, '')
        .replace(/:(hover|active|focus-visible|focus-within|focus|checked|disabled|empty)/g, '')
        .replace(/\.(visible|scrolled|open|show|invalid|error|ok|play|nav-anim|crest-intro)(?![\w-])/g, '')
        .replace(/\[(open|hidden|disabled|aria-expanded="true"|aria-invalid="true"|aria-busy="true")\]/g, '')
        .replace(/html:not\(\.js\)/g, 'html').replace(/^\.js /, 'html ').replace(/:not\(\s*\)/g, '')
        .replace(/:not\(\[hidden\], \.error\)/g, '').replace(/:not\(\)/g, '');
      const splitTop = s => { const parts = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) parts.push(cur.trim()); return parts; };
      const m = {}, ml = {};
      for (const r of out) for (const s of splitTop(r.sel)) {
        try { m[s] = document.querySelector(s) ? 1 : 0; } catch (e) { m[s] = -1; }
        let l = loose(s).trim() || '*';
        try { ml[s] = document.querySelector(l) ? 1 : 0; } catch (e) { ml[s] = -1; }
      }
      return { out, m, ml };
    });
    if (!rules) rules = res.out;
    for (const [s, v] of Object.entries(res.m)) { hits[s] = hits[s] || []; if (v === 1) hits[s].push(p); }
    for (const [s, v] of Object.entries(res.ml)) { hitsLoose[s] = hitsLoose[s] || []; if (v === 1) hitsLoose[s].push(p); if (v === -1) hitsLoose[s].push('ERR'); }
    await page.close();
  }
  await browser.close();
  const never = Object.keys(hits).filter(s => hits[s].length === 0 && hitsLoose[s].length === 0);
  const onlyState = Object.keys(hits).filter(s => hits[s].length === 0 && hitsLoose[s].length > 0);
  fs.writeFileSync(__dirname + '/cssaudit.json', JSON.stringify({ count: rules.length, never, onlyState, hits }, null, 1));
  console.log('style rules:', rules.length, 'distinct selectors:', Object.keys(hits).length);
  console.log('NEVER MATCH (even with states stripped):', never.length); never.forEach(s => console.log('  ', s));
  console.log('match only in a state:', onlyState.length);
  // one-page-only shared selectors
  fs.writeFileSync(__dirname + '/cssrules.json', JSON.stringify(rules, null, 1));
})();
