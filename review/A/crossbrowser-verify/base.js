const { webkit } = require(process.env.PWCORE);
(async () => {
  const b = await webkit.launch(); const res = [];
  for (let i = 0; i < 5; i++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.route(u => !u.hostname.startsWith('localhost'), r => r.abort());
    const p = await ctx.newPage(); await p.goto('http://localhost:8700/contact/', { waitUntil: 'load' }); await p.waitForTimeout(800);
    res.push(await p.evaluate(() => [...document.querySelectorAll('fieldset')].map(f => { const l = f.querySelector('legend'); const r = l.getBoundingClientRect(), fr = f.getBoundingClientRect(); return `${Math.round(r.width)}x${Math.round(r.height)}/${Math.round(fr.width)}x${Math.round(fr.height)}[${getComputedStyle(f).display}] "${l.textContent.trim()}"`; }).join(' ')));
    if (i === 0) { await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelector('fieldset').scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(400); await p.screenshot({ path: `shots/baseline_${process.env.PWLABEL}_390_contact.png` }); }
    await ctx.close();
  }
  for (const u of [...new Set(res)]) console.log(`  x${res.filter(x => x === u).length}: ${u}`);
  await b.close();
})();
