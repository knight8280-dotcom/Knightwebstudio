"""tools/sync_chrome.py finds a footer as the FOOTER comment line followed at once by <footer ...>. Keep that shape:
move each partial's explanatory comment inside the footer, so a re-sync replaces the whole block cleanly."""
import pathlib, re
K = pathlib.Path(__file__).resolve().parent.parent / 'kit' / 'closing'
for name in ('footer', 'footer-start', 'footer-bare'):
    p = K / f'{name}.inc'
    s = p.read_text()
    m = re.match(r'(<!-- =+ FOOTER =+ -->\n)(<!-- (.*?) -->\n)(<footer [^>]*>\n)', s, re.S)
    if not m:
        print(name, 'already in shape' if re.match(r'<!-- =+ FOOTER =+ -->\n<footer ', s) else 'UNEXPECTED START')
        continue
    s = m.group(1) + m.group(4) + '  <!-- ' + m.group(3) + ' -->\n' + s[m.end():]
    p.write_text(s)
    print(name, 'fixed')
    # the same regex the sync tool uses must take the whole block
    FOOTER = re.compile(r'(?:<!-- =+ FOOTER =+ -->\s*)?<footer\b.*?</footer>', re.S | re.I)
    assert FOOTER.search(s).group(0).strip() == s.strip(), name
