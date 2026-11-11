const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const b = await chromium.launch();
  for (const [slug, path] of [['about', '/about/'], ['notfound', '/404.html']]) {
    const css = fs.readFileSync(`/home/user/Knightwebstudio/assets/css/pages/${slug}.css`, 'utf8');
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); await ctx.route(/plausible|calendly/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    const res = await p.evaluate(slug => { const out = []; const sheet = [...document.styleSheets].find(s => s.href && s.href.includes('/pages/' + slug + '.css'));
      const walk = (rules, ctx) => { for (const r of rules) { if (r.type === 1) { for (const sel of r.selectorText.split(/,(?![^()]*\))/)) { const base = sel.replace(/::?(after|before|marker|placeholder)/g, '').replace(/:(hover|active|focus-visible|focus|visited)/g, '').trim(); let n = -1; try { n = document.querySelectorAll(base).length; } catch (e) { n = 'ERR ' + e.message; } out.push({ ctx, sel: sel.trim(), n, decl: r.style.cssText.slice(0, 400) }); } } else if (r.cssRules) walk(r.cssRules, (ctx ? ctx + ' / ' : '') + (r.conditionText || r.name || r.cssText.slice(0, 30))); } };
      walk(sheet.cssRules, ''); return out; }, slug);
    console.log('==', slug, 'rules:', res.length, 'bytes:', css.length);
    for (const r of res) if (r.n === 0 || typeof r.n === 'string') console.log('  NO MATCH', r.ctx, '|', r.sel);
    // raw values
    const body = css.replace(/\/\*[\s\S]*?\*\//g, '');
    const raws = new Set(); for (const m of body.matchAll(/([a-z-]+)\s*:\s*([^;{}]+)[;}]/g)) { const prop = m[1], val = m[2]; if (prop.startsWith('--') && false) continue; const stripped = val.replace(/var\([^()]*(\([^()]*\))*[^()]*\)/g, 'V'); for (const n of stripped.matchAll(/-?\d*\.?\d+(px|rem|em|s|ms|deg|vw|vh|%)?/g)) { const tok = n[0]; if (/^(0|1|2|3|4|5|-1)$/.test(tok) && !n[1]) continue; raws.add(prop + ': ' + val.trim().slice(0, 70) + '   ← ' + tok); } }
    console.log('  raw numbers (not tokens):'); for (const r of raws) console.log('    ', r);
    console.log('  media:', [...new Set(body.match(/@media[^{]+/g))].join(' | '), '| supports:', [...new Set(body.match(/@supports[^{]+/g) || [])].join(' | '));
    console.log('  hex:', body.match(/#[0-9a-fA-F]{3,8}\b/g), ' !important:', /!important/.test(body), ' data-theme:', /data-theme/.test(body), ' color-mix/backdrop/has:', body.match(/color-mix|backdrop-filter|:has\(/g));
    await ctx.close(); }
  await b.close(); })();
