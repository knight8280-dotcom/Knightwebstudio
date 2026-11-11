// OB-01: legend widths on /contact/ and /consulting/; CSS=<file> serves that stylesheet instead of the site's
const { webkit, firefox, chromium } = require(process.env.PWCORE);
const fs = require('fs');
const eng = { webkit, firefox, chromium }[process.env.ENGINE || 'webkit'];
const css = process.env.CSS ? fs.readFileSync(process.env.CSS) : null;
(async () => {
  const b = await eng.launch();
  for (const [w, h, path] of [[390, 844, '/contact/'], [1280, 800, '/contact/'], [820, 1100, '/consulting/'], [1280, 800, '/consulting/'], [390, 844, '/consulting/']]) {
    const res = [];
    for (let i = 0; i < (+process.env.LOADS || 3); i++) {
      const ctx = await b.newContext({ viewport: { width: w, height: h } });
      await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
      if (css) await ctx.route(/styles\.css/, r => r.fulfill({ body: css, contentType: 'text/css' }));
      const p = await ctx.newPage();
      await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts && document.fonts.ready);
      await p.waitForTimeout(600);
      res.push(await p.evaluate(() => [...document.querySelectorAll('fieldset')].map(f => { const l = f.querySelector('legend'); if (!l) return '-'; const r = l.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; }).join(' ')));
      await ctx.close();
    }
    console.log(` ${w} ${path}: ` + [...new Set(res)].map(u => `x${res.filter(x => x === u).length} ${u}`).join(' | '));
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 300)); process.exit(1); });
