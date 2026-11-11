// The fallback proposed for main.js, tried where the browser's own opening is bypassed (pushState does not scroll or open).
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' })).newPage();
    await p.goto('http://localhost:8720/services/'); await p.waitForTimeout(300);
    for (const id of ['ecommerce', 'google-reviews']) {
      const r = await p.evaluate(async id => {
        function openTarget() { var t = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1))); var d = t && t.closest('details'); if (d && !d.open) { d.open = true; t.scrollIntoView(); } }
        scrollTo(0, 0); history.pushState(null, '', '#' + id);
        const before = document.getElementById(id).closest('details').open; openTarget(); await new Promise(r => setTimeout(r, 600));
        const d = document.getElementById(id).closest('details'); return { before, open: d.open, nameTop: Math.round(d.querySelector('summary').getBoundingClientRect().top), headerBottom: Math.round(document.getElementById('site-header').getBoundingClientRect().bottom) };
      }, id);
      console.log(w, '#' + id, JSON.stringify(r));
    }
  }
  await b.close();
})();
