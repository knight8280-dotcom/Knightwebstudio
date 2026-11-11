// Accessible names (from the browser's AX tree) for every interactive element vs its visible text. 2.5.3, 2.4.4, 4.1.2.
const { chromium, BASE, PAGES, slug, ctxFor } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const all = {};
  for (const w of [390, 1280]) for (const path of PAGES) {
    const ctx = await ctxFor(b, { w, h: 800, reduced: true, mobile: w === 390 });
    const p = await ctx.newPage(); await p.goto(BASE + path); await p.waitForTimeout(400);
    if (w === 390 && await p.locator('#nav-toggle').count()) { /* keep menu closed for this pass */ }
    const cdp = await ctx.newCDPSession(p); await cdp.send('DOM.enable'); await cdp.send('Accessibility.enable');
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const roles = new Set(['link', 'button', 'textbox', 'combobox', 'checkbox', 'radio', 'spinbutton', 'slider', 'switch', 'tab', 'menuitem', 'searchbox', 'listbox', 'DisclosureTriangle', 'summary']);
    const rows = [];
    for (const n of nodes) {
      if (n.ignored || !n.role || !roles.has(n.role.value) || !n.backendDOMNodeId) continue;
      let info = null;
      try {
        const { object } = await cdp.send('DOM.resolveNode', { backendNodeId: n.backendDOMNodeId });
        const res = await cdp.send('Runtime.callFunctionOn', { objectId: object.objectId, returnByValue: true, functionDeclaration: `function(){
          const el=this; const tw=document.createTreeWalker(el,NodeFilter.SHOW_TEXT); let vis='';
          while(tw.nextNode()){const t=tw.currentNode; const pe=t.parentElement; if(!pe) continue; const r=pe.getBoundingClientRect(); const cs=getComputedStyle(pe);
            if(pe.closest('.sr-only')||cs.display==='none'||cs.visibility==='hidden'||(r.width<=1&&r.height<=1)) continue; vis+=t.textContent+' ';}
          const r=el.getBoundingClientRect(); const cs=getComputedStyle(el);
          return {tag:el.tagName,vis:vis.replace(/\\s+/g,' ').trim(),href:el.getAttribute('href'),ariaLabel:el.getAttribute('aria-label'),title:el.getAttribute('title'),cur:el.getAttribute('aria-current'),exp:el.getAttribute('aria-expanded'),ctl:el.getAttribute('aria-controls'),target:el.getAttribute('target'),rel:el.getAttribute('rel'),
            w:Math.round(r.width),h:Math.round(r.height),shown:cs.visibility!=='hidden'&&r.width>0,id:el.id,cls:String(el.className).slice(0,60),type:el.getAttribute('type'),req:el.required,ac:el.getAttribute('autocomplete'),fname:el.getAttribute('name'),desc:el.getAttribute('aria-describedby'),inv:el.getAttribute('aria-invalid'),areq:el.getAttribute('aria-required'),inputmode:el.getAttribute('inputmode'),
            inWhere:(el.closest('header.site-header')?'header':el.closest('footer')?'footer':el.closest('.topbar')?'topbar':el.closest('.mobile-cta')?'phonebar':el.closest('main')?'main':'other')};}` });
        info = res.result.value;
      } catch (e) { info = { err: String(e) }; }
      rows.push(Object.assign({ role: n.role.value, name: n.name ? n.name.value : '', axdesc: n.description ? n.description.value : '' }, info));
    }
    all[`${path} @${w}`] = rows;
    await ctx.close();
  }
  fs.writeFileSync('out/names.json', JSON.stringify(all, null, 1));
  await b.close();
})();
