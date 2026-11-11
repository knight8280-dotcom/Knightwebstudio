const { chromium } = require('playwright');
const linesSrc = require('fs').readFileSync(__dirname + '/lines.js', 'utf8');
const linesFn = linesSrc.slice(linesSrc.indexOf('const linesFn = ') + 16, linesSrc.indexOf('(async () =>')).trim().replace(/;$/, '');
const CSS = '@media (max-width:599.98px){[data-page="city"] .page-head .eyebrow .sep{display:none}[data-page="city"] .page-head .eyebrow .sep + span{display:block}}';
(async () => {
  const b = await chromium.launch();
  for (const c of ['baton-rouge', 'denham-springs', 'gonzales', 'prairieville']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(`http://localhost:8720/web-design-${c}/`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const measure = async (tag) => {
      const out = [];
      for (const [w, h] of [[360, 740], [375, 667], [390, 844], [393, 852], [430, 932]]) {
        await p.setViewportSize({ width: w, height: h });
        await p.waitForTimeout(80);
        const r = await p.evaluate(`(() => { const L = (${linesFn})('.page-head .eyebrow', 0); const bb = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().bottom) : null; }; const tt = s => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top) : null; };
          return { eb: L.lines.join(' / '), h1b: bb('.page-head h1'), ledeB: bb('.page-head .lede'), btnB: bb('.page-head .btn'), headB: bb('.page-head'), mcta: tt('#mobile-cta'), docH: document.documentElement.scrollHeight }; })()`);
        out.push(`${w}x${h} ${JSON.stringify(r)}`);
      }
      console.log(`== ${c} ${tag}\n` + out.join('\n'));
    };
    await measure('before');
    await p.setViewportSize({ width: 390, height: 844 }); await p.screenshot({ path: `city-${c}-390-before.png` });
    await p.evaluate(() => { const e = document.querySelector('.page-head .eyebrow'); const m = e.textContent.match(/^(.*?)\s*·\s*(.*)$/); e.innerHTML = `<span><span class="nowrap">${m[1]}</span><span class="sep"> · </span><span class="nowrap">${m[2]}</span></span>`; });
    await p.addStyleTag({ content: CSS });
    await measure('after');
    await p.setViewportSize({ width: 390, height: 844 }); await p.screenshot({ path: `city-${c}-390-after.png` });
    // wide sweep after
    let prev = null, start = null, last = null;
    for (let w = 320; w <= 1920; w += 4) { await p.setViewportSize({ width: w, height: 800 }); const r = await p.evaluate(`(${linesFn})('.page-head .eyebrow', 0)`); const k = r.lines.join(' / '); if (k !== prev) { if (prev) console.log(`  ${start}..${last}: ${prev}`); prev = k; start = w; } last = w; }
    console.log(`  ${start}..${last}: ${prev}`);
    await ctx.close();
  }
  await b.close();
})();
