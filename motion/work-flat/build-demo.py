#!/usr/bin/env python3
"""Working aid: writes kit/flat/demo.html and kit/flat/test/bare.html from one list of services and projects,
so the copy in both stays identical. The pages it writes are plain HTML; this script does not ship."""
import html, pathlib
KIT = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh/motion/kit/flat')

# The nine services in the order of /services/ today, with that page's price wording and ids.
SERVICES = [
 ('Websites', 'Website design &amp; build', '$1,000, $2,000 or $4,000', 'A custom-designed marketing site, built from scratch and mobile-first.', 'website-design',
  '<rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M3 9h18M6.5 13h6M6.5 16h4"/>'),
 ('Rescues', 'Redesigns &amp; rescues', 'priced as a new site', 'Dated, slow or abandoned sites rebuilt without losing your search rankings.', 'redesigns',
  '<path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M20 4v4.5h-4.5M4 20v-4.5h4.5"/>'),
 ('Stores', 'E-commerce stores', '$8,000', 'Sell online with a checkout people trust: Shopify, or a custom store.', 'ecommerce',
  '<path d="M5.5 8.5h13l-1 11h-11l-1-11Z"/><path d="M9 11.5v-4a3 3 0 0 1 6 0v4"/>'),
 ('Brand', 'Brand &amp; identity', '$1,500', 'Logo, colours and type, so everything you publish looks like one company.', 'brand',
  '<path d="m4 20 1.2-4.8L16.5 4 20 7.5 8.8 18.8 4 20Z"/><path d="m14 6.5 3.5 3.5"/>'),
 ('SEO', 'SEO &amp; performance', 'in every build', 'Get found and stay fast, with analytics you can actually read.', 'seo',
  '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/>'),
 ('Care', 'Care &amp; maintenance', '$125, $300, $600 or $1,000/mo', 'Updates, backups, uptime monitoring and security patches.', 'care',
  '<path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6l-7-2.5Z"/><path d="m9 12 2.2 2.2L15.2 10"/>'),
 ('Automation', 'Automation', '$750 or $1,500 per setup', 'Missed calls texted back, bookings and reminders, quotes followed up.', 'automation',
  '<path d="M4.5 5.5h15v10h-9l-4 3.5v-3.5h-2v-10Z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>'),
 ('Growth', 'Growth consulting', '$350 audit · $500 or $1,000/mo', 'A clear plan for getting more customers, starting with a free online check.', 'growth-consulting',
  '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>'),
 ('Google', 'Google profile &amp; reviews', '$500', 'Your Google profile filled out properly, and a simple way to ask for reviews.', 'google-reviews',
  '<path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>'),
]
# The three projects with the Work page's labels, images and alt text. The second half of a label is kept on one line.
PROJECTS = [
 ('smilyssoftwash.com', 'work-smilyssoftwash.jpg', 600, 'Smilys Softwash — before and after of a soft-washed roof and house exterior',
  'Exterior cleaning ·&nbsp;Local&nbsp;service&nbsp;&amp;&nbsp;SEO', 'Smilys Softwash',
  'Roof and house soft washing across Greater Baton Rouge: a service page per treatment, a before-and-after gallery and online quote requests.', 'smilys-softwash'),
 ('risenhealthco.com', 'work-risenhealthco.jpg', 630, 'Risen Health — a vial of BPC-157 beside the tagline &quot;Rise into divine health&quot;',
  'Health &amp; wellness ·&nbsp;Online&nbsp;store', 'Risen Health',
  'An online store for a family-owned peptide supplier: a 36-product catalog across eight categories, with a page for every product.', 'risen-health'),
 ('corbelbooks.com', 'work-corbelbooks.jpg', 630, 'Corbel Books homepage — bookkeeping and invoicing for small businesses',
  'Bookkeeping software ·&nbsp;Product&nbsp;site&nbsp;&amp;&nbsp;app&nbsp;screens', 'Corbel Books',
  'A full product site and dashboard for an invoicing and cash-flow tool, with Stripe card payments and Plaid bank sync.', 'corbel-books'),
]

def arc(h, label, ind='      '):
    out = [f'{ind}<section class="kws-arc" data-kws="arc" data-noun="service" {label}>', f'{ind}  <ul class="kws-arc-list">']
    for short, name, price, line, anchor, icon in SERVICES:
        out += [f'{ind}    <li class="kws-arc-item">',
                f'{ind}      <div class="kws-arc-tile" aria-hidden="true"><svg viewBox="0 0 24 24">{icon}</svg>{short}</div>',
                f'{ind}      <div class="kws-arc-cap">',
                f'{ind}        <{h} class="kws-arc-name">{name}</{h}>',
                f'{ind}        <p class="kws-arc-price">{price}</p>',
                f'{ind}        <p class="kws-arc-line">{line}</p>',
                f'{ind}        <a class="kws-arc-link" href="/services/#{anchor}" aria-label="See what\'s included in {name}">See what\'s included</a>',
                f'{ind}      </div>', f'{ind}    </li>']
    return '\n'.join(out + [f'{ind}  </ul>', f'{ind}</section>'])

def spot(h, label, ind='      ', first_eager=False):
    out = [f'{ind}<section class="kws-spot" data-kws="spotlight" data-noun="project" {label}>', f'{ind}  <ul class="kws-spot-list">']
    for host, img, ih, alt, kind, name, text, anchor in PROJECTS:
        out += [f'{ind}    <li class="kws-spot-item">', f'{ind}      <div class="kws-spot-frame">',
                f'{ind}        <div class="kws-spot-bar" aria-hidden="true"><i></i><i></i><i></i><span>{host}</span></div>',
                f'{ind}        <img src="/assets/img/{img}" alt="{alt}" width="1200" height="{ih}" loading="lazy" decoding="async">',
                f'{ind}      </div>', f'{ind}      <div class="kws-spot-cap">',
                f'{ind}        <p class="kws-spot-kind">{kind}</p>',
                f'{ind}        <{h} class="kws-spot-name">{name}</{h}>',
                f'{ind}        <p class="kws-spot-text">{text}</p>',
                f'{ind}        <a class="kws-spot-link" href="/work/#{anchor}" aria-label="See the project: {name}">See the project</a>',
                f'{ind}      </div>', f'{ind}    </li>']
    return '\n'.join(out + [f'{ind}  </ul>', f'{ind}</section>'])

demo = (KIT / '../../work-flat/demo.tpl.html').resolve().read_text()
demo = demo.replace('{{ARC_SITE}}', arc('h3', 'aria-labelledby="svc-title"'))
demo = demo.replace('{{SPOT_SITE}}', spot('h3', 'aria-labelledby="spot-title"'))
demo = demo.replace('{{ARC_CLIENT}}', arc('h3', 'aria-label="The same services, on a client palette"'))
demo = demo.replace('{{SPOT_CLIENT}}', spot('h3', 'aria-label="The same projects, on a client palette"'))
(KIT / 'demo.html').write_text(demo)
bare = (KIT / '../../work-flat/bare.tpl.html').resolve().read_text()
bare = bare.replace('{{ARC}}', arc('h3', 'aria-label="Services and prices"', '  ')).replace('{{SPOT}}', spot('h3', 'aria-label="Recent projects"', '  '))
(KIT / 'test/bare.html').write_text(bare)
print('demo', len(demo), 'bare', len(bare))
