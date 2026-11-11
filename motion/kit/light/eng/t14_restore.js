const { launch, ctx, URL, PORT } = require('./common');
(async () => {
  const b = await launch();
  const c = await ctx(b, { viewport: { width: 390, height: 844 } }); const p = await c.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  // capture pristine HTML before any script upgrades: fetch the source and parse
  await p.goto(PORT, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const r = await p.evaluate(async () => {
    const src = await (await fetch(location.href)).text(); const doc = new DOMParser().parseFromString(src, 'text/html');
    const norm = h => h.replace(/\s+/g, ' ').replace(/ class=""/g, '').replace(/ style=""/g, '');
    const out = {};
    // folders
    const st = document.querySelector('.kws-folders--stack'), st0 = doc.querySelector('.kws-folders--stack');
    out.foldersLiveDiffers = norm(st.outerHTML) !== norm(st0.outerHTML);
    // we do not hold the auto-start remover: mount() again returns a no-op, so there is no way to undo an auto-started stack
    const end = KWS.folders.mount(st); end();
    out.autoStartedStackUndoable = norm(st.outerHTML) === norm(st0.outerHTML);
    // fresh element: mount → unmount → identical?
    const fresh = st0.cloneNode(true); st.replaceWith(fresh); const before = norm(fresh.outerHTML); const e2 = KWS.folders.mount(fresh, { start: 3 }); const mid = fresh.querySelectorAll('[role=tab]').length; e2(); out.freshStack = { tabsWhileMounted: mid, identicalAfterUnmount: norm(fresh.outerHTML) === before, expando: 'kwsFolders' in fresh };
    // shader: mount → unmount → identical
    const sh = document.querySelector('.kws-shader'), sh0 = doc.querySelector('.kws-shader'); KWS.shader.mount(sh)(); out.shaderIdentical = norm(sh.outerHTML) === norm(sh0.outerHTML);
    // motion: mount → unmount
    const mb = document.querySelector('.kws-motion'), mb0 = doc.querySelector('.kws-motion');
    out.motionLive = { hidden: mb.hidden, label: mb.getAttribute('aria-label'), title: mb.title };
    out.htmlAttrs = [...document.documentElement.attributes].map(a => a.name + '=' + a.value);
    out.globals = Object.keys(window).filter(k => /kws/i.test(k));
    out.KWS = Object.keys(window.KWS).map(k => k + ':' + Object.keys(window.KWS[k]).join('/'));
    return out;
  });
  console.log(JSON.stringify(r, null, 1), 'errors:', errs.join('|') || 'none');
  // globals diff: load a blank page and compare window keys added by the two scripts
  const p2 = await c.newPage(); await p2.goto('about:blank');
  const base = await p2.evaluate(() => Object.getOwnPropertyNames(window));
  await p2.goto(PORT, { waitUntil: 'load' }); await p2.waitForTimeout(800);
  const after = await p2.evaluate(() => Object.getOwnPropertyNames(window));
  console.log('window properties added on the bare page:', after.filter(k => !base.includes(k)).join(', '));
  await b.close();
})();
