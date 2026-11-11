const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.route(/plausible|onrender|calendly/, r => r.abort());
  const titles = ['Thank you', 'Payment confirmed — thank you', 'Thank you — your bank payment is processing', 'Your payment wasn’t completed'];
  for (const w of [360, 390, 430, 600, 700, 820, 960, 980, 1024, 1100, 1280, 1440]) { await p.setViewportSize({ width: w, height: 900 }); await p.goto('http://localhost:8720/checkout/success/');
    for (const mode of ['balance', 'pretty', 'wrap']) { const out = [];
      for (const t of titles) out.push(await p.evaluate(([t, mode]) => { const h = document.getElementById('success-title'); h.textContent = t; h.style.textWrap = mode;
        const r = document.createRange(), n = h.firstChild; const lines = []; let last = null, cur = '';
        for (let i = 0; i < t.length; i++) { r.setStart(n, i); r.setEnd(n, i + 1); const y = Math.round(r.getBoundingClientRect().top); if (last !== null && Math.abs(y - last) > 5 && t[i] !== ' ') { lines.push(cur.trim()); cur = ''; } if (t[i] !== ' ' ) last = y; cur += t[i]; } lines.push(cur.trim()); return lines.join(' / '); }, [t, mode]));
      console.log(w, mode.padEnd(8), out.slice(1).join('   |   ')); } }
  await b.close(); })();
