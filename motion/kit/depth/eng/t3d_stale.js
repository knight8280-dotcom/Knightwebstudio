// Drag quickly, then hold the pointer still for a second, then let go: does the old speed still fling it?
const { chromium, DEMO, log, ok, open, jump, cur, settle } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const p = await open(b, DEMO, { w: 1280, h: 900 });
  // ring
  await jump(p, '#included .kws-ring', -150); await p.waitForTimeout(900);
  const sb = await p.locator('#included .kws-ring-stage').boundingBox(); const y = sb.y + sb.height / 2;
  const ang = () => p.evaluate(() => +document.querySelector('#included .kws-ring-hub').style.transform.match(/rotateY\(([-\d.]+)deg\)$/)[1]);
  await p.mouse.move(sb.x + 450, y); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(sb.x + 450 - i * 25, y); await p.waitForTimeout(10); }
  const r0 = await p.evaluate(() => window.__raf); await p.waitForTimeout(1000); const r1 = await p.evaluate(() => window.__raf);
  const a0 = await ang(); await p.mouse.up(); await p.waitForTimeout(1800); const a1 = await ang();
  ok(Math.abs(a1 - a0) < 2, 'ring: drag, hold still for 1s, let go: it stays where it was put', `turned a further ${Math.abs(a1 - a0).toFixed(1)} degrees after release (${(Math.abs(a1 - a0) / 12).toFixed(1)} cards)`);
  ok(r1 - r0 < 5, 'ring: no frames asked for while the pointer is held still', `${r1 - r0} frames asked in 1s of holding still`);
  // cylinder
  await jump(p, '#how .kws-cyl'); await p.waitForTimeout(300);
  const cb = await p.locator('#how .kws-cyl-track').boundingBox(); const cy = cb.y + 250;
  await p.mouse.move(cb.x + 700, cy); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(cb.x + 700 - i * 20, cy); await p.waitForTimeout(8); }   // 120px = about a third of a card, fast
  await p.waitForTimeout(1000); const pos = await p.evaluate(() => document.querySelector('#how .kws-cyl-card').style.transform); await p.mouse.up(); await settle(p, '#how .kws-cyl');
  const on = await cur(p, '#how .kws-cyl');
  ok(on === 0, 'cylinder: drag a third of a card quickly, hold still for 1s, let go: it snaps back to the nearest card', `held at ${(pos.match(/rotateY\([^)]+\)/) || [pos])[0]} (17deg is one card); landed on step ${on + 1}`);
  await p.ctx.close(); await b.close();
})();
