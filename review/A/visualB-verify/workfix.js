const { chromium } = require('playwright');
const linesSrc = require('fs').readFileSync(__dirname + '/lines.js', 'utf8');
const linesFn = linesSrc.slice(linesSrc.indexOf('const linesFn = ') + 16, linesSrc.indexOf('(async () =>')).trim().replace(/;$/, '');
const CSS = '@media (max-width:1279.98px){[data-page="work"] .case .eyebrow .sep{display:none}[data-page="work"] .case .eyebrow .sep + span{display:block}}';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(`http://localhost:8720/work/`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const h0 = {}; for (const w of [360, 390, 820, 1100, 1280, 1440]) { await p.setViewportSize({ width: w, height: 844 }); h0[w] = await p.evaluate(() => document.documentElement.scrollHeight); }
  await p.evaluate(() => document.querySelectorAll('.case .eyebrow').forEach(e => { const m = e.textContent.match(/^(.*?)\s*·\s*(.*)$/); const esc = s => s.replace(/&/g, '&amp;'); e.innerHTML = `<span><span class="nowrap">${esc(m[1])}</span><span class="sep"> · </span><span class="nowrap">${esc(m[2])}</span></span>`; }));
  await p.addStyleTag({ content: CSS });
  for (const i of [0, 1, 2]) {
    let prev = null, start = null, last = null;
    for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 800 }); const r = await p.evaluate(`(${linesFn})('.case .eyebrow', ${i})`); const k = r.lines.join(' / ') + (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth ? ' OVERFLOW' : '')); if (k !== prev) { if (prev) console.log(`  ${start}..${last}: ${prev}`); prev = k; start = w; } last = w; }
    console.log(`  ${start}..${last}: ${prev}`);
  }
  for (const w of [360, 390, 820, 1100, 1280, 1440]) { await p.setViewportSize({ width: w, height: 844 }); const h = await p.evaluate(() => document.documentElement.scrollHeight); console.log(w, 'page height', h0[w], '->', h); }
  await b.close();
})();
