const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 360, height: 900 } });
  await p.goto('http://localhost:8730/kit/flat/demo.html', { waitUntil: 'load' }); await p.waitForTimeout(300);
  await p.addStyleTag({ content: 'html{font-size:20px}' }); await p.waitForTimeout(300);
  console.log(JSON.stringify(await p.evaluate(() => { const arc = document.querySelector('.kws-arc'); const list = arc.querySelector('ul').getBoundingClientRect();
    return { list: [list.left, list.right], inner: innerWidth, doc: document.documentElement.scrollWidth, tiles: [...arc.querySelectorAll('.kws-arc-tile')].filter(t => getComputedStyle(t).visibility !== 'hidden').map(t => { const r = t.getBoundingClientRect(); return [t.textContent.trim(), Math.round(r.left), Math.round(r.right), t.offsetWidth, getComputedStyle(t).fontSize, t.style.transform]; }) }; })));
  await p.screenshot({ path: 's/root20.png' });
  await b.close();
})();
