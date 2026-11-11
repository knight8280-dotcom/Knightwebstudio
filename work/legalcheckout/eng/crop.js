// crop the top part of several state screenshots into one row for quick viewing
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, h, ...files] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: +h } });
  const imgs = files.map(f => `<figure style="margin:0"><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}" style="display:block;max-height:${+h - 24}px;object-fit:cover;object-position:top;border:1px solid #999"><figcaption style="font:12px sans-serif">${f.split('/').pop()}</figcaption></figure>`).join('');
  await p.setContent(`<body style="margin:0;background:#888"><div style="display:flex;gap:8px;align-items:flex-start;height:${h}px;overflow:hidden">${imgs}</div>`);
  await p.screenshot({ path: out, fullPage: false }); await b.close();
})();
