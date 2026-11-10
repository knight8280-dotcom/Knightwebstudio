"""KnightWebstudio artwork: the crest, the round seal and the two drawings.

Everything is hand-placed vector geometry, returned as SVG strings. The site
has no build step, so tools/art/build.py writes these into the HTML between
<!-- art:NAME --> markers; run it again after changing anything here.

The crest's colours are fixed (see PALETTE) rather than themed: it is an
emblem and looks the same by day and at night, like a painted sign. Sign-
painter's blue on a navy field with a gold-leaf line, to match the site.

The drawings (street scene, workbench) are themed. Each carries SCENE_PALETTE
as custom properties on its <svg>, one value for day and one for night, and
the stylesheet's --L / --D switches pick between them.

Every function takes a `uid` so two copies on one page never share an id
(clip paths and gradients are looked up by id).
"""
import re

import scenes

# ---------------------------------------------------------------- palette
PALETTE = {
    '--t1': '#DCE3FF', '--t2': '#B9C7FF', '--t3': '#8FA5FF',   # lit facets
    '--t4': '#5C77EC', '--t5': '#2C46C4',                      # shaded facets (sign-painter's blue)
    '--ink': '#161B2C', '--accent': '#F0C369',                 # the eye; the gold-leaf line
    '--rim': '#2C46C4', '--rim2': '#B9C7FF', '--glow': '#8FA5FF',
    '--field1': '#24306A', '--field2': '#161B2C', '--ribbon': '#1B2C84', '--ribbon2': '#14205E',
    '--steel1': '#FBF5E6', '--steel2': '#CFC7B4', '--steel3': '#8E8A80', '--letter': '#FFFBF2',
}
STYLE = ';'.join(f'{k}:{v}' for k, v in PALETTE.items())

SHIELD = 'M60 6C75 12 92 15 104 16V56C104 86 84 104 60 114C36 104 16 86 16 56V16C28 15 45 12 60 6Z'
INNER = 'M60 14C73 19 88 22 97 23V56C97 81 80 97 60 106C40 97 23 81 23 56V23C32 22 47 19 60 14Z'


def _pts(pts):
    return ' '.join(f'{x},{y}' for x, y in pts)


# ---------------------------------------------------------------- the horse
# A chess knight's head in profile, facing left, cut into facets. 100-unit box;
# the neck runs past the bottom so whatever frames it can crop it.
_P = dict(ET=(54, 4), EB=(61, 15), EF=(46, 12), F=(37, 15), FF=(24, 27), N=(13, 41),
          MF=(8, 49), MB=(12, 56), CH=(23, 58), J=(42, 54), TH=(38, 63), NF=(31, 80),
          BL=(26, 112), BR=(78, 112), BM=(53, 112), NB=(72, 80), EY=(35, 29), C=(50, 37),
          MM=(24, 46), MI1=(63, 24), MI2=(65, 43), MI3=(63, 63))
_MANE = [(61, 15), (67, 16), (72, 22), (69, 26), (77, 32), (73, 36), (79, 44), (74, 48),
         (79, 57), (73, 61), (76, 70), (72, 80)]
_TONE = dict(L='var(--t1)', ML='var(--t2)', M='var(--t3)', MD='var(--t4)', D='var(--t5)')
_FACETS = [
    (['ET', 'EB', 'EF'], 'ML'), (['ET', 'EF', (50, 9)], 'L'), (['F', 'EF', 'EB', 'MI1', 'EY'], 'M'),
    (['F', 'FF', 'EY'], 'L'), (['FF', 'N', 'MM', 'EY'], 'ML'), (['N', 'MF', 'MB', 'CH', 'MM'], 'L'),
    (['EY', 'MM', 'C'], 'M'), (['EY', 'C', 'MI1'], 'MD'), (['MM', 'CH', 'J', 'C'], 'MD'),
    (['C', 'J', 'TH', 'MI3', 'MI2'], 'M'), (['C', 'MI2', 'MI1'], 'MD'),
    (['TH', 'NF', 'BL', 'BM', 'MI3'], 'M'), (['MI3', 'BM', 'BR', 'NB'], 'MD'),
    (_MANE + ['MI3', 'MI2', 'MI1'], 'D'),
]


