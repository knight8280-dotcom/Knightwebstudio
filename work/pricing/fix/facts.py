#!/usr/bin/env python3
"""Fact and link audit of /pricing/ against the live (baseline) page. Read-only."""
import re, html, pathlib, collections
R = pathlib.Path('/tmp/claude-0/-home-user/aaaceb94-f42a-5d99-810c-a390cdbb75d0/scratchpad/refresh')
def main_of(p):
    t = pathlib.Path(p).read_text()
    t = re.sub(r'(<!-- art:[a-z0-9-]+ -->).*?(<!-- /art:[a-z0-9-]+ -->)', '', t, flags=re.S)
    return re.search(r'<main.*?</main>', t, re.S).group(0)
def text(m):
    m = re.sub(r'<(script|style)\b.*?</\1>', ' ', m, flags=re.S)
    m = re.sub(r'<[^>]+>', ' ', m)
    m = html.unescape(m).replace(' ', ' ').replace('–', '-').replace('—', '-').replace('’', "'")
    return re.sub(r'\s+', ' ', m).strip()
old, new = main_of(R / 'baseline/pricing/index.html'), main_of('/home/user/Knightwebstudio/pricing/index.html')
to, tn = text(old), text(new)

# 1. every money figure, with multiplicity not lower than a sensible floor
po, pn = collections.Counter(re.findall(r'\$[\d,]+(?:/mo)?', to)), collections.Counter(re.findall(r'\$[\d,]+(?:/mo)?', tn))
print('prices on the live page missing from the new page:', sorted(set(po) - set(pn)) or 'none')
print('prices on the new page that the live page does not have:', sorted(set(pn) - set(po)) or 'none')

# 2. fact strings (inclusions, timelines, support periods, payment terms, care terms), as written on the live page
facts = '''Or $500 down, then about $167/mo for 3 months|One polished page: who you are, what you offer and how to reach you.|as little as 7 days|1 page|Custom design|1 revision round|Copy editing and polish (you supply the text)|Contact form|Mobile & SEO basics|14 days
Or $1,000 down, then about $333/mo for 3 months|An information website: who you are, what you offer and how to reach you.|as little as 7-10 days|Up to 5 pages|30 days
Or $2,000 down, then about $667/mo for 3 months|The full marketing site most growing businesses need.|2-4 weeks|Up to 10 pages|Up to 3 design rounds, plus a final tweaks round|Copywriting: we draft, you edit|Blog or news section|Analytics & tracking setup|Local SEO configuration|90 days|Most popular
Or $4,000 down, then about $1,333/mo for 3 months|Sell online, with the operations side set up properly.|4-6 weeks|Full store build|Payments, shipping & tax|Product import|Email & abandoned cart flows|Team training session|6 months
Start a one-page site|Pay 50% deposit - $1,000|Pay 50% deposit - $2,000|Pay 50% deposit - $4,000
Brand identity|Logo and mark, colours, fonts, a brand guidelines document and social templates.|Booking & scheduling setup|Branded booking, service config, calendars and automatic text and email reminders.|CRM & calendar sync|Enquiries land in your CRM automatically - no re-typing, nothing lost.
free online check|$350 Growth Audit|set up only what your business needs|Software and texting services run on accounts in your name, with their fees paid to the provider.
Growth Audit & action plan|60-minute session and a written plan ranked by impact. The $350 comes off any project booked within 30 days.|Strategy session|60 minutes on one question, with written notes afterwards.
Google profile & reviews|Profile completed, listings made consistent, review link, QR code and reply templates.|Missed-call text-back|Every missed call gets a text back from your business number within a minute.
Lead follow-up system|Every enquiry in one list, automatic follow-ups on quiet quotes, review requests after each job.|Custom automation workflow|One process automated end to end, with a recorded walkthrough and 30 days of fixes.
Advisor plan|Monthly strategy call, Google profile managed, review replies and a monthly report.|Partner plan|Everything in Advisor, two calls a month and up to 5 hours of hands-on work a month.
Launch bundle|Starter website|$3,250|Bought separately|$3,000
A site isn't finished at launch - it needs patching, monitoring and small changes, or it quietly rots. We keep yours fast, current and online, and you get a person who already knows your site when something needs doing.
One-page and Starter sites|1 small change a month, made within 5 business days|You keep your own domain and hosting renewals current|Brochure and marketing sites|Changes made within 4 business days, up to 2 requests a month
Sites with booking or lead flows|Changes made within 2 business days, up to 5 requests a month|Your Netlify hosting, SSL and IONOS domain renewals looked after (domain and hosting costs billed at cost on top)
Stores and integrations|Same-day response for urgent issues, unlimited small requests and a direct text line
Every plan includes|Daily off-site backups, restored on request|24/7 uptime monitoring with alerts|Security patches and platform updates|Error monitoring, with fixes when something breaks|Changes you request, made for you|No long-term contract or minimum term. Cancel or change with 10 days' written notice , no fee.
Standard is 50% to start and 50% at launch.|Payment plans are available on all projects: 50% up front, then the rest in up to 3 equal monthly payments, the first due one month after the deposit (on Starter, $1,000 down, then about $333 a month for 3 months).|Pay by card or ACH bank transfer through Stripe, or by check on request.|The details are in our terms
What you see is what you pay, confirmed in writing|Fixed prices, published up front|Still deciding? Book the free call.|Thirty minutes, no pitch. You'll get a clear view of what your website and your systems need, and what it should cost - even if you do it yourself.'''
squash = lambda s: re.sub(r'\s+', ' ', s).replace(' ,', ',').lower()
tn2 = squash(tn)
miss = [f for line in facts.split('\n') for f in line.split('|') if squash(f) not in tn2]
print('fact strings checked:', sum(len(l.split('|')) for l in facts.split('\n')), '| missing:', miss or 'none')
# support periods must sit in the Support row of the right package
rows = re.findall(r'<tr role="row"[^>]*>(.*?)</tr>', re.search(r'<table class="spec".*?</table>', new, re.S).group(0), re.S)[1:]
for r in rows:
    name = text(re.search(r'<th[^>]*>(.*?)</th>', r, re.S).group(1)); sup = re.search(r'Support</span>([^<]+)</td>', r).group(1); live = text(re.search(r'Live in</span>(.*?)</td>', r, re.S).group(1))
    print('   ', name.ljust(22), '| live in:', live.ljust(24), '| support:', sup)

# 3. links: every live call to action keeps its href; list what the new page adds
hrefs = lambda m: collections.Counter(h for h in re.findall(r'<a\b[^>]*\bhref="([^"]+)"', m))
ho, hn = hrefs(old), hrefs(new)
print('live hrefs missing from the new page:', sorted(set(ho) - set(hn)) or 'none')
for h in sorted(set(ho) | set(hn)):
    print(f'    {h:38} live x{ho[h]}  new x{hn[h]}' + ('' if h in ho else '   (added)'))
print('booking buttons (data-booking): live', len(re.findall(r'<a\b[^>]*data-booking', old)), 'new', len(re.findall(r'<a\b[^>]*data-booking', new)))
