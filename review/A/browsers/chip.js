const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const eng of (process.env.ENGINES || 'firefox,webkit,chromium').split(',')) {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const b = await pw[eng].launch(); const ctx = await b.newContext({ viewport: vp, hasTouch: vp.width < 500 });
      await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
      const p = await ctx.newPage(); await p.goto('http://localhost:8720/contact/'); await p.waitForTimeout(600);
      const res = [];
      for (const v of ['New website', 'Automation', 'Google reviews']) {
        const loc = p.locator(`input[name="services"][value="${v}"]`);
        await loc.scrollIntoViewIfNeeded(); await p.waitForTimeout(200);
        const info = await loc.evaluate(el => { const r = el.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y); return { x, y, w: r.width, h: r.height, hit: hit ? hit.tagName + '.' + hit.className + (hit === el ? ' (the input)' : '') : null, pe: getComputedStyle(el).pointerEvents, op: getComputedStyle(el).opacity, inert: !!el.closest('[inert]'), checked: el.checked }; });
        if (vp.width < 500) await p.touchscreen.tap(info.x, info.y); else await p.mouse.click(info.x, info.y);
        await p.waitForTimeout(150);
        const after = await loc.evaluate(el => el.checked);
        const bg = await loc.evaluate(el => getComputedStyle(el.nextElementSibling).backgroundColor);
        res.push(`${v}: hit=${info.hit} ${Math.round(info.w)}x${Math.round(info.h)} inert=${info.inert} -> checked=${after} span bg=${bg}`);
      }
      console.log(eng, vp.width, '\n   ' + res.join('\n   '));
      await b.close();
    }
  }
})();
