// dead.js : every selector in styles.css that matches no element on any of the 19 pages (states and script-set classes relaxed)
const { chromium } = require('playwright'); const fs = require('fs');
const css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
const lineOf = i => css.slice(0, i).split('\n').length;
// collect style rules (selector text + line), walking nested at-rules
const rules = []; (function walk(start, end) { let i = start, prelude = start;
  while (i < end) { const ch = css[i];
    if (ch === '{') { const head = css.slice(prelude, i).trim(); let depth = 1, j = i + 1; while (j < end && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
      if (/^@(media|supports|container)/.test(head)) walk(i + 1, j - 1); else if (!head.startsWith('@')) rules.push({ sel: head, line: lineOf(prelude + css.slice(prelude, i).search(/\S/)) });
      i = j; prelude = j; continue; }
    if (ch === ';' ) prelude = i + 1; i++; } })(0, css.length);
const splitTop = s => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') d++; if (ch === ')' || ch === ']') d--; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
const relax0 = s => s
  .replace(/::?(before|after|placeholder|marker|selection|-webkit-details-marker)/g, '')
  .replace(/:(hover|active|focus-visible|focus-within|focus|checked|disabled|empty)/g, '')
  .replace(/html:not\(\.js\)/g, 'html').replace(/:not\(\.visible\)/g, '').replace(/:root:not\(\[data-theme="light"\]\)/g, ':root').replace(/:root\[data-theme="dark"\]/g, ':root')
  .replace(/\.(js|crest-intro)\s+/g, '').replace(/\.(visible|open|show|scrolled|invalid|ok|error|play|nav-anim)(?![\w-])/g, '')
  .replace(/\[aria-expanded="true"\]/g, '[aria-expanded]').replace(/\[aria-invalid="true"\]/g, '').replace(/\[aria-busy="true"\]/g, '').replace(/\[disabled\]/g, '').replace(/\[open\]/g, '').replace(/\[hidden\]/g, '')
  .replace(/:not\(\s*\)/g, '');
const relax = s => { const t = relax0(s).replace(/\s*([>+~])\s*/g, ' $1 ').trim().split(/\s+/).filter(Boolean); const out = [];
  t.forEach((tok, i) => { const comb = /^[>+~]$/.test(tok); if (comb && (i === 0 || /^[>+~]$/.test(t[i - 1]))) out.push('*'); out.push(tok); if (comb && i === t.length - 1) out.push('*'); });
  return out.join(' ') || '*'; };
const PAGES = ['/', '/services/', '/consulting/', '/work/', '/process/', '/pricing/', '/faq/', '/contact/', '/about/', '/start/', '/web-design-baton-rouge/', '/web-design-denham-springs/', '/web-design-gonzales/', '/web-design-prairieville/', '/privacy/', '/terms/', '/checkout/', '/checkout/success/', '/404.html'];
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const sels = []; for (const r of rules) for (const s of splitTop(r.sel)) sels.push({ raw: s, q: relax(s), line: r.line, hits: 0, pages: [] });
  for (const p of PAGES) { const page = await ctx.newPage(); await page.goto('http://localhost:8720' + p); await page.waitForTimeout(250);
    const res = await page.evaluate(qs => qs.map(q => { try { return document.querySelector(q) ? 1 : 0; } catch (e) { return -1; } }), sels.map(s => s.q));
    res.forEach((v, i) => { if (v === 1) { sels[i].hits++; sels[i].pages.push(p); } if (v === -1) sels[i].bad = true; }); await page.close(); }
  await b.close();
  const dead = sels.filter(s => !s.hits);
  console.log(`${rules.length} rules, ${sels.length} selectors; ${dead.length} match nothing on any page`);
  for (const s of dead) console.log(`L${s.line}  ${s.raw}${s.bad ? '   [could not test: ' + s.q + ']' : ''}`);
  fs.writeFileSync(__dirname + '/logs/selectors.json', JSON.stringify(sels.map(s => ({ raw: s.raw, line: s.line, pages: s.pages }))));
})();
