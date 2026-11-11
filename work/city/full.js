// node full.js TOWN WIDTH [theme] : full-page screenshot cut into columns, saved as r5/TOWN-WIDTH-sheet.png
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
(async () => {
  const [town, width, theme = 'light'] = process.argv.slice(2); const w = +width;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
  await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
  const p = await ctx.newPage();
  await p.goto(`http://localhost:8720/web-design-${town}/`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
  await p.addStyleTag({ content: '.site-header{position:static!important}.mobile-cta{display:none!important}.split-sticky>:first-child{position:static!important}' });
  await p.screenshot({ path: `r5/${town}-${w}-${theme}.png`, fullPage: true });
  await b.close();
  execFileSync('python3', ['-c', `
from PIL import Image
import math
im = Image.open('r5/${town}-${w}-${theme}.png')
n = 2 if ${w} > 900 else 3 if ${w} > 500 else 4
H = math.ceil(im.height / n)
out = Image.new('RGB', (n * (im.width + 16), H), '#888')
for i in range(n): out.paste(im.crop((0, i * H, im.width, min((i + 1) * H, im.height))), (i * (im.width + 16), 0))
scale = min(1, 1900 / out.width)
out = out.resize((int(out.width * scale), int(out.height * scale)), Image.LANCZOS)
out.save('r5/${town}-${w}-${theme}-sheet.png'); print(out.size)
`], { stdio: 'inherit' });
})();