def horse():
    out = []
    for i, (pts, tone) in enumerate(_FACETS):
        xy = [_P[p] if isinstance(p, str) else p for p in pts]
        # each facet starts a little way off, so the head can assemble itself
        dx, dy = ((i * 37) % 11 - 5) * 1.6, ((i * 53) % 9 - 4) * 1.6
        out.append(f'<polygon class="facet" style="--i:{i};--dx:{dx:.1f}px;--dy:{dy:.1f}px" '
                   f'fill="{_TONE[tone]}" points="{_pts(xy)}"/>')
    out.append('<path class="eye" d="M30 27Q35 24 40 27Q35 30 30 27Z" fill="var(--ink)"/>')
    out.append('<path d="M12 46L16 45" stroke="var(--ink)" stroke-width="1.6" stroke-linecap="round"/>')
    return ''.join(out)


# ---------------------------------------------------------------- shield parts
_RIVETS = [(24, 20), (42, 15.5), (60, 11), (78, 15.5), (96, 20), (100, 44), (20, 44),
           (94, 76), (26, 76), (79, 97), (41, 97)]


def _defs(uid):
    return (f'<defs>'
            f'<linearGradient id="{uid}-fld" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="var(--field1)"/><stop offset="1" stop-color="var(--field2)"/></linearGradient>'
            f'<radialGradient id="{uid}-glow" cx=".5" cy=".42" r=".5">'
            f'<stop offset="0" stop-color="var(--glow)" stop-opacity=".35"/><stop offset="1" stop-color="var(--glow)" stop-opacity="0"/></radialGradient>'
            f'<linearGradient id="{uid}-gl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/>'
            f'<stop offset=".5" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            f'<clipPath id="{uid}-in"><path d="{INNER}"/></clipPath>'
            f'<clipPath id="{uid}-out"><path d="{SHIELD}"/></clipPath>'
            f'</defs>')


def _shield(uid, art, detail=True):
    s = [f'<g class="a-rim"><path d="{SHIELD}" fill="var(--rim)"/>',
         f'<path d="{SHIELD}" fill="none" stroke="var(--rim2)" stroke-opacity=".55" stroke-width="1.2"/>',
         f'<path class="a-field" d="{INNER}" fill="url(#{uid}-fld)"/></g>',
         f'<g clip-path="url(#{uid}-in)"><circle class="a-field" cx="60" cy="50" r="42" fill="url(#{uid}-glow)"/>{art}</g>',
         f'<path class="a-line" pathLength="1" d="{INNER}" fill="none" stroke="var(--accent)" stroke-opacity=".9" stroke-width="1"/>']
    if detail:
        s += [f'<circle class="rivet" style="--i:{i}" cx="{x}" cy="{y}" r="1.6" fill="var(--rim2)" fill-opacity=".85"/>'
              for i, (x, y) in enumerate(_RIVETS)]
        s.append(f'<g clip-path="url(#{uid}-out)"><g transform="rotate(20 60 60)">'
                 f'<rect class="a-glint" x="-60" y="-30" width="16" height="180" fill="url(#{uid}-gl)"/></g></g>')
    return ''.join(s)


_HORSE_IN_SHIELD = '<g transform="translate(22 22) scale(.86)" stroke-linejoin="round">{}</g>'


def charger(uid, cls='crest', label=None, detail=True):
    """The Charger shield: the studio's mark."""
    a11y = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    return (f'<svg class="{cls}" viewBox="0 0 120 120" {a11y} style="{STYLE}">'
            f'{_defs(uid)}{_shield(uid, _HORSE_IN_SHIELD.format(horse()), detail)}</svg>')


