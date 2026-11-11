const { open, done, close, shotEl } = require('./lib');
const path = require('path');
(async () => {
  let page = await open('/consulting/', 1280);
  await shotEl(page, '#calculator .receipt', path.join(__dirname, 'va08_consulting_1280_receipt.png'), 30);
  await done(page);
  // phone bar vs content + the lede "follow-/up" on consulting at 1280 / 1440 / 1920
  for (const w of [980, 1100, 1280, 1440, 1920]) {
    page = await open('/consulting/', w);
    const r = await page.evaluate(() => { const el = document.querySelector('.page-head .lede'); const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const n = tw.nextNode(); const t = n.textContent; const i = t.indexOf('follow-up'); const a = document.createRange(); a.setStart(n, i); a.setEnd(n, i + 7); const b = document.createRange(); b.setStart(n, i + 7); b.setEnd(n, i + 9); return { followTop: Math.round(a.getBoundingClientRect().top), upTop: Math.round(b.getBoundingClientRect().top) }; });
    console.log('lede follow-up', w, JSON.stringify(r), r.followTop !== r.upTop ? 'SPLIT' : 'ok');
    await done(page);
  }
  // hands-on at pricing
  for (const w of [1100, 1280, 1440]) {
    page = await open('/pricing/', w);
    const r = await page.evaluate(() => { const el = [...document.querySelectorAll('main p')].find(p => p.textContent.includes('hands-on work')); const n = el.firstChild; const t = n.textContent; const i = t.indexOf('hands-on'); const a = document.createRange(); a.setStart(n, i); a.setEnd(n, i + 6); const b = document.createRange(); b.setStart(n, i + 6); b.setEnd(n, i + 8); return { handsTop: Math.round(a.getBoundingClientRect().top), onTop: Math.round(b.getBoundingClientRect().top) }; });
    console.log('pricing hands-on', w, JSON.stringify(r), r.handsTop !== r.onTop ? 'SPLIT' : 'ok');
    await done(page);
  }
  // with nowrap fixes applied in the browser
  page = await open('/pricing/', 1440);
  await page.evaluate(() => { const wrap = (re) => { const tw = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n; const hits = []; while ((n = tw.nextNode())) if (re.test(n.textContent)) hits.push(n); hits.forEach(n => { const m = n.textContent.match(re); const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const s = document.createElement('span'); s.className = 'nowrap'; r.surroundContents(s); }); return hits.length; }; return [wrap(/10 days'/), wrap(/nothing lost\./), wrap(/hands-on/)]; });
  const r2 = await page.evaluate(() => [...document.querySelectorAll('main .nowrap')].filter(s => /10 days|nothing lost|hands-on/.test(s.textContent)).map(s => ({ t: s.textContent, rects: s.getClientRects().length, parentLastLine: (() => { const p = s.closest('p, li'); const rg = document.createRange(); rg.selectNodeContents(p); const rs = [...rg.getClientRects()]; return rs.length; })() })));
  console.log('nowrap applied', JSON.stringify(r2));
  await done(page);
  await close();
})();
