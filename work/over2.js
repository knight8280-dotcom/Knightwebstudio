const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(process.argv[2]); await p.waitForTimeout(400);
  console.log(await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('body, body *')) { if (el.ownerSVGElement) continue; if (el.scrollWidth > 392 || el.offsetWidth > 392) out.push(el.tagName + '.' + (el.className.baseVal ?? el.className) + ' scrollW=' + el.scrollWidth + ' offW=' + el.offsetWidth); } return out.slice(0, 15).join('\n'); }));
  await b.close(); })();