def _sword():
    return ('<path d="M-3 40V-92L0-100L3-92V40Z" fill="var(--steel1)" stroke="var(--steel3)" stroke-width=".6"/>'
            '<path d="M0-100L3-92V40H0Z" fill="var(--steel2)"/>'
            '<path d="M0-90V34" stroke="var(--steel3)" stroke-width=".8"/>'
            '<rect x="-13" y="40" width="26" height="4.2" rx="2.1" fill="var(--rim)"/>'
            '<rect x="-2.2" y="44.2" width="4.4" height="10" fill="var(--t5)"/>'
            '<circle cy="57.5" r="3.6" fill="var(--rim)"/><circle cy="57.5" r="1.4" fill="var(--accent)"/>')


def _ribbon(uid, text):
    return (f'<path d="M14 128L24 120L22 136Z" fill="var(--ribbon2)"/><path d="M146 128L136 120L138 136Z" fill="var(--ribbon2)"/>'
            f'<path d="M4 124H26L22 132L26 140H4L10 132Z" fill="var(--ribbon)"/>'
            f'<path d="M156 124H134L138 132L134 140H156L150 132Z" fill="var(--ribbon)"/>'
            f'<path d="M22 118Q80 132 138 118V134Q80 148 22 134Z" fill="var(--ribbon)"/>'
            f'<path d="M22 118Q80 132 138 118M22 134Q80 148 138 134" fill="none" stroke="var(--accent)" stroke-width=".8"/>'
            f'<path id="{uid}-rbt" d="M28 130.5Q80 144 132 130.5" fill="none"/>'
            f'<text font-family="Fraunces, Georgia, serif" font-weight="700" font-size="7.4" '
            f'letter-spacing="1.2" fill="var(--letter)" text-anchor="middle">'
            f'<textPath href="#{uid}-rbt" startOffset="50%">{text}</textPath></text>')


def full_crest(uid, cls='crest-full', label='Knight Web Studio crest', text='KNIGHT WEB STUDIO'):
    """The Charger shield with crossed swords and a name ribbon, for large spots."""
    a11y = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    return (f'<svg class="{cls}" viewBox="0 0 160 164" {a11y} style="{STYLE}">{_defs(uid)}'
            f'<g transform="translate(80 84) rotate(-40)"><g class="a-sw a-sw-l">{_sword()}</g></g>'
            f'<g transform="translate(80 84) rotate(40)"><g class="a-sw a-sw-r">{_sword()}</g></g>'
            f'<g transform="translate(20 6)"><g class="a-drop">{_shield(uid, _HORSE_IN_SHIELD.format(horse()))}</g></g>'
            f'<g transform="translate(0 16)"><g class="a-ribbon">{_ribbon(uid, text)}</g></g></svg>')


def favicon_mark():
    """Simplified for 16-48px: rim, field and a two-tone horse, no rivets or glint."""
    uid = 'fav'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" style="{STYLE}">{_defs(uid)}'
            f'<path d="{SHIELD}" fill="var(--rim)"/><path d="{INNER}" fill="url(#{uid}-fld)"/>'
            f'<g clip-path="url(#{uid}-in)">{_HORSE_IN_SHIELD.format(horse())}</g>'
            f'<path d="{INNER}" fill="none" stroke="var(--accent)" stroke-width="2.4"/></svg>')


# ---------------------------------------------------------------- the seal
def seal(uid, cls='seal'):
    """The round "Fixed prices" seal. Decorative: the same words are on the page. One a page."""
    return (f'<svg class="{cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false">'
            f'<defs><path id="{uid}-arc" d="M60 60m-42 0a42 42 0 1 1 84 0a42 42 0 1 1-84 0"/></defs>'
            f'<circle cx="60" cy="60" r="58" fill="var(--card)"/>'
            f'<circle cx="60" cy="60" r="54.5" fill="none" stroke="var(--brick)" stroke-width="2"/>'
            f'<circle cx="60" cy="60" r="31" fill="none" stroke="var(--brick)" stroke-width="1"/>'
            f'<text font-size="7.6"><textPath href="#{uid}-arc" textLength="258" lengthAdjust="spacing">'
            f'PUBLISHED UP FRONT · CONFIRMED IN WRITING ·</textPath></text>'
            f'<text class="seal-big" font-size="15.5" x="60" y="58" text-anchor="middle">Fixed</text>'
            f'<text class="seal-big" font-size="15.5" x="60" y="74" text-anchor="middle">prices</text></svg>')


