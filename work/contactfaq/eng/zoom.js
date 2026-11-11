const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch();
  for (const path of ['/contact/', '/faq/']) for (const [w, h, fs] of [[320, 640, 100], [390, 844, 200], [720, 450, 100], [1280, 800, 200]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8720' + path, { waitUntil: 'load' });
    if (fs !== 100) await p.addStyleTag({ content: `html{font-size:${fs}% !important}` });
    if (path === '/contact/') { await p.fill('#name', 'Bartholomew-Wolfeschlegelsteinhausenbergerdorff the Third'); await p.fill('#message', 'Supercalifragilisticexpialidocious'.repeat(4)); await p.click('#submit-btn'); }
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const over = document.documentElement.scrollWidth - innerWidth; const poke = []; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || el.closest('.sr-only,.hp') || el.ownerSVGElement) continue; const rc = el.getBoundingClientRect(); if (rc.width && (rc.right > innerWidth + 1 || rc.left < -1)) poke.push(el.tagName.toLowerCase() + '.' + el.className.toString().slice(0, 30) + ' ' + Math.round(rc.left) + '..' + Math.round(rc.right)); }
      const clipped = []; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.display === 'none' || el.closest('.sr-only,.hp')) continue; if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1 && !/select|input|textarea/i.test(el.tagName)) clipped.push(el.tagName + '.' + el.className); }
      // label/opt overlap
      const ov = []; for (const o of document.querySelectorAll('.opt')) { const lab = o.parentElement; const range = document.createRange(); const tn = [...lab.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (!tn) continue; range.selectNodeContents(tn); const a = o.getBoundingClientRect(); for (const rc of range.getClientRects()) if (rc.left < a.right - 1 && rc.right > a.left + 1 && rc.top < a.bottom - 1 && rc.bottom > a.top + 1) ov.push(lab.textContent.trim().slice(0, 20)); }
      return { over, poke: poke.slice(0, 5), clipped: clipped.slice(0, 5), optOverlap: ov, h: document.documentElement.scrollHeight }; });
    console.log(path, `${w}px font ${fs}%`, JSON.stringify(r));
    await p.screenshot({ path: `${__dirname}/misc/zoom-${path.replace(/\//g, '')}-${w}-${fs}.png`, fullPage: true });
    await ctx.close();
  }
  await b.close();
})();
