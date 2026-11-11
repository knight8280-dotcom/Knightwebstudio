// Extra checks for /consulting/: no-JS rendering, keyboard order and focus rings, calculator on a small phone.
const { chromium } = require('playwright');
const URL = 'http://localhost:8720/consulting/';
const OUT = __dirname + '/shots/';
(async () => {
  const b = await chromium.launch();
  const block = ctx => ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());

  // 1. JavaScript off
  for (const [w, h, name] of [[390, 844, 'nojs-mobile'], [1440, 900, 'nojs-desktop']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: false, colorScheme: 'light' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('main *')) {
        const cs = getComputedStyle(el);
        if ((+cs.opacity < 1 || cs.visibility === 'hidden') && el.getBoundingClientRect().height > 0 && !el.closest('.sr-only')) bad.push(el.tagName + '.' + el.className + ' opacity ' + cs.opacity + ' ' + cs.visibility);
      }
      return { bad: bad.slice(0, 10), height: document.documentElement.scrollHeight, results: ['r-month', 'r-year', 'r-jobs', 'r-calls', 'r-quotes', 'r-hours', 'r-timeval', 'r-payback'].map(i => document.getElementById(i).textContent) };
    });
    console.log(name, JSON.stringify(r));
    await p.screenshot({ path: OUT + name + '.png', fullPage: true });
    await ctx.close();
  }

  // 2. Keyboard: tab through, record order, check a visible focus ring and that no stop is under the phone bar
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: 'light', reducedMotion: 'reduce' }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(600);
    const stops = []; let noRing = [], hidden = [];
    for (let i = 0; i < 90; i++) {
      await p.keyboard.press('Tab'); await p.waitForTimeout(120);
      const s = await p.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const cs = getComputedStyle(el); const rc = el.getBoundingClientRect();
        const bar = document.getElementById('mobile-cta'); const br = bar && getComputedStyle(bar).visibility !== 'hidden' && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect() : null;
        const sib = el.matches('input[type=checkbox]') ? null : null;
        return { tag: el.tagName.toLowerCase(), id: el.id, text: (el.textContent || el.value || '').trim().slice(0, 40), inMain: !!el.closest('main'), inFooter: !!el.closest('footer'),
          outline: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2) || (el.closest('.field-unit') && getComputedStyle(el.closest('.field-unit')).outlineStyle !== 'none' && parseFloat(getComputedStyle(el.closest('.field-unit')).outlineWidth) >= 2), top: Math.round(rc.top), bottom: Math.round(rc.bottom), vh: innerHeight,
          under: br && !bar.contains(el) ? rc.bottom > br.top + 1 && rc.top < br.bottom : false };
      });
      if (!s) continue;
      stops.push(s);
      if (!s.outline) noRing.push(s.tag + '#' + s.id + ' ' + s.text);
      if (s.under || s.top < 0 || s.bottom > s.vh) hidden.push(s.tag + ' "' + s.text + '" top ' + s.top + ' bottom ' + s.bottom);
      if (s.inFooter) break;
    }
    console.log(`\nkeyboard at ${w}px: ${stops.length} stops; without ring: ${noRing.length ? noRing.join(' | ') : 'none'}; off screen or under the bar: ${hidden.length ? hidden.join(' | ') : 'none'}`);
    if (process.env.LIST) console.log(stops.filter(s => s.inMain).map((s, i) => `${i + 1}.${s.tag}${s.id ? '#' + s.id : ''} "${s.text}"`).join('\n'));
    await ctx.close();
  }

  // 3. Calculator at 360px with long numbers: nothing overflows, inputs at least 44px, right keyboard
  {
    const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true }); await block(ctx);
    const p = await ctx.newPage(); await p.goto(URL); await p.waitForTimeout(500);
    await p.fill('#c-job', '125000'); await p.fill('#c-calls', '40'); await p.fill('#c-hours', '37.5');
    await p.waitForTimeout(100);
    const r = await p.evaluate(() => {
      const out = { inputs: [], over: [] };
      for (const el of document.querySelectorAll('#growth-calc input')) { const rc = el.getBoundingClientRect(); out.inputs.push(`${el.id} ${Math.round(rc.width)}x${Math.round(rc.height)} ${el.getAttribute('inputmode')} scroll ${el.scrollWidth > el.clientWidth ? 'CLIPPED' : 'ok'}`); }
      for (const el of document.querySelectorAll('#growth-calc *')) { const rc = el.getBoundingClientRect(); if (rc.right > innerWidth + .5) out.over.push(el.tagName + '.' + el.className); if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow === 'visible' && el.children.length === 0 && el.tagName !== 'INPUT') out.over.push('inner overflow ' + el.tagName + ' ' + el.textContent.slice(0, 30)); }
      out.month = document.getElementById('r-month').textContent; out.docW = document.documentElement.scrollWidth;
      const rcp = document.querySelector('#growth-calc .receipt').getBoundingClientRect(); out.receipt = [Math.round(rcp.left), Math.round(rcp.right)];
      const tot = document.querySelector('#growth-calc .receipt-total b').getBoundingClientRect(); out.total = [Math.round(tot.left), Math.round(tot.right)];
      return out;
    });
    console.log('\ncalculator at 360px:', JSON.stringify(r, null, 1));
    await p.locator('#growth-calc').screenshot({ path: OUT + 'calc-360-long.png' });
    await ctx.close();
  }
  await b.close();
})();
