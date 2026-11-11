const { chromium, open, S } = require('./lib.js');
const base = 'http://localhost:8720';
(async () => {
  const browser = await chromium.launch();
  for (const name of ['ok-paid', 'ok-ach', 'ok-unpaid']) {
    const { ctx, page } = await open(browser, S[name], 'd-light', { rm: 'reduce' });
    await page.goto(base + S[name].url); await page.waitForTimeout(900); await page.evaluate(() => document.fonts.ready);
    for (const mode of ['balance', 'wrap', 'pretty']) {
      const row = [];
      for (const w of [360, 390, 430, 600, 820, 979]) {
        await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(60);
        row.push(w + ': ' + await page.evaluate(mode => { const h = document.querySelector('h1'); h.style.textWrap = mode; const tn = h.firstChild; const r = document.createRange(); const lines = []; let top = null, cur = ''; for (let i = 0; i < tn.length; i++) { r.setStart(tn, i); r.setEnd(tn, i + 1); const rc = r.getClientRects()[0]; if (!rc) { cur += tn.data[i]; continue; } const t = Math.round(rc.top); if (top !== null && Math.abs(t - top) > 5) { lines.push(cur.trim()); cur = ''; } top = t; cur += tn.data[i]; } lines.push(cur.trim()); return lines.join(' / '); }, mode));
      }
      console.log(name, mode.padEnd(8), row.join(' | '));
    }
    await ctx.close();
  }
  await browser.close();
})();
