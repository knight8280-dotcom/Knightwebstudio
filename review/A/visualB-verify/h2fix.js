// node h2fix.js <path> <selector> <newInnerHTML|-> [css]
const { chromium } = require('playwright');
const linesSrc = require('fs').readFileSync(__dirname + '/lines.js', 'utf8');
const linesFn = linesSrc.slice(linesSrc.indexOf('const linesFn = ') + 16, linesSrc.indexOf('(async () =>')).trim().replace(/;$/, '');
(async () => {
  const [path, sel, html, css, shot] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(`http://localhost:8720${path}`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  if (html && html !== '-') await p.evaluate(([s, h]) => { document.querySelector(s).innerHTML = h; }, [sel, html]);
  if (css) await p.addStyleTag({ content: css });
  let prev = null, start = null, last = null;
  for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 800 }); const r = await p.evaluate(`(${linesFn})(${JSON.stringify(sel)}, 0)`); const of = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); const k = r.lines.join(' / ') + (of > 0 ? ' OVERFLOW' + of : ''); if (k !== prev) { if (prev) console.log(`  ${start}..${last}: ${prev}`); prev = k; start = w; console.log(`     @${w} fs=${r.fs} boxw=${r.w} linew=${r.widths.join(',')}`); } last = w; }
  console.log(`  ${start}..${last}: ${prev}`);
  if (shot) { const [w, f] = shot.split(':'); await p.setViewportSize({ width: +w, height: 844 }); const el = p.locator(sel).first(); await el.scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in', 'in', 'is-visible'))); await p.waitForTimeout(600); const bb = await el.boundingBox(); await p.screenshot({ path: f, clip: { x: 0, y: Math.max(0, bb.y - 120), width: +w, height: Math.min(844, bb.height + 300) } }); }
  await b.close();
})();
