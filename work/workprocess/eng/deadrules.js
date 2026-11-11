// For every style rule in the page stylesheet: does the selector match anything, and does each declaration change the computed value vs. the rule being disabled?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [path, slug] of [['/work/', 'work'], ['/process/', 'process']]) {
    const report = {};
    for (const w of [360, 390, 600, 820, 1024, 1280, 1440]) {
      const ctx = await b.newContext({ viewport: { width: w, height: 900 } });   // motion allowed so the no-preference block applies
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(300);
      const r = await p.evaluate((slug) => {
        const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('/pages/' + slug + '.css')); const out = [];
        const walk = (rules, media) => { for (const rule of rules) { if (rule.cssRules && rule.media) { if (matchMedia(rule.media.mediaText).matches) walk(rule.cssRules, rule.media.mediaText); else for (const r2 of rule.cssRules) out.push({ sel: r2.selectorText, media: rule.media.mediaText, inactive: true }); continue; }
          const sel = rule.selectorText; const base = sel.replace(/::?(before|after)\b/g, '').replace(/:(hover|active|focus-visible)/g, '');
          let els = []; try { els = [...document.querySelectorAll(base.trim().replace(/\s+$/, '') || '*')]; } catch (e) { out.push({ sel, err: String(e) }); continue; }
          const pseudo = (sel.match(/::?(before|after)/) || [])[0] || null; const state = /:(hover|active)/.test(sel);
          const props = [...rule.style]; const noEffect = [];
          if (els.length && !state) { const before = els.map(e => { const cs = getComputedStyle(e, pseudo); return props.map(pn => cs.getPropertyValue(pn)); });
            const saved = rule.style.cssText; rule.style.cssText = ''; const after = els.map(e => { const cs = getComputedStyle(e, pseudo); return props.map(pn => cs.getPropertyValue(pn)); }); rule.style.cssText = saved;
            props.forEach((pn, i) => { if (before.every((bv, k) => bv[i] === after[k][i])) noEffect.push(pn); }); }
          out.push({ sel, media: media || '', n: els.length, state, noEffect }); } };
        walk(sheet.cssRules, ''); return out; }, slug);
      for (const x of r) { const k = (x.media ? '@' + x.media + ' ' : '') + x.sel; report[k] = report[k] || { widths: [], matched: 0, noEffect: null, state: x.state }; if (x.inactive) continue; report[k].widths.push(w); report[k].matched = Math.max(report[k].matched, x.n || 0); const ne = new Set(x.noEffect || []); report[k].noEffect = report[k].noEffect === null ? ne : new Set([...report[k].noEffect].filter(v => ne.has(v))); }
      await ctx.close();
    }
    console.log('=====', slug);
    for (const [k, v] of Object.entries(report)) console.log((v.matched === 0 && !v.state ? 'NO MATCH ' : '         ') + k.slice(0, 110).padEnd(112) + ' matched ' + v.matched + (v.noEffect && v.noEffect.size ? '  NEVER-EFFECTIVE: ' + [...v.noEffect].join(', ') : '') + (v.widths.length ? '' : '  (media never active at tested widths)'));
  }
  await b.close();
})();
