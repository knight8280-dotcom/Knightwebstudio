// geom.js --a URL --b URL --path /pricing/ --root ".spec" [--widths 390,820,1100,1280,1440] [--themes light,dark]
// Compares, between two copies of the site, every element under each root: its box relative to the root and the styles that paint it.
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const A = arg('a', 'http://localhost:8724'), B = arg('b', 'http://localhost:8720'), path = arg('path'), root = arg('root');
const widths = arg('widths', '360,390,600,820,1000,1100,1280,1440').split(',').map(Number), themes = arg('themes', 'light,dark').split(',');
const setup = arg('setup', '');
const ignore = arg('ignore', '').split(',').filter(Boolean).map(Number);   // indexes of style properties to ignore, e.g. 20 = textWrap   // optional JS run in the page before measuring
(async () => {
  const b = await chromium.launch(); let bad = 0;
  for (const theme of themes) for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const snap = async base => { const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); if (setup) await p.evaluate(setup); await p.waitForTimeout(250);
      const r = await p.evaluate(sel => [...document.querySelectorAll(sel)].map(rt => { const o = rt.getBoundingClientRect(); const props = ['display', 'color', 'backgroundColor', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'borderLeftWidth', 'borderLeftColor', 'borderBottomWidth', 'borderBottomColor', 'borderRightWidth', 'borderRadius', 'boxShadow', 'opacity', 'whiteSpace', 'textWrap'];
        const one = (el, pseudo) => { const cs = getComputedStyle(el, pseudo); return props.map(k => cs[k]).join('|') + (pseudo ? '|' + cs.content + '|' + cs.width + '|' + cs.height + '|' + cs.top + '|' + cs.left : ''); };
        return { w: Math.round(o.width * 10) / 10, h: Math.round(o.height * 10) / 10, kids: [rt, ...rt.querySelectorAll('*')].map(el => { const rc = el.getBoundingClientRect(); if (el.closest('.sr-only') || (el.closest('thead') && getComputedStyle(el.closest('thead')).position === 'absolute')) return { tag: 'hidden', text: '', box: '0,0,0,0', st: '', before: '', after: '' }; return { tag: el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined && el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : ''), text: (el.childNodes.length === 1 && el.firstChild.nodeType === 3 ? el.textContent.trim().slice(0, 24) : ''), box: [rc.left - o.left, rc.top - o.top, rc.width, rc.height].map(v => Math.round(v * 10) / 10).join(','), st: one(el), before: one(el, '::before'), after: one(el, '::after') }; }) }; }), root);
      await p.close(); return r; };
    const [ra, rb] = [await snap(A), await snap(B)]; const diffs = [];
    if (ra.length !== rb.length) diffs.push(`roots ${ra.length} vs ${rb.length}`);
    ra.forEach((x, i) => { const y = rb[i]; if (!y) return; if (x.kids.length !== y.kids.length) { diffs.push(`root ${i}: ${x.kids.length} vs ${y.kids.length} elements`); return; }
      if (x.w !== y.w || x.h !== y.h) diffs.push(`root ${i} size ${x.w}x${x.h} -> ${y.w}x${y.h}`);
      x.kids.forEach((k, j) => { const l = y.kids[j]; const zero = v => { const q = v.box.split(','); return +q[2] === 0 || +q[3] === 0; }; if (zero(k) && zero(l)) return; if (/^(thead|thead .*)$/.test(k.path || '')) return; for (const f of ['box', 'st', 'before', 'after']) if (k[f] !== l[f]) { const pa = k[f].split(/[|]/), pb = l[f].split(/[|]/); const which = f === 'box' ? `${k.box} -> ${l.box}` : pa.map((v, n) => v !== pb[n] && !ignore.includes(n) ? `[${n}] ${v} -> ${pb[n]}` : '').filter(Boolean).join('; '); if (which) diffs.push(`  ${k.tag} "${k.text}" ${f}: ${which}`.slice(0, 300)); } }); });
    console.log(`${path} ${root} @${w} ${theme}: ${ra.length} root(s), ${ra.reduce((n, x) => n + x.kids.length, 0)} elements, ${diffs.length ? diffs.length + ' DIFFERENCES' : 'identical'}`);
    diffs.slice(0, +arg('max', '12')).forEach(d => console.log('   ' + d)); bad += diffs.length; await ctx.close();
  }
  await b.close(); process.exit(bad ? 1 : 0);
})();
