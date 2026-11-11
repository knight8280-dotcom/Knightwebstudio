// A11Y-10: where does a 303x78 captcha box end up in the contact form at narrow widths?
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [base, label] of [['http://localhost:8720', 'new'], ['http://localhost:8700', 'old']]) for (const w of [320, 340, 360, 375, 380, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 700 } });
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|web3forms/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(base + '/contact/', { waitUntil: 'load' });
    const m = await p.evaluate(() => {
      const slot = document.getElementById('hcaptcha-slot');
      // what hCaptcha injects: an iframe 303x78 (normal size)
      const f = document.createElement('iframe'); f.style.cssText = 'width:303px;height:78px;border:0;background:#888;display:block'; f.title = 'stand-in'; slot.appendChild(f);
      const fr = f.getBoundingClientRect(), sr = slot.getBoundingClientRect();
      const form = slot.closest('form'); const fcs = getComputedStyle(form); const frm = form.getBoundingClientRect();
      // find the card: nearest ancestor with a border or background different from body
      let card = slot.parentElement; while (card && card !== document.body) { const cs = getComputedStyle(card); if (parseFloat(cs.borderRightWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== getComputedStyle(document.body).backgroundColor)) break; card = card.parentElement; }
      const cr = card.getBoundingClientRect(); const ccs = getComputedStyle(card);
      // clipped by any ancestor?
      let clip = null; for (let e = slot; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (/hidden|clip|auto|scroll/.test(cs.overflowX)) { clip = e.tagName + '.' + e.className + ' ' + cs.overflowX + ' right=' + Math.round(e.getBoundingClientRect().right); break; } }
      return { boxRight: Math.round(fr.right), boxLeft: Math.round(fr.left), boxW: Math.round(fr.width), slotTransform: getComputedStyle(slot).transform, card: card.tagName + '.' + card.className, cardRight: Math.round(cr.right), cardInnerRight: Math.round(cr.right - parseFloat(ccs.paddingRight) - parseFloat(ccs.borderRightWidth)), vw: innerWidth, scrollW: document.documentElement.scrollWidth, clip };
    });
    console.log(label, w, JSON.stringify(m));
    if (label === 'new' && (w === 320 || w === 360)) { await p.locator('#hcaptcha-slot').scrollIntoViewIfNeeded(); await p.waitForTimeout(500); await p.screenshot({ path: `shots/v10_captcha_${w}.png` }); }
    await ctx.close();
  }
  await b.close();
})();
