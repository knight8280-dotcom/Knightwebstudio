import pathlib
p = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/gallery/components.py'); t = p.read_text()
old = '<div class="on-blue card">\n  <p class="eyebrow">On blue</p>'
assert old in t
t = t.replace(old, '<div class="card stack on-blue">\n  <p class="eyebrow">On blue</p>')
marker = "</div>'''),\n\ndict(id='small-parts'"
assert marker in t
extra = """</div>

<div class="grid grid-2">
  <div class="card stack on-ink">
    <p class="eyebrow">On ink</p>
    <h3>The footer and the top strip</h3>
    <p>Based in Baton Rouge, Louisiana. <a href="tel:+12252550837">(225) 255-0837</a></p>
  </div>
  <div class="card stack on-paper">
    <p class="eyebrow">On paper</p>
    <h3>A printed card</h3>
    <p>Stays cream paper after dark. <a href="/pricing/">Links stay blue</a>.</p>
  </div>
</div>'''),

dict(id='small-parts'"""
t = t.replace(marker, extra, 1)
p.write_text(t)
