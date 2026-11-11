// From 980px the stage is sticky. Its "top" is measured once; what happens to the ring's angle when it is measured again (a resize) while stuck?
const { chromium, DEMO, log, ok, open, jump } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const p = await open(b, DEMO, { w: 1280, h: 800 });
  const ang = () => p.evaluate(() => +document.querySelector('#included .kws-ring-hub').style.transform.match(/rotateY\(([-\d.]+)deg\)$/)[1]);
  await jump(p, '#included .kws-ring', -700); await p.waitForTimeout(700);
  for (let i = 0; i < 50; i++) { await p.evaluate(() => scrollBy(0, 20)); await p.waitForTimeout(16); } await p.waitForTimeout(900);
  const stuck = await p.evaluate(() => { const st = document.querySelector('#included .kws-ring-stage'); return Math.round(st.getBoundingClientRect().top); });
  const a0 = await ang(); await p.setViewportSize({ width: 1262, height: 800 }); await p.waitForTimeout(1500); const a1 = await ang();
  ok(Math.abs(a1 - a0) < 1.5, 'sticky ring (1280px): a small window resize with no scrolling leaves the ring where it is', `stage top ${stuck}px (stuck at 88); angle ${a0} > ${a1}: turned ${Math.abs(a1 - a0).toFixed(1)} degrees by itself (${(Math.abs(a1 - a0) / 12).toFixed(1)} cards)`);
  await p.ctx.close(); await b.close();
})();
