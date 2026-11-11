const { chromium } = require('/opt/node-tools/node_modules/playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/consulting/', { waitUntil: 'load' }); await p.waitForTimeout(500);
  const r = await p.evaluate(() => { const out = []; const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('pages/consulting.css')); const walk = (rules, ctxt) => { for (const rule of rules) { if (rule.cssRules && rule.cssRules.length && !rule.selectorText) { walk(rule.cssRules, ctxt + ' ' + (rule.conditionText || '')); continue; } if (!rule.selectorText) continue; for (const sel of rule.selectorText.split(/,(?![^(]*\))/)) { const s = sel.trim(); let n = -1; try { n = document.querySelectorAll(s.replace(/:(focus-within|focus-visible|hover|active)/g, '')).length; } catch (e) { n = 'ERR'; } out.push({ s, n, ctxt: ctxt.trim(), decl: rule.style.cssText.slice(0, 110) }); } } }; walk(sheet.cssRules, ''); return out; });
  for (const x of r) console.log(String(x.n).padStart(3), x.s.replace('[data-page="consulting"] ', '§ '), x.ctxt ? ' @' + x.ctxt : '', ' {', x.decl, '}');
  await b.close();
})();