# ---------------------------------------------------------------- the drawings
# name: (day, night). Each drawing is given only the entries it uses.
SCENE_PALETTE = {
    '--il-sky-1': ('#D5E0F6', '#101632'), '--il-sky-2': ('#F5EEDD', '#27305A'), '--il-sun': ('#F6D88E', '#F3ECDD'),
    '--il-cloud': ('#FFFDF6', '#2B355E'), '--il-star': ('transparent', '#F3ECDD'), '--il-far': ('#C5CCE0', '#2C3768'),
    '--il-brick': ('#BC5B3E', '#7A3F30'), '--il-brick-2': ('#9C4630', '#5C2D22'), '--il-trim': ('#FBF5E6', '#C9C1AE'),
    '--il-shutter': ('#33446F', '#1F2947'), '--il-glass': ('#BFD0EC', '#232D4E'), '--il-glass-2': ('#D6E1F4', '#F3C66B'),
    '--il-awn-1': ('#2C46C4', '#4660DA'), '--il-awn-2': ('#FBF5E6', '#CFC7B4'), '--il-sign': ('#2C46C4', '#24389F'),
    '--il-ink': ('#1A2238', '#080A12'), '--il-walk': ('#E3D8C2', '#2B3145'), '--il-walk-2': ('#CFC2A8', '#20263A'),
    '--il-road': ('#BFB6A4', '#171B29'), '--il-hub': ('#D9CFBB', '#8E8A80'), '--il-van': ('#FBF5E6', '#C9C1AE'),
    '--il-van-2': ('#E4DAC6', '#A8A190'), '--il-leaf': ('#5F8160', '#33503F'), '--il-leaf-2': ('#7C9B79', '#436650'),
    '--il-gold': ('#E9B44C', '#F3C66B'), '--il-lamp': ('#FBF5E6', '#F7D98C'), '--il-wall': ('#E9DFCB', '#20273A'),
    '--il-tool': ('#CDBFA4', '#2E3650'), '--il-wood': ('#C89A64', '#6B5138'), '--il-wood-2': ('#AE7F4C', '#55402C'),
    '--il-screen': ('#FFFCF5', '#F7F2E6'), '--il-screen-ink': ('#1A2238', '#1A2238'), '--il-alert': ('#B8432B', '#C8553B'),
    '--il-night': ('0', '1'),   # opacity of anything that is lit only after dark (class sc-night)
}


def _scene_style(body):
    used = set(re.findall(r'--il-[a-z0-9-]+', body)) | ({'--il-night'} if 'sc-night' in body else set())
    return ';'.join(f'{k}:var(--L,{d}) var(--D,{n})' for k, (d, n) in SCENE_PALETTE.items() if k in used)


STREET_TITLE = ('Drawing of a brick shop front with a striped awning on a Baton Rouge street. A work van is parked '
                'outside, and the State Capitol tower and the river bridge sit on the horizon.')


def street(uid, sign='YOUR BUSINESS', title=STREET_TITLE, cls='scene scene-street'):
    """The shop front on a Baton Rouge street. Home page; small on /start/ and the 404 page."""
    body = scenes.STREET.replace('{uid}', uid).replace('{sign}', sign)
    return (f'<svg class="{cls}" viewBox="0 0 600 640" role="img" aria-labelledby="{uid}-title" '
            f'style="{_scene_style(body)}"><title id="{uid}-title">{title}</title>{body}</svg>')


BENCH_LABEL = ('Drawing of a phone ringing on a workbench beside a coffee cup and a tape measure, '
               'with nobody there to answer it')


def bench(uid, cls='scene scene-bench'):
    """A missed call on the workbench. Home page story, step one."""
    body = scenes.BENCH.replace('{uid}', uid)
    return (f'<svg class="{cls}" viewBox="0 0 480 300" role="img" aria-label="{BENCH_LABEL}" '
            f'style="{_scene_style(body)}">{body}</svg>')
