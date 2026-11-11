// Where does the 404 page's button row take more than one line? Frozen copy against the repository.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [n, base] of [['prefold', 'http://localhost:8722'], ['repo', 'http://localhost:8720']]) {
    const p = await b.newPage();
    await p.goto(base + '/404.html');
    const wraps = [];
    for (let w = 360; w <= 1920; w += 10) {
      await p.setViewportSize({ width: w, height: 800 });
      await p.waitForTimeout(40);
      const r = await p.evaluate(() => {
        const k = [...document.querySelectorAll('.nf .btn-row > *')].map(e => Math.round(e.getBoundingClientRect().top));
        return new Set(k).size;
      });
      if (r > 1) wraps.push(w);
    }
    const runs = [];
    let s = null, prev = null;
    for (const w of wraps) {
      if (s === null) s = w;
      else if (w !== prev + 10) { runs.push(s + '-' + prev); s = w; }
      prev = w;
    }
    if (s !== null) runs.push(s + '-' + prev);
    console.log(n, '404 button row on more than one line at:', runs.join(', '));
    await p.close();
  }
  await b.close();
})();
