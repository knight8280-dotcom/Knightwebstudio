#!/usr/bin/env python3
"""Writes ../demo.html (and ../test/bare.html) from the pieces below, so the story cards and the
inclusion lists are typed once and reused in the client-palette section. Run: python3 test/build-demo.py"""
import pathlib
HERE = pathlib.Path(__file__).resolve().parent
KIT = HERE.parent
HEAD_SCRIPT = pathlib.Path('/home/user/Knightwebstudio/tools/chrome/head-script.inc').read_text().rstrip('\n')

ICO_MISSED = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/><path d="m15 4 5 5m0-5-5 5"/></svg>'
ICO_TICK = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>'

# The story of one missed call. The headings are the brief's; the sentences, the mock parts and every word inside the
# mocks are the home page's (one scene-setting sentence on card 1 is new and states no fact).
# Each entry: service, its fixed setup price or a pointer back to the card that carries it, heading, drawing, sentence.
STORY = [
    ("Missed-call text-back", "$750 setup", "You can't pick up.",
     f'''<div class="demo-rings">
              <div class="notice" role="img" aria-label="Example notification on your phone: a missed call">
                <p class="notice-top" aria-hidden="true">Your phone<span class="notice-when">now</span></p>
                <p class="notice-title" aria-hidden="true"><span class="thread-note thread-missed">{ICO_MISSED}Missed call</span></p>
              </div>
            </div>''',
     "You're on a job, up a ladder or with a customer. The phone rings out."),
    ("Missed-call text-back", "Same setup as step 1", "Within a minute, they get a text.",
     '''<ul class="thread">
              <li class="bubble bubble-biz">Sorry we missed your call, this is [your business]. What can we help with?</li>
              <li class="thread-note">Sent on its own, within a minute</li>
              <li class="bubble bubble-cust">The kitchen sink is leaking under the cabinet.</li>
            </ul>''',
     "The caller gets a text from your business number asking what they need. Their reply lands on your phone, so you call back knowing the job."),
    ("Online booking &amp; reminders", "$750 setup", "They pick a time. It's on your calendar.",
     f'''<div class="cal" role="img" aria-label="Example week on a calendar: a new online booking drops into a free slot on Thursday">
              <p class="cal-head"><b>Your calendar</b><span>This week</span></p>
              <div class="cal-grid" aria-hidden="true">
                <div class="cal-day"><span>Mon</span><i class="busy"></i><i class="busy"></i></div>
                <div class="cal-day"><span>Tue</span><i class="busy"></i><i></i></div>
                <div class="cal-day"><span>Wed</span><i></i><i class="busy"></i></div>
                <div class="cal-day cal-today"><span>Thu</span><i class="busy"></i><i class="new">{ICO_TICK}</i></div>
                <div class="cal-day"><span>Fri</span><i></i><i class="busy"></i></div>
              </div>
              <ul class="cal-log" aria-hidden="true">
                <li>{ICO_TICK}Confirmation sent</li>
              </ul>
            </div>''',
     "Customers pick a time on your site or Google profile, with no double bookings. Confirmations and reminders go out on their own."),
    ("Lead follow-up system", "$1,500 setup", "The quote went quiet? It follows up for you.",
     '''<div class="leads" role="img" aria-label="Example list of enquiries. Each quote that went quiet shows its follow-up: one sent after 2 days, one sent after a week">
              <p class="cal-head"><b>Enquiries</b><span>One list</span></p>
              <ul aria-hidden="true">
                <li><span class="lead-what">Fence repair</span><span class="pill pill-go">Follow-up sent · 2 days</span></li>
                <li><span class="lead-what">AC tune-up</span><span class="pill pill-go">Follow-up sent · 1 week</span></li>
              </ul>
            </div>''',
     "Every enquiry is saved to one list automatically. Quiet quotes get a friendly follow-up after 2 days and a week."),
    ("Lead follow-up system", "Same setup as step 4", "Job done. The review request sends itself.",
     '''<div class="leads" role="img" aria-label="Example list of enquiries: the missed call is now a finished job, and its review request has been sent">
              <p class="cal-head"><b>Enquiries</b><span>One list</span></p>
              <ul aria-hidden="true">
                <li><span class="lead-src">Missed call · job done</span><span class="lead-what">Leaking sink</span><span class="pill">Review request sent</span></li>
              </ul>
            </div>''',
     "Finished jobs get a review request with your Google link."),
]

