// OB-01 on the real pages: legend boxes on /contact/ and /consulting/, several loads, cropped screenshot of the fieldset
const { webkit } = require(process.env.PWCORE);
const BASE = process.env.BASE || 'http://localhost:8720';
const tag = process.env.TAG || 'new';
(async () => {
  const b = await webkit.launch();
  const ua = await (async () => { const p = await b.newPage(); const u = await p.evaluate(() => navigator.userAgent); await p.close(); return u; })();
  console.log((ua.match(/Version\/[\d.]+/) || [ua])[0], BASE);
  for (const [w, h] of [[390, 844], [820, 1100], [1280, 800]]) {
    for (const path of ['/contact/', '/consulting/']) {
      const res = [];
      for (let i = 0; i < 4; i++) {
        const ctx = await b.newContext({ viewport: { width: w, height: h } });
        await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
        const p = await ctx.newPage();
        await p.goto(BASE + path, { waitUntil: 'load' });
        await p.evaluate(() => document.fonts && document.fonts.ready);
        await p.waitForTimeout(700);
        const m = await p.evaluate(() => [...document.querySelectorAll('fieldset')].map(f => { const l = f.querySelector('legend'); if (!l) return 'nolegend'; const r = l.getBoundingClientRect(), fr = f.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}/${Math.round(fr.width)}x${Math.round(fr.height)}[${getComputedStyle(f).display}]`; }).join(' '));
        res.push(m);
        if (i === 0 && process.env.SHOTS) {
          const f = await p.$('fieldset');
          await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'start' }); window.scrollBy(0, -120); });
          await p.waitForTimeout(500);
          await p.screenshot({ path: `shots/${tag}_${process.env.PWLABEL}_${w}_${path.replace(/\//g, '')}.png` });
          const m2 = await p.evaluate(() => [...document.querySelectorAll('fieldset')].map(f => { const l = f.querySelector('legend'); const r = l.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}`; }).join(' '));
          if (m2 !== m.replace(/\/\S+/g, '')) console.log('    after screenshot:', m2);
        }
        await ctx.close();
      }
      const uniq = [...new Set(res)];
      console.log(` ${w} ${path}`); for (const u of uniq) console.log(`    x${res.filter(x => x === u).length}: ${u}`);
    }
  }
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 600)); process.exit(1); });
