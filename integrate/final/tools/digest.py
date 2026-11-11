import json, sys
d = json.load(open(sys.argv[1]))
what = sys.argv[2]
for key, o in d.items():
    p, w = key.split('@')
    if what == 'head':
        h = o.get('head')
        print(f'\n== {key}  height {o["height"]}  gapUnderHeader {o["gapUnderHeader"]} first: {o["firstThing"]}')
        if h:
            print('  ', h['section'], '|', h['container'], '| kids:', ' , '.join(h['kids'] or []))
            print('   eyebrow:', h['eyebrow'], '| h1:', h['h1'], f'| {h["h1size"]}px x{h["h1lines"]} lines class={h["h1class"]!r} | lede {h["ledeSize"]}px {h["ledeChars"]}ch | eb->h1 {h["ebToH1"]} h1->lede {h["h1ToLede"]} | pad {h["padTop"]}/{h["padBottom"]} | head h {h["headHeight"]}')
            for b in h['buttons']: print('     btn:', b)
            print('     strip:', h['strip'])
    if what == 'sections' and w == sys.argv[3]:
        print(f'\n== {key}')
        for s in o['sections']:
            print(f'   {s["el"][:60]:60} pt {s["pt"]:>5} pb {s["pb"]:>5} h {s["h"]:>5} | head {s["head"]} gap {s["headGap"]} | eb {s["eyebrow"]!r} | h2 {s["h2size"]} {s["h2class"]!r} {s["h2"]!r} | sub {s["sub"]}')
    if what == 'band' and w == sys.argv[3]:
        print(f'\n== {key}')
        if 'band' in o:
            b = o['band']; print('  ', b['cls'], '|', b['inner'], '|', b['kids'], '| prev', b['prev'], 'pb', b['prevPb'], '| pt', b['pt'], 'h', b['h'], 'h2', b['h2size'])
            print('   h2:', b['h2']); [print('   p:', x) for x in b['p']]; [print('   btn:', x) for x in b['buttons']]; print('   appt:', b['appt'])
        else: print('   end:', o['end'])
    if what == 'buttons' and w == '1440':
        print(f'\n== {key}')
        for b in o['buttons']: print(f'   {b["t"][:48]:48} | {b["c"]:34} | {b["h"]} {"[booking]" if b["bk"] else ""} {"" if b["vis"] else "(hidden)"} {("aria=" + b["aria"]) if b["aria"] else ""}')
        for m in o['moreLinks']: print('   more:', m)
    if what == 'headings' and w == sys.argv[3]:
        print(f'\n== {key}'); [print('   ', x) for x in o['headings']]; print('   EYEBROWS:'); [print('     ', x) for x in o['eyebrows']]
    if what == 'links' and w == '1440':
        print(f'\n== {key}'); [print('   ', x) for x in o['links']]; [print('    LIST', k, 'x', v) for k, v in o['lists'].items()]