# Every line is in the package table on /pricing/, under the package named on the tab.
GROUPS = [
    ("One-page", "$1,000", ["1 page", "Custom design", "1 revision round", ("Copy editing and polish (you supply the text)", "Copy editing and polish"), "Contact form", "Mobile &amp; SEO basics", "14 days of support"]),
    ("Starter", "$2,000", ["Up to 5 pages", "Custom design", "1 revision round", ("Copy editing and polish (you supply the text)", "Copy editing and polish"), "Contact form", "Mobile &amp; SEO basics", "30 days of support"]),
    ("Business", "$4,000", ["Up to 10 pages", "Up to 3 design rounds", "Plus a final tweaks round", ("Copywriting: we draft, you edit", "Copywriting"), "Blog or news section", "Analytics &amp; tracking setup", "Local SEO configuration", "90 days of support"]),
    ("Commerce", "$8,000", ["Full store build", "Up to 3 design rounds", "Plus a final tweaks round", "Payments, shipping &amp; tax", "Product import", "Email &amp; abandoned cart flows", "Team training session", "6 months of support"]),
]


def cylinder(indent, label, h='h3', loop=False):
    pad = ' ' * indent
    out = [f'{pad}<section class="kws-cyl" data-kws="cylinder" data-noun="step"{"" if loop else chr(32) + chr(100) + "ata-loop=" + chr(34) + "false" + chr(34)} aria-label="{label}">', f'{pad}  <ol class="kws-cyl-track">']
    for i, (service, fee, title, art, text) in enumerate(STORY, 1):
        out += [f'{pad}    <li class="kws-cyl-card">',
                f'{pad}      <p class="kws-cyl-tag"><b aria-hidden="true">{i}</b><span>{service} <strong>{fee}</strong></span></p>',
                f'{pad}      <{h} class="kws-cyl-title">{title}</{h}>',
                f'{pad}      <div class="kws-cyl-art">',
                f'{pad}        <span class="kws-cyl-eg">Example</span>',
                f'{pad}        ' + art.replace('\n            ', '\n' + pad + '        '),
                f'{pad}      </div>',
                f'{pad}      <p class="kws-cyl-text">{text}</p>',
                f'{pad}    </li>']
    out += [f'{pad}  </ol>', f'{pad}</section>']
    return '\n'.join(out)


def ring(indent, h='h3'):
    pad = ' ' * indent
    out = [f'{pad}<div class="kws-ring" data-kws="ring">', f'{pad}  <div class="kws-ring-stage" aria-hidden="true"></div>', f'{pad}  <div class="kws-ring-lists">']
    for name, price, items in GROUPS:
        out += [f'{pad}    <div class="kws-ring-group">', f'{pad}      <{h} class="kws-ring-name">{name}</{h}>', f'{pad}      <p class="kws-ring-price">{price}</p>', f'{pad}      <ul>']
        for it in items:
            out.append(f'{pad}        <li data-short="{it[1]}">{it[0]}</li>' if isinstance(it, tuple) else f'{pad}        <li>{it}</li>')
        out += [f'{pad}      </ul>', f'{pad}    </div>']
    out += [f'{pad}  </div>', f'{pad}</div>']
    return '\n'.join(out)


page = (HERE / 'demo.template.html').read_text()
page = (page.replace('<!--HEAD_SCRIPT-->', HEAD_SCRIPT)
        .replace('<!--CYL_SITE-->', cylinder(4, 'One missed call, followed through to the review'))
        .replace('<!--RING_SITE-->', ring(6))
        .replace('<!--CYL_CLIENT-->', cylinder(4, 'One missed call, followed through, in a client palette'))
        .replace('<!--RING_CLIENT-->', ring(6))
        .replace('<!--ARROW-->', ARROW))
(KIT / 'demo.html').write_text(page)
print('demo.html', len(page))

bare = (HERE / 'bare.template.html')
if bare.exists():
    # A client-like page: no site stylesheet, so the art slot holds a plain placeholder and each card ends in a link.
    plain = [(service, fee, title, '<div class="pic"></div>', text + f' <a href="#step-{i}">More on step {i}</a>') for i, (service, fee, title, art, text) in enumerate(STORY, 1)]
    keep, STORY[:] = list(STORY), plain
    b = bare.read_text().replace('<!--CYL-->', cylinder(2, 'How it works, step by step', loop=True)).replace('<!--RING-->', ring(2))
    STORY[:] = keep
    (HERE / 'bare.html').write_text(b)
    print('test/bare.html', len(b))
