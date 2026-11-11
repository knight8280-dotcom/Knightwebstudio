const { chromium, BASE, ctxFor } = require('./lib');
const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
(async () => {
  const b = await chromium.launch();
  for (const theme of ['light', 'dark']) for (const w of [390, 1280]) {
    const ctx = await ctxFor(b, { w, h: w === 390 ? 844 : 800, theme, reduced: true }); const p = await ctx.newPage(); await p.goto(BASE + '/contact/'); await p.waitForTimeout(400);
    const cdp = await ctx.newCDPSession(p); await cdp.send('Accessibility.enable');
    const ax = async (sel) => { const { nodes } = await cdp.send('Accessibility.getFullAXTree'); const out = []; for (const n of nodes) { if (n.ignored) continue; const role = n.role && n.role.value; if (['textbox', 'combobox', 'checkbox', 'button', 'group', 'alert', 'status'].includes(role)) out.push(role + ' "' + (n.name ? n.name.value : '') + '"' + (n.description && n.description.value ? ' desc="' + n.description.value + '"' : '') + ' ' + (n.properties || []).filter(q => ['required', 'invalid', 'checked', 'live', 'atomic', 'busy'].includes(q.name)).map(q => q.name + '=' + q.value.value).join(' ')); } return out; };
    if (theme === 'light') { console.log(`\n--- contact @${w} initial AX`); (await ax()).forEach(l => console.log('   ' + l)); }
    // submit empty with keyboard
    await p.focus('#submit-btn'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    const st = await p.evaluate(() => ({ active: document.activeElement.id, status: document.getElementById('form-status').textContent, statusClass: document.getElementById('form-status').className, errs: [...document.querySelectorAll('.error')].map(e => e.id + ':' + e.textContent), inv: [...document.querySelectorAll('[aria-invalid]')].map(e => e.id + '=' + e.getAttribute('aria-invalid')) }));
    console.log(`\n--- contact @${w} ${theme} after empty submit: ` + JSON.stringify(st));
    if (theme === 'light') { (await ax()).forEach(l => console.log('   ' + l)); }
    // styles of error state
    const styles = await p.evaluate(() => { const f = document.getElementById('name'); const cs = getComputedStyle(f); const e = document.getElementById('name-error'); const ce = getComputedStyle(e); const ok = document.getElementById('company'); const co = getComputedStyle(ok); const sel = document.getElementById('package'); const chip = document.querySelector('.chip span'); const cc = getComputedStyle(chip); const form = document.getElementById('contact-form'); const before = getComputedStyle(e, '::before');
      const bg = el => { for (let x = el; x; x = x.parentElement) { const c = getComputedStyle(x).backgroundColor; if (c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') return c; } return 'rgb(255,255,255)'; };
      return { invalidBorder: cs.borderColor + ' ' + cs.borderWidth, invalidBg: cs.backgroundColor, okBorder: co.borderColor + ' ' + co.borderWidth, okBg: co.backgroundColor, fieldParentBg: bg(ok.parentElement), errColor: ce.color, errBefore: before.content, errWeight: ce.fontWeight, errSize: ce.fontSize, chipBorder: cc.borderColor + ' ' + cc.borderWidth, chipBg: cc.backgroundColor, chipParentBg: bg(chip.parentElement.parentElement), selBorder: getComputedStyle(sel).borderColor, placeholder: getComputedStyle(document.getElementById('message'), '::placeholder').color, taBg: getComputedStyle(document.getElementById('message')).backgroundColor }; });
    console.log('   styles ' + JSON.stringify(styles));
    await p.locator('#contact-form').screenshot({ path: `shots/forms/contact_errors_${w}_${theme}.png` });
    // chip checked state
    await p.locator('.chip').first().click(); await p.waitForTimeout(100);
    const chipChecked = await p.evaluate(() => { const s = document.querySelector('.chip input:checked + span'); const cs = getComputedStyle(s); const b = getComputedStyle(s, '::before'); return { bg: cs.backgroundColor, color: cs.color, border: cs.borderColor, before: b.content, beforeW: b.width, fontWeight: cs.fontWeight }; });
    console.log('   chip checked ' + JSON.stringify(chipChecked));
    await p.locator('.chips').screenshot({ path: `shots/forms/chips_${w}_${theme}.png` });
    // fix name -> status clears?
    await p.fill('#name', 'Test Person'); await p.fill('#email', 'bad'); await p.keyboard.press('Tab'); await p.waitForTimeout(150);
    console.log('   after bad email: ' + JSON.stringify(await p.evaluate(() => ({ nameErr: document.getElementById('name-error').textContent, emailErr: document.getElementById('email-error').textContent, emailInv: document.getElementById('email').getAttribute('aria-invalid'), status: document.getElementById('form-status').textContent }))));
    await ctx.close();
  }
  await b.close();
})();
