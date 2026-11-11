const { webkit } = require(process.env.PWCORE || '/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await webkit.launch(); const p = await b.newPage(); await p.goto('http://localhost:8720/404.html'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const m = (fam, w, fvs) => { const s = document.createElement('span'); s.textContent = 'Hamburgefonstiv 0123456789 $1,500'; s.style.cssText = `position:absolute;left:-9999px;top:0;font-size:40px;white-space:nowrap;font-family:${fam};font-weight:${w};` + (fvs ? `font-variation-settings:${fvs};` : ''); document.body.appendChild(s); const x = Math.round(s.getBoundingClientRect().width * 10) / 10; s.remove(); return x; };
    return { ver: navigator.userAgent.match(/Version\/[\d.]+/)[0], fraunces: [100, 400, 600, 700, 900].map(w => m('"Fraunces", serif', w)), frauncesSOFT100_600: m('"Fraunces", serif', 600, '"SOFT" 100'), figtree: [300, 400, 600, 700, 800, 900].map(w => m('"Figtree", sans-serif', w)) };
  });
  console.log(JSON.stringify(r)); await b.close();
})();
