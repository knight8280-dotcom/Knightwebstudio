// node full.js ROUND TOWN WIDTH [theme] [cols] : full-page screenshot cut into columns, saved as ROUND/TOWN-WIDTH-THEME-sheet.png
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
(async () => {
  const [round, towns, widths, theme = 'light', cols = ''] = process.argv.slice(2);
  fs.mkdirSync(`${__dirname}/${round}`, { recursive: true });
  const b = await chromium.launch();
  for (const width of widths.split(',')) for (const town of towns.split(',')) {
    const w = +width;
    const ctx = await b.newContext({ viewport: { width: w, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('theme', t); } catch (e) {} }, theme);
    await ctx.route(/plausible\.io|hcaptcha\.com|calendly\.com|js\.stripe\.com|onrender\.com/, r => r.abort());
    const p = await ctx.newPage();
    await p.goto(`http://localhost:8720/web-design-${town}/`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.addStyleTag({ content: '.site-header{position:static!important}.mobile-cta{display:none!important}.split-sticky>:first-child{position:static!important}' });
    const raw = `${__dirname}/${round}/${town}-${w}-${theme}.png`;
    await p.screenshot({ path: raw, fullPage: true });
    await ctx.close();
    execFileSync('python3', ['-c', `
from PIL import Image
import math
im = Image.open('${raw}')
n = ${cols || 0} or (2 if ${w} > 900 else 3 if ${w} > 500 else 5)
H = math.ceil(im.height / n)
out = Image.new('RGB', (n * (im.width + 16), H), '#888')
for i in range(n): out.paste(im.crop((0, i * H, im.width, min((i + 1) * H, im.height))), (i * (im.width + 16), 0))
scale = min(1, 1950 / out.width)
out = out.resize((int(out.width * scale), int(out.height * scale)), Image.LANCZOS)
out.save('${raw.replace('.png', '-sheet.png')}'); print('${town} ${w}', im.size, '->', out.size)
`], { stdio: 'inherit' });
  }
  await b.close();
})();
