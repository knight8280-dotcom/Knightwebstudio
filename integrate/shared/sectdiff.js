// sectdiff.js --a URL --b URL --out DIR [--paths ...] [--widths 390,1440] [--themes light,dark] [--ignore 20]
// Section-by-section comparison of two copies of the site. For every band of the page (top strip, header, each child of
// <main>, footer) it compares each element's box relative to its parent and the styles that paint it, so a change in one
// band does not show up as a shift in every band below it. Writes DIR/<key>.json and, with crops.py, pictures of the
// changed parts only (A above or beside B).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d; };
const A = arg('a', 'http://localhost:8724'), B = arg('b', 'http://localhost:8720'), out = arg('out');
const ALL = '/,/services/,/consulting/,/work/,/process/,/pricing/,/faq/,/contact/,/about/,/start/,/web-design-baton-rouge/,/web-design-denham-springs/,/web-design-gonzales/,/web-design-prairieville/,/privacy/,/terms/,/checkout/,/checkout/success/,/404.html';
const paths = arg('paths', ALL).split(','), widths = arg('widths', '390,1440').split(',').map(Number), themes = arg('themes', 'light,dark').split(',');
const ignore = arg('ignore', '').split(',').filter(Boolean).map(Number);
const open = arg('open', '') === 'yes';   // open every <details> first
fs.mkdirSync(out, { recursive: true });
const slug = p => (p.replace(/^\/|\/$/g, '').replace(/[\/?=&#]/g, '_') || 'home');
const PROPS = ['display', 'color', 'backgroundColor', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign', 'borderTopWidth', 'borderTopStyle', 'borderTopColor', 'borderLeftWidth', 'borderLeftColor', 'borderBottomWidth', 'borderBottomColor', 'borderRightWidth', 'borderRadius', 'boxShadow', 'opacity', 'whiteSpace', 'textWrap', 'visibility', 'position', 'backgroundImage', 'fill', 'stroke'];
(async () => {
  const b = await chromium.launch(); let total = 0;
  for (const theme of themes) for (const w of widths) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 700 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: theme });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    for (const p of paths) {
      const key = `${slug(p)}__${w}__${theme}`;
      const snap = async (base, name) => { const page = await ctx.newPage(); await page.goto(base + p, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
        await page.evaluate(async (open) => { if (open) document.querySelectorAll('details').forEach(d => { d.open = true; }); const imgs = [...document.images]; imgs.forEach(i => { i.loading = 'eager'; }); await Promise.all(imgs.map(i => i.complete ? i.decode().catch(() => {}) : new Promise(r => { i.addEventListener('load', r); i.addEventListener('error', r); }).then(() => i.decode().catch(() => {})))); }, open);
        await page.waitForTimeout(450);
        const data = await page.evaluate(PROPS => { const roots = [...document.querySelectorAll('.topbar, .site-header, main > *, .site-footer')];
          const st = (el, pseudo) => { const cs = getComputedStyle(el, pseudo); if (pseudo && (cs.content === 'none' || cs.content === 'normal')) return ''; return PROPS.map(k => cs[k]).join('|') + (pseudo ? '|' + cs.content + '|' + cs.width + '|' + cs.height + '|' + cs.top + '|' + cs.left + '|' + cs.transform + '|' + cs.zIndex : ''); };
          const r1 = v => Math.round(v * 10) / 10;
          return { height: document.documentElement.scrollHeight, roots: roots.map(rt => { const o = rt.getBoundingClientRect();
            return { name: rt.tagName.toLowerCase() + (rt.id ? '#' + rt.id : '') + (typeof rt.className === 'string' && rt.className ? '.' + rt.className.trim().split(/\s+/).join('.') : ''), top: r1(o.top + scrollY), left: r1(o.left), w: r1(o.width), h: r1(o.height),
              els: [rt, ...rt.querySelectorAll('*')].filter(el => !el.closest('svg') || el.tagName.toLowerCase() === 'svg').map(el => { const rc = el.getBoundingClientRect(), pr = el === rt ? o : el.parentElement.getBoundingClientRect(); const hid = getComputedStyle(el).display === 'none' || !!el.closest('.sr-only, .hp');
                let depth = 0; for (let e = el; e !== rt; e = e.parentElement) depth++;
                return { d: depth, tag: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''), text: [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 26), hid, abs: [r1(rc.left - o.left), r1(rc.top - o.top), r1(rc.width), r1(rc.height)], rel: [r1(rc.left - pr.left), r1(rc.top - pr.top)], st: hid ? '' : st(el), bf: hid ? '' : st(el, '::before'), af: hid ? '' : st(el, '::after') }; }) }; }) }; }, PROPS);
        await page.screenshot({ path: path.join(out, `${key}__${name}.png`), fullPage: true }); await page.close(); return data; };
      let da, db; try { da = await snap(A, 'a'); db = await snap(B, 'b'); } catch (e) { console.log(key, 'ERROR', String(e).slice(0, 200)); continue; }
      const report = { key, heightA: da.height, heightB: db.height, roots: [] }; const lines = [];
      if (da.roots.length !== db.roots.length) lines.push(`  !! ${da.roots.length} bands in A, ${db.roots.length} in B`);
      da.roots.forEach((ra, i) => { const rb = db.roots[i]; if (!rb) return; const diffs = [];
        if (ra.els.length !== rb.els.length) { diffs.push({ kind: 'COUNT', what: `${ra.els.length} -> ${rb.els.length} elements`, a: [0, 0, ra.w, ra.h], b: [0, 0, rb.w, rb.h] }); }
        else { const moved = new Map();   // parent index path -> first mover reported
          const stack = [];
          ra.els.forEach((ea, j) => { const eb = rb.els[j]; if (ea.hid && eb.hid) return; const label = `${ea.tag}${ea.text ? ' "' + ea.text + '"' : ''}`;
            if (ea.hid !== eb.hid) { diffs.push({ kind: 'SHOWN', what: `${label}: ${ea.hid ? 'hidden -> shown' : 'shown -> hidden'}`, a: ea.abs, b: eb.abs }); return; }
            if (ea.abs[2] !== eb.abs[2] || ea.abs[3] !== eb.abs[3]) diffs.push({ kind: 'SIZE', what: `${label}: ${ea.abs[2]}x${ea.abs[3]} -> ${eb.abs[2]}x${eb.abs[3]}`, a: ea.abs, b: eb.abs, widthOnly: ea.abs[3] === eb.abs[3] });
            if (ea.rel[0] !== eb.rel[0] || ea.rel[1] !== eb.rel[1]) { // moved within its parent: report the first mover among siblings only
              while (stack.length && stack[stack.length - 1].d >= ea.d) stack.pop();
              const parentKey = stack.map(s => s.j).join('/');
              if (!moved.has(parentKey + '|' + ea.d)) { moved.set(parentKey + '|' + ea.d, 1); diffs.push({ kind: 'MOVE', what: `${label}: at ${ea.rel} -> ${eb.rel} in its parent`, a: ea.abs, b: eb.abs }); } }
            stack.push({ d: ea.d, j });
            for (const f of ['st', 'bf', 'af']) if (ea[f] !== eb[f]) { const pa = ea[f].split('|'), pb = eb[f].split('|'); const which = pa.map((v, n) => v !== pb[n] && !ignore.includes(n) ? `${PROPS[n] || 'pseudo' + n}: ${v} -> ${pb[n]}` : '').filter(Boolean).join('; '); if (which) diffs.push({ kind: 'STYLE', what: `${label}${f === 'bf' ? '::before' : f === 'af' ? '::after' : ''}: ${which}`.slice(0, 260), a: ea.abs, b: eb.abs }); } }); }
        if (ra.h !== rb.h && !diffs.length) diffs.push({ kind: 'SIZE', what: `band ${ra.h} -> ${rb.h}`, a: [0, 0, ra.w, ra.h], b: [0, 0, rb.w, rb.h] });
        if (diffs.length) { report.roots.push({ i, name: ra.name, a: { top: ra.top, left: ra.left, w: ra.w, h: ra.h }, b: { top: rb.top, left: rb.left, w: rb.w, h: rb.h }, diffs });
          const real = diffs.filter(d => !d.widthOnly); lines.push(`  [${i}] ${ra.name.slice(0, 60)}  (${ra.h} -> ${rb.h}px)  ${diffs.length} change(s)` + (diffs.length - real.length ? `, ${diffs.length - real.length} width-only` : ''));
          real.slice(0, +arg('max', '14')).forEach(d => lines.push(`      ${d.kind} ${d.what}`)); if (real.length > +arg('max', '14')) lines.push(`      ... ${real.length - +arg('max', '14')} more`); } });
      fs.writeFileSync(path.join(out, key + '.json'), JSON.stringify(report));
      console.log(`${key}: page ${da.height} -> ${db.height}px, ${report.roots.length} band(s) changed`); lines.forEach(l => console.log(l)); total += report.roots.length;
    }
    await ctx.close();
  }
  await b.close(); console.log(`\n${total} changed band(s) in all`);
})();
