// Held (html.js, script not yet run) height vs live height, 360..1920 step 40, every carousel on the page; also every item centred (does any caption exceed --cap and change the height?)
const { chromium, URL } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const bad = []; let n = 0;
  const arc = fs.readFileSync(__dirname + '/../arc.js', 'utf8'), spot = fs.readFileSync(__dirname + '/../spotlight.js', 'utf8');
  for (let w = 360; w <= 1920; w += 40) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } }); await ctx.route(/\/(arc|spotlight)\.js/, r => r.abort());
    const p = await ctx.newPage(); await p.goto(URL, { waitUntil: 'load' }); await p.waitForTimeout(350);
    const hs = () => p.evaluate(() => [...document.querySelectorAll('.kws-arc,.kws-spot')].map(e => Math.round(e.getBoundingClientRect().height * 10) / 10));
    const held = await hs(); await p.addScriptTag({ content: arc }); await p.addScriptTag({ content: spot }); await p.waitForTimeout(200); const live = await hs();
    // need per caption
    const caps = await p.evaluate(() => [...document.querySelectorAll('.kws-arc,.kws-spot')].map(el => { const capH = parseFloat(getComputedStyle(el.querySelector('[class$=-cap]')).minHeight); const need = [...el.querySelectorAll('[class$=-cap]')].map(c => { const k = [...c.children]; return Math.round(k[k.length - 1].getBoundingClientRect().bottom - c.getBoundingClientRect().top); }); return { held: capH, max: Math.max(...need), first: need[0] }; }));
    n++; const diff = held.map((h, i) => +(live[i] - h).toFixed(1));
    if (diff.some(d => Math.abs(d) > 0.5) || caps.some(c => c.max > c.held)) bad.push([w, 'held', held, 'live', live, 'caption need vs held', caps.map(c => `${c.max}/${c.held}${c.max > c.held ? (c.first === c.max ? ' (first item)' : ' (NOT first)') : ''}`)]);
    await ctx.close();
  }
  console.log(`${n} widths; mismatches or captions over the held height: ${bad.length}`); bad.forEach(x => console.log('  ', JSON.stringify(x)));
  await b.close();
})();
