// Box-by-box before/after: "before" serves the saved copies in ./before for the stylesheet, the script and (when saved) the page.
// usage: ENGINE=chromium|firefox|webkit [PWCORE=...] node boxcmp.js "path|selector|w1,w2,..." ...
const pw = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
const eng = pw[process.env.ENGINE || 'chromium']; const fs = require('fs');
const B = __dirname + '/before/';
const H = +(process.env.H || 900);
const pageFile = { '/': 'index.html', '/pricing/': 'pricing.html' };
(async () => {
  const b = await eng.launch(); let diffs = 0, boxes = 0;
  for (const spec of process.argv.slice(2)) {
    const [path, sel, ws] = spec.split('|');
    for (const w of ws.split(',').map(Number)) {
      const snap = async (before) => {
        const ctx = await b.newContext({ viewport: { width: w, height: H }, colorScheme: process.env.SCHEME || 'light' });
        await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
        if (before) {
          await ctx.route('**/assets/css/styles.css*', r => r.fulfill({ contentType: 'text/css', body: fs.readFileSync(B + 'styles.css') }));
          await ctx.route('**/assets/js/main.js*', r => r.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(B + 'main.js') }));
          if (pageFile[path] && !process.env.SAMEHTML) await ctx.route(u => u.pathname === path, r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: fs.readFileSync(B + pageFile[path]) }));
        }
        const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
        if (process.env.NOREVEAL) await p.addStyleTag({ content: '.reveal,.reveal .seq{opacity:1!important;transform:none!important;transition:none!important}' });
        const r = await p.evaluate(s => { const root = document.querySelector(s); return [root, ...root.querySelectorAll('*')].filter(e => !e.closest('svg') || e.tagName === 'svg').map((e, i) => { const r = e.getBoundingClientRect(); return `${i}:${e.tagName}.${(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className || '').toString().split(' ')[0]}#${e.id} ${r.left.toFixed(1)},${(r.top + scrollY).toFixed(1)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; }); }, sel);
        r.push('docH ' + await p.evaluate(() => document.documentElement.scrollHeight));
        r.push('docW ' + await p.evaluate(() => document.documentElement.scrollWidth));
        await ctx.close(); return r;
      };
      const a = await snap(true), f = await snap(false); boxes += a.length;
      const n = Math.max(a.length, f.length); const d = [];
      for (let i = 0; i < n; i++) if (a[i] !== f[i]) d.push(`      ${a[i]}  ->  ${f[i]}`);
      if (d.length) { diffs += d.length; console.log(`    ${path} ${w}: ${d.length} boxes differ`); d.slice(0, +(process.env.SHOW || 6)).forEach(x => console.log(x)); }
    }
  }
  console.log(`  ${process.env.ENGINE || 'chromium'}: ${boxes} boxes compared, ${diffs} differ`);
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
