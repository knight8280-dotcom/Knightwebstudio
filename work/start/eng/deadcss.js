const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'no-preference' });
  await ctx.route(/plausible|calendly/, r => r.abort());
  const p = await ctx.newPage(); await p.goto('http://localhost:8720/start/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1500);
  const widths = [360, 390, 620, 800, 1000, 1150, 1440];
  const eff = {};
  for (const w of widths) {
    await p.setViewportSize({ width: w, height: 900 }); await p.waitForTimeout(120);
    const r = await p.evaluate(() => {
      const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('pages/start.css')); const res = [];
      const visit = (rules, media) => { for (const rule of rules) {
        if (rule.type === CSSRule.MEDIA_RULE) { if (matchMedia(rule.conditionText).matches) visit(rule.cssRules, rule.conditionText); else for (const r2 of rule.cssRules) if (r2.style) for (const prop of r2.style) res.push({ key: `@${rule.conditionText} ${r2.selectorText} { ${prop} }`, active: false }); continue; }
        if (rule.type !== CSSRule.STYLE_RULE) continue;
        const sel = rule.selectorText; const pseudo = (sel.match(/::(before|after)\s*$/) || [])[0] || null; const base = pseudo ? sel.replace(/::(before|after)\s*$/, '') : sel;
        let els = []; try { els = [...document.querySelectorAll(base)]; } catch (e) {}
        const props = [...rule.style];
        for (const prop of props) {
          const key = (media ? `@${media} ` : '') + `${sel} { ${prop} }`;
          if (!els.length) { res.push({ key, active: true, matches: 0, effect: false }); continue; }
          if (prop.startsWith('--')) { res.push({ key, active: true, matches: els.length, effect: null }); continue; }
          const val = rule.style.getPropertyValue(prop), pri = rule.style.getPropertyPriority(prop);
          const before = els.map(e => getComputedStyle(e, pseudo).getPropertyValue(prop));
          rule.style.removeProperty(prop);
          const after = els.map(e => getComputedStyle(e, pseudo).getPropertyValue(prop));
          rule.style.setProperty(prop, val, pri);
          res.push({ key, active: true, matches: els.length, effect: before.some((v, i) => v !== after[i]) });
        }
      } };
      visit(sheet.cssRules, ''); return res;
    });
    for (const x of r) { const e = eff[x.key] = eff[x.key] || { active: 0, matches: 0, effect: 0, custom: false }; if (x.active) { e.active++; e.matches = Math.max(e.matches, x.matches || 0); if (x.effect) e.effect++; if (x.effect === null) e.custom = true; } }
  }
  for (const [k, v] of Object.entries(eff)) { if (v.custom) continue; if (!v.active) console.log('NEVER ACTIVE  ' + k); else if (!v.matches) console.log('NO MATCH      ' + k); else if (!v.effect) console.log('NO EFFECT     ' + k); }
  console.log('declarations checked:', Object.keys(eff).length);
  await b.close();
})();
