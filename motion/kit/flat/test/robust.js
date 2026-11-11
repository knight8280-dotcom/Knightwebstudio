// Things a client site might do to it: long unbroken words, a long address, a larger default font, many items, a missing part.
const { chromium, say, done, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const over = p => p.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth);
  // 1. long words and a long address
  for (const w of [360, 390, 1280]) {
    const { ctx, p } = await open(b, { viewport: { width: w, height: 900 } }, 'test/bare.html');
    await p.evaluate(() => { document.querySelector('.kws-arc-name').textContent = 'Donaudampfschifffahrtsgesellschaftskapitaensmuetze'; document.querySelector('.kws-arc-line').textContent = 'Supercalifragilisticexpialidociouslylongwordwithoutanybreakatall and then some more.';
      document.querySelector('.kws-spot-name').textContent = 'Rindfleischetikettierungsueberwachungsaufgabenuebertragungsgesetz'; document.querySelector('.kws-spot-bar span').textContent = 'a-very-long-subdomain.of-an-even-longer-domain-name.example-business-site.com'; });
    await p.waitForTimeout(200);
    const dots = await p.evaluate(() => [...document.querySelectorAll('.kws-spot-bar i')].slice(0, 3).map(i => Math.round(i.getBoundingClientRect().width * 10) / 10));
    const bar = await p.evaluate(() => { const s = document.querySelector('.kws-spot-bar span').getBoundingClientRect(), f = document.querySelector('.kws-spot-frame').getBoundingClientRect(); return Math.round(s.right - f.right); });
    say(`${w}px: 50 to 80 letter words and an 80 letter address cause no sideways scroll; the browser dots keep their size; the address stays inside its frame`, await over(p) <= 0 && dots.every(d => d >= 7.9) && bar < 0, `page wider than window by ${await over(p)}px; dots ${dots.join(',')}px; address ends ${-bar}px inside the frame`);
    if (w !== 390) await p.screenshot({ path: `${__dirname}/../shots/robust-long-words-${w}.png` });
    await ctx.close();
  }
  // 2. a larger default font size (the browser setting, not zoom)
  for (const [root, w] of [[20, 360], [24, 390], [24, 430], [32, 390]]) {
    const { ctx, p } = await open(b, { viewport: { width: w, height: 900 } });
    await p.addStyleTag({ content: `html{font-size:${root}px}` }); await p.waitForTimeout(250);
    const r = await p.evaluate(() => { const arc = document.querySelector('.kws-arc'); const tiles = [...arc.querySelectorAll('.kws-arc-tile')].filter(t => getComputedStyle(t).visibility !== 'hidden');
      return { poke: Math.round(Math.max(...tiles.map(t => t.getBoundingClientRect().right)) - innerWidth), showing: tiles.length, ctl: Math.round(arc.querySelector('.kws-arc-ctl').getBoundingClientRect().height) }; });
    say(`default font ${root}px at ${w}px wide: no sign past the window edge, no sideways scroll, controls on one row`, r.poke <= 0 && await over(p) <= 0 && r.ctl <= 48, `${r.showing} signs showing, nearest edge ${-r.poke}px inside, control row ${r.ctl}px tall`);
    if (root === 24 && w === 390) await p.screenshot({ path: `${__dirname}/../shots/robust-root-font-24px-390.png` });
    await ctx.close();
  }
  // 3. many items: the control row is always one row, so the held space is always right
  for (const w of [360, 390, 1280]) {
    const { ctx, p } = await open(b, { viewport: { width: w, height: 900 } });
    const r = await p.evaluate(async () => { const out = [];
      for (const [name, sel, count] of [['arc', '#services .kws-arc', 12], ['arc', '#services .kws-arc', 30], ['spotlight', '#work .kws-spot', 5], ['spotlight', '#work .kws-spot', 12]]) {
        const el = document.querySelector(sel); KWS[name].mount(el)(); const ul = el.querySelector('ul'), lis = [...ul.children];
        while (ul.children.length > count) ul.lastElementChild.remove(); for (let i = 0; ul.children.length < count; i++) ul.append(lis[i % lis.length].cloneNode(true));
        document.documentElement.classList.add('kws-hold'); const held = el.getBoundingClientRect().height; document.documentElement.classList.remove('kws-hold');
        KWS[name].mount(el); await new Promise(r => setTimeout(r, 80)); const ctl = el.querySelector('[class$="-ctl"]');
        out.push({ name, count, row: Math.round(ctl.getBoundingClientRect().height), dots: ctl.querySelectorAll('[class$="-dot"]').length, counter: (ctl.querySelector('[class$="-n"]') || {}).textContent || '', held: Math.round(held), live: Math.round(el.getBoundingClientRect().height),
          wide: Math.round(Math.max(...[...ctl.children].map(c => c.getBoundingClientRect().right)) - Math.min(...[...ctl.children].map(c => c.getBoundingClientRect().left))), room: Math.round(ul.clientWidth) });
      } return out; });
    for (const x of r) say(`${w}px ${x.name} with ${x.count} items: controls on one 44px row that fits, ${x.dots ? x.dots + ' dots' : 'a count ("' + x.counter + '")'}; height held before the script equals height after`, x.row === 44 && x.wide <= x.room && x.held === x.live, `row ${x.wide}px of ${x.room}px; held ${x.held}px, live ${x.live}px`);
    await ctx.close();
  }
  // 4. a missing part: mount does nothing, throws nothing, and leaves the plain list alone
  { const { ctx, p, errs } = await open(b);
    const r = await p.evaluate(() => { const out = {};
      for (const [name, sel, part] of [['arc', '#client .kws-arc', '.kws-arc-tile'], ['arc', '#client .kws-arc', '.kws-arc-cap'], ['spotlight', '#client .kws-spot', '.kws-spot-frame'], ['spotlight', '#client .kws-spot', '.kws-spot-cap']]) {
        const el = document.querySelector(sel); KWS[name].mount(el)(); const copy = el.cloneNode(true); el.after(copy); [...copy.querySelectorAll(part)].pop().remove(); const before = copy.outerHTML;
        let threw = ''; try { const off = KWS[name].mount(copy); off(); } catch (e) { threw = String(e); }
        out[name + ' without one ' + part] = { threw, untouched: copy.outerHTML === before, live: copy.classList.contains('is-live') }; copy.remove(); KWS[name].mount(el);
      } return out; });
    for (const k in r) say(`${k}: mount does nothing and throws nothing`, !r[k].threw && r[k].untouched && !r[k].live, r[k].threw);
    say('no console errors', errs.length === 0, errs.join('|')); await ctx.close(); }
  await done(b);
})();
