import pathlib
p = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/gallery/components.py'); t = p.read_text()
old = "`.bubble-typing` hops three times and then rests."
assert old in t
t = t.replace(old, "A link inside a bubble is `<span class=\"bubble-link\">`. The phone is 15rem wide; set `--phone-w` on a wrapper to change it.\n`.bubble-typing` hops three times and then rests.")
old = "The status line is `.form-status`; `main.js` adds `.ok` or `.error`."
assert old in t
t = t.replace(old, "The status line is `.form-status`; `main.js` adds `.ok` or `.error`. The captcha sits in `.captcha-wrap`, and the spam trap keeps its class `hp` (it is moved off screen).")
p.write_text(t)
