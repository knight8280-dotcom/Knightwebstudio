// node lines.js TOWN SELECTOR WIDTHS : the exact text of each rendered line of the first match
const { chromium } = require('playwright');
(async () => {
  const [town, sel, widths = '360,390,430,820,1024,1280,1440'] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await (await b.newContext({ reducedMotion: 'reduce' })).newPage();
  for (const w of widths.split(',')) {
    await p.setViewportSize({ width: +w, height: 900 }); await p.goto(`http://localhost:8720/web-design-${town}/`); await p.evaluate(() => document.fonts.ready);
    const r = await p.evaluate((sel) => [...document.querySelectorAll(sel)].map(el => {
      const lines = []; let last = null; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
      while (n = tw.nextNode()) for (let i = 0; i < n.nodeValue.length; i++) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const rc = r.getClientRects()[0]; if (!rc || !rc.width) continue; const y = Math.round(rc.top + rc.height / 2); if (last === null || Math.abs(y - last) > 6) lines.push(''); lines[lines.length - 1] += n.nodeValue[i]; last = y; }
      return lines.map(s => s.trim()).join(' / ') + '   [' + getComputedStyle(el).textWrap + ', ' + Math.round(el.getBoundingClientRect().width) + 'px]';
    }), sel);
    console.log(w, r.join('\n     '));
  }
  await b.close();
})();
