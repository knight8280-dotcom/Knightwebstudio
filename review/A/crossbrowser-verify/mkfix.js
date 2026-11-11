// builds the patched stylesheet the reviewer proposed (in my scratch dir only)
const fs = require('fs'); let css = fs.readFileSync('/home/user/Knightwebstudio/assets/css/styles.css', 'utf8');
const a = '.field { display: grid; align-content: start; gap: var(--s-2); margin-bottom: var(--s-5); }';
const b = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--pair), 1fr)); gap: var(--s-4) var(--gap); }';
const c = '[data-page="consulting"] .calc-group .field { grid-template-rows: 1fr auto; margin-bottom: 0; }';
for (const s of [a, b, c]) if (css.split(s).length !== 2) throw new Error('anchor not unique: ' + s);
css = css.replace(a, a + '\nfieldset.field { display: block; }');
css = css.replace(b, 'display: flex; flex-wrap: wrap; gap: var(--s-4) var(--gap); }');
css = css.replace(c, '[data-page="consulting"] .calc-group .field { flex: 1 1 var(--pair); grid-template-rows: 1fr auto; margin-bottom: 0; }');
fs.writeFileSync(__dirname + '/styles.fixed.css', css); console.log('ok', css.length);
