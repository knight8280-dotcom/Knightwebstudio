import pathlib
W = pathlib.Path(__file__).resolve().parent
K = W.parent / 'kit' / 'closing'
p = W / 'demo.src.html'; s = p.read_text()
s = s.replace('M7 5h3.500v14H7zM13.500 5H17v14h-3.500z', 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z'); p.write_text(s)
btn = '<button class="kws-motion" data-kws="motion" type="button" hidden><svg class="kws-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg><svg class="kws-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>'
p = K / 'footer.inc'; s = p.read_text()
old = '<p class="kws-foot-links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="#top">Back to top ↑</a></p>'
if old in s:
    s = s.replace(old, '<!-- The pause button for the moving backgrounds: shader.js shows it; it stays hidden with script off -->\n      <p class="kws-foot-links">' + btn + '<a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="#top">Back to top ↑</a></p>'); p.write_text(s)
p = K / 'footer-start.inc'; s = p.read_text()
old = '<p class="kws-foot-links"><a href="/">Full website</a>'
if old in s:
    s = s.replace(old, '<p class="kws-foot-links">' + btn + '<a href="/">Full website</a>'); p.write_text(s)
print('done')
