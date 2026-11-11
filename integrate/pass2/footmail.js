// The footer email link: its box and line count at many widths, in two copies of the site.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/faq/', '/start/', '/404.html']) {
    const res = {};
    for (const [n, base] of [['start', 'http://localhost:8726'], ['now', 'http://localhost:8720']]) {
      const ctx = await b.newContext({ viewport: { width: 320, height: 800 }, reducedMotion: 'reduce' });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto(base + path, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
      res[n] = [];
      for (let w = 320; w <= 1920; w += 10) {
        await p.setViewportSize({ width: w, height: 800 }); await p.waitForTimeout(40);
        res[n].push(await p.evaluate(() => { const a = document.querySelector('.site-footer a[href^="mailto:"]'); const r = a.getBoundingClientRect(); const tw = document.createTreeWalker(a, NodeFilter.SHOW_TEXT); const tops = new Set(); let widest = 0; while (tw.nextNode()) { const range = document.createRange(); range.selectNodeContents(tw.currentNode); for (const q of range.getClientRects()) if (q.width > 1) { tops.add(Math.round(q.top)); widest = Math.max(widest, q.right); } } const foot = document.querySelector('.site-footer').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top - foot.top), Math.round(r.width), Math.round(r.height), tops.size, Math.round(foot.height)].join(','); }));
      }
      await ctx.close();
    }
    const diffs = [], two = [];
    res.now.forEach((v, i) => { if (v !== res.start[i]) diffs.push((320 + i * 10) + ': ' + res.start[i] + ' -> ' + v); if (+v.split(',')[4] > 1) two.push(320 + i * 10); });
    console.log(path, 'email link differs from the start of this pass at', diffs.length, 'widths', diffs.slice(0, 6).join(' | '), '; on more than one line now at', two.length ? two[0] + '..' + two[two.length - 1] + ' (' + two.length + ' widths)' : 'no width');
  }
  await b.close();
})();
