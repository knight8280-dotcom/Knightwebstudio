const { chromium, BASE, PAGES, ctxFor } = require('./lib');
const act = `(()=>{const e=document.activeElement;const r=e.getBoundingClientRect();return (e.tagName+' "'+(e.getAttribute('aria-label')||e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,40)+'" y='+Math.round(r.top)+' in='+(e.closest('main')?'main':e.closest('.site-header')?'header':e.closest('.topbar')?'topbar':e.closest('footer')?'footer':e.closest('.mobile-cta')?'phonebar':'other'));})()`;
(async () => {
  const b = await chromium.launch();
  // 1. skip link on every page
  for (const w of [390, 1280]) { const bad = [];
    for (const path of PAGES) { const ctx = await ctxFor(b, { w, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(250);
      await p.keyboard.press('Tab'); const first = await p.evaluate(act); const vis = await p.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return r.top >= 0 && r.left >= 0 && r.width > 20; });
      await p.keyboard.press('Enter'); await p.waitForTimeout(250); const sy = await p.evaluate(() => scrollY); await p.keyboard.press('Tab'); await p.waitForTimeout(100); const after = await p.evaluate(act);
      const ok = /Skip to content/.test(first) && vis && /in=main/.test(after);
      if (!ok || path === '/' || path === '/contact/') console.log(`skip ${path} @${w}: first=${first} visible=${vis} scrollY-after=${sy} next-tab=${after} ${ok ? 'OK' : 'PROBLEM'}`); if (!ok) bad.push(path);
      await ctx.close(); }
    console.log(`skip link @${w}: problems on ${bad.length} pages ${bad.join(',')}`); }
  // 2. phone menu by keyboard, at top and scrolled
  for (const scrolled of [false, true]) { const ctx = await ctxFor(b, { w: 390, h: 844, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/pricing/'); await p.waitForTimeout(300);
    if (scrolled) { await p.evaluate(() => scrollTo(0, 1500)); await p.waitForTimeout(400); }
    await p.focus('#nav-toggle'); await p.keyboard.press('Enter'); await p.waitForTimeout(400);
    console.log(`\nmenu (scrolled=${scrolled}) opened: expanded=${await p.getAttribute('#nav-toggle', 'aria-expanded')} label=${await p.getAttribute('#nav-toggle', 'aria-label')} focus=${await p.evaluate(act)}`);
    const seq = []; for (let i = 0; i < 18; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(50); seq.push(await p.evaluate(act)); }
    console.log('   tab order: ' + seq.map(s => s.replace(/ y=.*$/, '').replace(/^A |^BUTTON /, '')).join(' > '));
    const hid = await p.evaluate(() => { const r = []; for (const el of document.querySelectorAll('#nav a')) { const b = el.getBoundingClientRect(); const ni = document.querySelector('.nav-inner').getBoundingClientRect(); r.push(Math.round(b.bottom) > Math.round(ni.bottom) + 1 || b.top < ni.top - 1 ? 'needs-scroll' : 'in-view'); } return r.join(','); });
    console.log('   items: ' + hid + ' ; bar class: ' + await p.evaluate(() => document.getElementById('mobile-cta').className + ' inert=' + document.getElementById('mobile-cta').inert) + ' ; topbar inert=' + await p.evaluate(() => document.querySelector('.topbar').inert));
    await p.screenshot({ path: `shots/menu_open_${scrolled ? 'scrolled' : 'top'}.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(300); console.log('   after Escape: focus=' + await p.evaluate(act) + ' expanded=' + await p.getAttribute('#nav-toggle', 'aria-expanded') + ' navVisible=' + await p.isVisible('#nav'));
    // shift+tab from the first link
    await p.keyboard.press('Enter'); await p.waitForTimeout(350); await p.keyboard.press('Shift+Tab'); console.log('   shift+tab from first link: ' + await p.evaluate(act)); await p.keyboard.press('Shift+Tab'); console.log('   shift+tab again: ' + await p.evaluate(act)); await p.keyboard.press('Shift+Tab'); console.log('   shift+tab again: ' + await p.evaluate(act));
    await ctx.close(); }
  // 3. theme toggle by keyboard, FAQ details, chips, calculator
  { const ctx = await ctxFor(b, { w: 1280, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/faq/'); await p.waitForTimeout(300);
    await p.focus('#theme-toggle'); await p.keyboard.press('Space'); console.log('\ntheme toggle via Space: data-theme=' + await p.getAttribute('html', 'data-theme') + ' label=' + await p.getAttribute('#theme-toggle', 'aria-label') + ' pressed=' + await p.getAttribute('#theme-toggle', 'aria-pressed'));
    const d = p.locator('details.faq-item').nth(2); await d.locator('summary').focus(); const before = await d.evaluate(e => e.open); await p.keyboard.press('Enter'); await p.waitForTimeout(150); console.log('faq details Enter: open ' + before + ' -> ' + await d.evaluate(e => e.open)); await p.keyboard.press('Space'); await p.waitForTimeout(150); console.log('faq details Space: -> ' + await d.evaluate(e => e.open));
    console.log('faq groups: ' + JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('details')].map(x => (x.getAttribute('name') || '-') + ':' + x.open).slice(0, 14))));
    await ctx.close(); }
  { const ctx = await ctxFor(b, { w: 390, h: 844, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/contact/'); await p.waitForTimeout(300);
    await p.focus('.chip input'); await p.keyboard.press('Space'); console.log('\nchip Space: checked=' + await p.evaluate(() => document.querySelector('.chip input').checked));
    console.log('chip input box: ' + JSON.stringify(await p.evaluate(() => { const i = document.querySelector('.chip input'); const r = i.getBoundingClientRect(); const s = i.nextElementSibling.getBoundingClientRect(); const cs = getComputedStyle(i); return { input: [Math.round(r.width), Math.round(r.height)], span: [Math.round(s.width), Math.round(s.height)], label: [Math.round(i.parentElement.getBoundingClientRect().width), Math.round(i.parentElement.getBoundingClientRect().height)], pos: cs.position, op: cs.opacity, clip: cs.clip }; })));
    console.log('honeypot: ' + JSON.stringify(await p.evaluate(() => { const h = document.querySelector('.hp'); const cs = getComputedStyle(h); const r = h.getBoundingClientRect(); return { display: cs.display, vis: cs.visibility, pos: cs.position, left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) }; })));
    await ctx.close(); }
  { const ctx = await ctxFor(b, { w: 1280, h: 800, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/consulting/'); await p.waitForTimeout(300);
    await p.focus('#c-calls'); await p.keyboard.press('ArrowUp'); await p.waitForTimeout(100); console.log('\ncalculator ArrowUp on calls: value=' + await p.inputValue('#c-calls') + ' month=' + await p.textContent('#r-month'));
    await p.fill('#c-calls', ''); await p.waitForTimeout(100); console.log('calculator emptied calls: month=' + await p.textContent('#r-month') + ' payback=' + await p.textContent('#r-payback'));
    await p.fill('#c-callwin', '500'); await p.waitForTimeout(100); console.log('calculator 500%: month=' + await p.textContent('#r-month') + ' validity=' + await p.evaluate(() => document.getElementById('c-callwin').validity.valid));
    console.log('live region: ' + JSON.stringify(await p.evaluate(() => { const r = document.querySelector('.receipt[aria-live]'); return { live: r.getAttribute('aria-live'), atomic: r.getAttribute('aria-atomic'), words: r.textContent.trim().split(/\s+/).length, hasLink: !!r.querySelector('a') }; })));
    await ctx.close(); }
  await b.close();
})();
