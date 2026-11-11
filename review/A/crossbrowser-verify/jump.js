// OB-05: does focusing a control in the sticky header while scrolled move the page?
const pw = require(process.env.PWCORE); const eng = pw[process.env.ENGINE];
const BASE = process.env.BASE || 'http://localhost:8720';
(async () => {
  const b = await eng.launch();
  const run = async (w, h, label, fn, path = '/pricing/') => {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(400);
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 3000); }); await p.waitForTimeout(500);
    const y0 = await p.evaluate(() => Math.round(scrollY));
    let note = '';
    try { note = (await fn(p)) || ''; } catch (e) { note = 'ERR ' + String(e.message).slice(0, 120); }
    await p.waitForTimeout(900);
    const y1 = await p.evaluate(() => Math.round(scrollY));
    console.log(`  ${process.env.ENGINE} ${w}x${h} ${label}: scrollY ${y0} -> ${y1} (${y1 - y0}) ${note}`);
    await ctx.close();
  };
  // 1. phone-width: click the menu button (mouse), then Escape
  await run(390, 844, 'menu open by click, close by Escape', async p => { await p.click('#nav-toggle'); await p.waitForTimeout(500); const y = await p.evaluate(() => Math.round(scrollY)); await p.keyboard.press('Escape'); return `(after open ${y})`; });
  await run(1000, 800, 'menu open by click, close by Escape', async p => { await p.click('#nav-toggle'); await p.waitForTimeout(500); await p.keyboard.press('Escape'); });
  // 2. click the menu button twice
  await run(390, 844, 'menu open by click, close by click', async p => { await p.click('#nav-toggle'); await p.waitForTimeout(500); await p.click('#nav-toggle'); });
  // 3. desktop: click theme toggle with the mouse
  await run(1280, 800, 'click theme toggle', async p => { await p.click('#theme-toggle'); });
  // 4. desktop: click theme toggle, then press Tab (focus moves to next header control)
  await run(1280, 800, 'click theme toggle then Tab', async p => { await p.click('#theme-toggle'); await p.waitForTimeout(300); await p.keyboard.press('Tab'); return await p.evaluate(() => 'focus on: ' + (document.activeElement.textContent || document.activeElement.id).trim().slice(0, 30)); });
  await run(1280, 800, 'click theme toggle then Shift+Tab', async p => { await p.click('#theme-toggle'); await p.waitForTimeout(300); await p.keyboard.press('Shift+Tab'); return await p.evaluate(() => 'focus on: ' + (document.activeElement.textContent || document.activeElement.id).trim().slice(0, 30)); });
  // 5. desktop: click in page text at 3000 then Shift+Tab (where does focus go?)
  await run(1280, 800, 'click on text then Shift+Tab', async p => { await p.mouse.click(640, 400); await p.keyboard.press('Shift+Tab'); return await p.evaluate(() => 'focus on: ' + (document.activeElement.tagName + ' ' + (document.activeElement.textContent || '')).trim().slice(0, 40) + ' inHeader=' + !!document.activeElement.closest('header')); });
  await b.close();
})().catch(e => { console.log('ERR', String(e.message).slice(0, 800)); process.exit(1); });
