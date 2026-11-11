// node test/sheet.js out.png cols cellWidth a.png b.png ... : a contact sheet of screenshots, each with its file name
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
(async () => {
  const [out, cols, cw, ...files] = process.argv.slice(2);
  const cells = files.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${path.basename(f, '.png')}</figcaption></figure>`).join('');
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: cols * (+cw + 12) + 12, height: 600 } });
  await p.setContent(`<style>body{margin:12px;background:#777;display:grid;grid-template-columns:repeat(${cols},${cw}px);gap:12px;font:12px sans-serif;color:#fff}figure{margin:0}img{width:100%;display:block}</style>${cells}`);
  await p.screenshot({ path: out, fullPage: true }); await b.close(); console.log(out);
})();
