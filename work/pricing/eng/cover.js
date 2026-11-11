const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' });
  const r = await p.evaluate(() => { const sheet = [...document.styleSheets].find(s => /pages\/pricing\.css/.test(s.href || '')); const out = []; const raw = [];
    const visit = (rules, ctxt) => { for (const rule of rules) { if (rule.cssRules && rule.type !== CSSRule.STYLE_RULE) { visit(rule.cssRules, ctxt + ' ' + (rule.conditionText || '')); continue; }
      if (rule.type !== CSSRule.STYLE_RULE) continue; let sel = rule.selectorText.replace(/::(before|after)/g, ''); let n = 0; try { n = document.querySelectorAll(sel).length; } catch (e) { n = -1; }
      out.push({ sel: rule.selectorText, n, ctxt: ctxt.trim() });
      for (const prop of rule.style) { const v = rule.style.getPropertyValue(prop); if (/(\d|\.)(px|rem|em|deg|s|ms|%)\b/.test(v.replace(/var\([^)]*\)/g, '')) || /^-?[\d.]+$/.test(v.trim())) raw.push(`${rule.selectorText} { ${prop}: ${v} }`); } } };
    visit(sheet.cssRules, ''); return { out, raw }; });
  console.log('rules:', r.out.length, 'selectors matching nothing:', JSON.stringify(r.out.filter(x => x.n === 0)));
  console.log('RAW VALUES (not tokens):\n  ' + r.raw.join('\n  '));
  await b.close();
})();
