// OB-05 again with raw pointer events (Playwright's click() scrolls into view itself, which would be my artefact)
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE];
const BASE = process.env.BASE || 'http://localhost:8720';
(async () => {
  const b = await eng.launch();
  const run = async (w, h, label, fn, path = '/pricing/') => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 3000); }); await p.waitForTimeout(500);
    const ys = [await p.evaluate(() => Math.round(scrollY))];
    const mark = async () => { await p.waitForTimeout(700); ys.push(await p.evaluate(() => Math.round(scrollY))); };
    const rawClick = async sel => { const r = await p.evaluate(s => { const e = document.querySelector(s).getBoundingClientRect(); return [e.left + e.width / 2, e.top + e.height / 2]; }, sel); await p.mouse.click(r[0], r[1]); };
    let note = '';
    try { note = (await fn(p, rawClick, mark)) || ''; } catch (e) { note = 'ERR ' + String(e.message).slice(0, 120); }
    await mark();
    console.log(`  ${process.env.ENGINE} ${w}x${h} ${label}: scrollY ${ys.join(' -> ')} ${note}`);
    await ctx.close();
  };
  const menuOpen = p => p.evaluate(() => document.querySelector('#nav-toggle').getAttribute('aria-expanded'));
  await run(390, 844, 'menu: raw click open, Escape', async (p, c, mark) => { await c('#nav-toggle'); await mark(); const o = await menuOpen(p); await p.keyboard.press('Escape'); return `expanded=${o}->${await menuOpen(p)} focus=${await p.evaluate(() => document.activeElement.id)}`; });
  await run(1000, 800, 'menu: raw click open, Escape', async (p, c, mark) => { await c('#nav-toggle'); await mark(); await p.keyboard.press('Escape'); });
  await run(390, 844, 'menu: raw click open, raw click close', async (p, c, mark) => { await c('#nav-toggle'); await mark(); await c('#nav-toggle'); });
  await run(390, 844, 'menu: keyboard-only (focus() on toggle w/ preventScroll, Enter, Escape)', async (p, c, mark) => { await p.evaluate(() => document.querySelector('#nav-toggle').focus({ preventScroll: true })); await mark(); await p.keyboard.press('Enter'); await mark(); await p.keyboard.press('Escape'); });
  await run(1280, 800, 'raw click theme toggle', async (p, c) => { await c('#theme-toggle'); });
  await run(1280, 800, 'raw click theme toggle, then Tab', async (p, c, mark) => { await c('#theme-toggle'); await mark(); await p.keyboard.press('Tab'); return 'focus: ' + await p.evaluate(() => (document.activeElement.textContent || document.activeElement.id).trim().slice(0, 30)); });
  await run(1280, 800, 'raw click theme toggle, then Shift+Tab', async (p, c, mark) => { await c('#theme-toggle'); await mark(); await p.keyboard.press('Shift+Tab'); return 'focus: ' + await p.evaluate(() => (document.activeElement.textContent || document.activeElement.id).trim().slice(0, 30)); });
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
