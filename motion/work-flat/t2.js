const pw = require('/opt/node-tools/node_modules/playwright');
(async () => {
  for (const name of ['chromium', 'firefox']) {
    let b; try { b = await pw[name].launch(name === 'firefox' ? { executablePath: process.env.FF || undefined } : {}); } catch (e) { console.log(name, 'launch failed', e.message.split('\n')[0]); continue; }
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.setContent('<a id=a href="http://localhost:8730/kit/flat/test/bare.html">x</a><div id=d style="width:100px;height:100px;background:red"></div><script>d.addEventListener("click", e => a.dispatchEvent(new MouseEvent("click", e)))</script>');
    const mod = name === 'firefox' ? 'Control' : 'Control';
    await p.keyboard.down(mod); await p.click('#d'); await p.keyboard.up(mod); await p.waitForTimeout(800);
    console.log(name, 'pages after ctrl+click:', ctx.pages().length, 'first page url:', p.url());
    await p.click('#d'); await p.waitForTimeout(800);
    console.log(name, 'after plain click: pages', ctx.pages().length, 'url', p.url());
    await b.close();
  }
})();
