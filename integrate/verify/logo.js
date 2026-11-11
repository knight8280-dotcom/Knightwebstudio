const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 420, height: 220 } });
  await p.setContent('<body style="margin:0;display:flex;gap:20px;padding:10px;background:#F6F0E4"><img src="http://localhost:8720/assets/img/logo.svg" width="200" height="200"><div style="background:#131722;padding:0"><img src="http://localhost:8720/assets/img/logo.svg" width="200" height="200"></div></body>');
  await p.waitForTimeout(500); await p.screenshot({ path: __dirname + '/crops/logo.png' }); await b.close(); })();
