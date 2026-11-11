const { chromium } = require('playwright');
const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
const probe = () => { const name = e => e.tagName.toLowerCase() + (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).join('.') : '');
  const out = []; const over = document.documentElement.scrollWidth - innerWidth; if (over > 0) out.push('PAGE OVERFLOW +' + over);
  let worst = 0, who = ''; for (const el of document.querySelectorAll('main *')) { const cs = getComputedStyle(el); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none' || el.closest('.sr-only, thead, svg')) continue; const rc = el.getBoundingClientRect(); if (!rc.width || !rc.height) continue;
    const d = rc.right - innerWidth; if (d > worst + .5) { worst = d; who = name(el.parentElement) + ' > ' + name(el); }
    if (rc.left < -0.5 && !el.closest('.tilt')) out.push('LEFT CUT ' + name(el) + ' ' + Math.round(rc.left));
    // text overflowing its own box
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && cs.display !== 'inline') out.push('TEXT WIDER THAN BOX ' + name(el) + ` "${el.textContent.trim().slice(0, 24)}" ${el.scrollWidth}>${el.clientWidth}`);
    // child sticking out of parent card horizontally
    const par = el.closest('.card, .spec tr, .receipt, .payplan, td, th, .btn'); if (par && par !== el) { const pr = par.getBoundingClientRect(); if (rc.right > pr.right + 2 || rc.left < pr.left - 2) { if (!el.closest('.popular') && !/dots/.test(el.className)) out.push('STICKS OUT of ' + name(par) + ': ' + name(el) + ` "${el.textContent.trim().slice(0, 20)}" by ${Math.round(Math.max(rc.right - pr.right, pr.left - rc.left))}`); } }
  }
  if (worst > 0) out.push('PAST RIGHT EDGE +' + Math.round(worst) + ' ' + who);
  // button label lines
  const wrapped = [...document.querySelectorAll('main .btn')].filter(e => e.getBoundingClientRect().height > 80).map(e => e.textContent.trim().slice(0, 20) + ':' + Math.round(e.getBoundingClientRect().height));
  return { out: [...new Set(out)].slice(0, 25), H: document.documentElement.scrollHeight, tall: wrapped }; };
(async () => {
  const b = await chromium.launch();
  for (const [w, h, z] of [[390, 844, 200], [360, 740, 200], [1280, 800, 200], [1440, 900, 200], [820, 1100, 200], [390, 844, 150]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(z => { document.documentElement.style.fontSize = z + '%'; }, z); await p.waitForTimeout(400);
    const r = await p.evaluate(probe); console.log(`\n== ${w}px root font ${z}% ==  H=${r.H}`, r.tall.length ? 'very tall buttons: ' + r.tall.join(', ') : ''); console.log(r.out.length ? '  ' + r.out.join('\n  ') : '  clean');
    if ((w === 390 && z === 200) || (w === 1440)) { const H = r.H; let n = 0; for (let y = 0; y < Math.min(H, 9000); y += 3000) { n++; await p.screenshot({ path: `shots/zoom${z}-w${w}-${n}.png`, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(3000, H - y) } }); } }
    await ctx.close();
  }
  // browser zoom 200% at 1280 = 640 CSS px; 400% reflow (WCAG 1.4.10) at 1280 = 320px
  for (const w of [640, 320]) { const ctx = await b.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const r = await p.evaluate(probe); console.log(`\n== ${w}px (page zoom) ==  H=${r.H}`); console.log(r.out.length ? '  ' + r.out.join('\n  ') : '  clean');
    if (w === 320) await p.screenshot({ path: 'shots/w320-top.png', fullPage: true, clip: { x: 0, y: 0, width: 320, height: 3000 } });
    await ctx.close(); }
  // long words
  { const ctx = await b.newContext({ viewport: { width: 360, height: 800 }, reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto('http://localhost:8720/pricing/', { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => { const L = 'Donaudampfschifffahrtsgesellschaftskapitaensmuetze';
      document.querySelector('.spec tbody tr td:nth-child(3)').append(' ' + L); document.querySelector('.spec tbody tr td:nth-child(7) li').append(' ' + L); document.querySelector('.pl-name').append(' ' + L); document.querySelector('.table-stack tbody td').append(' ' + L); document.querySelector('.toc-name').append(' ' + L); document.querySelector('.ticks li').append(' ' + L); document.querySelector('.receipt-lines li span').append(' ' + L); });
    await p.waitForTimeout(200); const r = await p.evaluate(probe); console.log('\n== long word injected at 360 =='); console.log(r.out.length ? '  ' + r.out.join('\n  ') : '  clean');
    await ctx.close(); }
  await b.close();
})();
