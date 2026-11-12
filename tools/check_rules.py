#!/usr/bin/env python3
"""Check the site against "The rules that protect the business" in the README.

    python3 tools/check_rules.py          FAIL / WARN / PASS lines; exit 1 if anything FAILs

What it checks (writes nothing):
  1. Banned words: the terms rule 5 keeps off the site, in every tracked text file and file name.
     They are stored encoded below so that they never appear in the published files themselves.
  2. Price wording: "from $", "starting at", "as low as", "ballpark", price ranges, and amounts
     written without a comma ($1000).
  3. Prices in step: every JSON-LD offer price on every page against the README's "Current
     published prices" table; package names written next to a price on any page; dollar amounts
     that aren't a published price or one derived from one (WARN, for a human to look at).
  4. Asset versions: every ?v= on every page carries the same number.
  5. FAQ answers mirror the FAQPage structured data word for word.
  6. Contact facts: every tel: link, written phone number and email address is the business's.
  7. Sitemap: every indexable page is listed, nothing noindex or missing is.
  8. One <h1> per page; no inline style="" except a custom property (style="--w:50").
  9. The props rule: at most one .tilt per page; the testimonials block is still commented out
     (WARN when it isn't, so a person confirms every quote is real).
 10. Runs tools/sync_chrome.py --check and tools/check_pricing.py.
"""
import base64
import html
import json
import pathlib
import re
import subprocess
import sys

sys.dont_write_bytecode = True
ROOT = pathlib.Path(__file__).resolve().parents[1]
PHONE_TEXT, PHONE_TEL, PHONE_LD = "(225) 255-0837", "tel:+12252550837", "+1-225-255-0837"
EMAIL = "knightwebstudio1@gmail.com"
TEXT_EXT = {".html", ".css", ".js", ".md", ".json", ".xml", ".txt", ".webmanifest", ".svg", ".py", ".inc", ".mjs", ".yml", ".yaml"}
# Rule 5's terms, base64-encoded (case-sensitive ones first). Decoded only in memory.
_B = ["XGJBSVxi", "KD9pKVxiYXJ0aWZpY2lhbFtccy1dK2ludGVsbGlnZW5jZVxi", "KD9pKVxiY2hhdFtccy1dKmJvdHM/XGI=", "KD9pKVxiKGNoYXQpP2dwdFtcZC4tXSpcYg==", "KD9pKVxibWFjaGluZVtccy1dK2xlYXJuaW5nXGI="]
BANNED = [re.compile(base64.b64decode(b).decode()) for b in _B]

results = {"FAIL": [], "WARN": [], "PASS": []}


def add(level, msg):
    results[level].append(msg)


def tracked():
    # Tracked files plus new ones not yet added (but not git-ignored), so a new page is checked too.
    out = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=ROOT, capture_output=True, text=True)
    files = out.stdout.split() if out.returncode == 0 else [str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts]
    return [ROOT / f for f in files]


def pages():
    return sorted(p for p in ROOT.rglob("*.html") if ".git" not in p.parts and "tools" not in p.parts and "server" not in p.parts)


def visible(h):
    h = re.sub(r"<!--.*?-->", " ", h, flags=re.S)
    h = re.sub(r"<(script|style|svg)\b.*?</\1>", " ", h, flags=re.S | re.I)
    return " ".join(html.unescape(re.sub(r"<[^>]+>", " ", h)).split())


def url_of(p):
    rel = p.relative_to(ROOT).as_posix()
    return "/" + rel[: -len("index.html")] if rel.endswith("index.html") else "/" + rel


def jsonld(h):
    out = []
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', h, re.S):
        try:
            out.append(json.loads(m.group(1)))
        except json.JSONDecodeError as e:
            add("FAIL", f"invalid JSON-LD: {e}")
    return out


def walk(o):
    if isinstance(o, dict):
        yield o
        for v in o.values():
            yield from walk(v)
    elif isinstance(o, list):
        for v in o:
            yield from walk(v)


def tokens(name):
    name = re.sub(r"\(.*?\)", " ", name.lower()).replace("—", " ").replace("&", " ")
    return frozenset(w for w in re.findall(r"[a-z]+", name) if w not in {"website", "plan", "setup", "and", "the", "a"})


def match_name(name, name_tok):
    """The README item whose words best match an offer name ("Google Business Profile & reviews
    setup" is "Google profile & reviews setup", not the Business package)."""
    key = tokens(name)
    if key in name_tok:
        return name_tok[key]
    best = [(len(t & key), kv) for t, kv in name_tok.items() if t and (t <= key or key <= t)]
    best.sort(key=lambda x: -x[0])
    return best[0][1] if best and (len(best) == 1 or best[0][0] > best[1][0]) else None


def readme_prices():
    t = (ROOT / "README.md").read_text()
    i = t.find("Current published prices")
    table = {}
    for line in t[i:].splitlines()[1:]:
        if line.startswith("|") and "$" in line:
            cells = [c.strip() for c in line.strip("|").split("|")]
            m = re.search(r"\$([\d,]+)", cells[1])
            if m:
                table[cells[0]] = int(m.group(1).replace(",", ""))
        elif table and not line.startswith("|"):
            break
    return table


def check_banned(files):
    hits = 0
    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        for rx in BANNED:
            if rx.search(rel):
                add("FAIL", f"banned term in a file name: {rel}")
                hits += 1
        if f.suffix.lower() not in TEXT_EXT or f.name == "check_rules.py":
            continue
        try:
            text = f.read_text(errors="ignore")
        except OSError:
            continue
        text = re.sub(r"data:[\w/+.-]+;base64,[A-Za-z0-9+/=]+", " ", text)
        for n, line in enumerate(text.splitlines(), 1):
            for rx in BANNED:
                m = rx.search(line)
                if m:
                    add("FAIL", f"banned term (rule 5) in {rel}:{n}: …{line[max(0, m.start() - 30):m.end() + 30].strip()}…")
                    hits += 1
    if not hits:
        add("PASS", "no banned terms in any tracked file or file name")


def check_pages(table):
    name_tok = {tokens(k): (k, v) for k, v in table.items()}
    packages = {"One-page": table.get("One-page"), "Starter": table.get("Starter"),
                "Business": table.get("Business"), "Commerce": table.get("Commerce")}
    allowed = set(table.values())
    for v in [x for x in packages.values() if x]:
        half = v // 2
        allowed |= {half, half // 2, half // 3, round(half / 3), half // 3 + 1}
    allowed |= {1500, 500, 3000, 333, 2, 1}  # Launch bundle terms; "$1" test plan
    parts = [match_name(n, name_tok) for n in ("Starter", "Google profile & reviews setup", "Missed-call text-back setup")]
    if all(parts):
        allowed.add(sum(v for _, v in parts))  # the bundle's "bought separately" total
    versions, page_problems = {}, 0
    sitemap = (ROOT / "sitemap.xml").read_text() if (ROOT / "sitemap.xml").exists() else ""
    in_map = set(re.findall(r"<loc>https?://[^/<]+(/[^<]*)</loc>", sitemap))
    for p in pages():
        rel = p.relative_to(ROOT).as_posix()
        h = p.read_text()
        text = visible(h)
        noindex = bool(re.search(r'<meta name="robots" content="[^"]*noindex', h))
        # 2. price wording
        for rx, why in ((r"\bfrom \$", '"from $"'), (r"\bstarting at\b", '"starting at"'), (r"\bas low as\b", '"as low as"'),
                        (r"\bballpark\b", '"ballpark"'), (r"\$[\d,]+(?:\.\d\d)?\s*(?:–|—|-|to)\s*\$[\d,]+", "a price range"),
                        (r"\$\d{4,}\b", "an amount without a comma")):
            for m in re.finditer(rx, text, re.I):
                add("FAIL", f"{rel}: {why}: …{text[max(0, m.start() - 40):m.end() + 30]}…")
                page_problems += 1
        # 3. prices
        for d in jsonld(h):
            for o in walk(d):
                if "price" in o and o.get("name"):
                    hit = match_name(o["name"], name_tok)
                    if not hit:
                        add("WARN", f"{rel}: JSON-LD offer {o['name']!r} isn't in the README price table")
                    elif int(float(o["price"])) != hit[1]:
                        add("FAIL", f"{rel}: JSON-LD {o['name']!r} is ${o['price']}, README says ${hit[1]:,} ({hit[0]})")
                        page_problems += 1
        for name, price in packages.items():
            if not price:
                continue
            for m in re.finditer(rf"\b{re.escape(name)}(?:\s+(?:website|package|site))?\s*[:,–-]?\s*\$(\d{{1,3}}(?:,\d{{3}})*)(?![\d,])", text):
                amount, after = int(m.group(1).replace(",", "")), text[m.end():m.end() + 40]
                if re.match(r"\s*(?:/\s*mo|/\s*month|a month)", after):
                    continue  # a care plan ("Commerce $1,000/month"), not the package
                if amount == price // 2 and re.search(r"final|deposit|down|50%|half|balance", after, re.I):
                    continue  # the deposit or final half of the package
                if amount != price:
                    add("FAIL", f"{rel}: {name} shown as ${m.group(1)}, README says ${price:,}")
                    page_problems += 1
        # The calculator's default results are labelled estimates (rule 4); leave them out here.
        scan = visible(re.sub(r'<section[^>]*id="calculator".*?(?=<section\b)', " ", h, flags=re.S))
        odd = sorted({int(a.replace(",", "")) for a in re.findall(r"\$(\d{1,3}(?:,\d{3})*)(?![\d,])", scan)} - allowed - {0})
        if odd:
            add("WARN", f"{rel}: amounts not in the price table (check they're current): " + ", ".join(f"${x:,}" for x in odd))
        # 4. versions
        for v in re.findall(r"\?v=(\d+)", h):
            versions.setdefault(v, set()).add(rel)
        # 6. contact facts
        for tel in set(re.findall(r'href="(tel:[^"]+)"', h)):
            if tel != PHONE_TEL:
                add("FAIL", f"{rel}: phone link {tel} (should be {PHONE_TEL})")
        for ph in set(re.findall(r"\(\d{3}\)\s?\d{3}-\d{4}", text)):
            if ph != PHONE_TEXT:
                add("FAIL", f"{rel}: phone number {ph} (should be {PHONE_TEXT})")
        for em in set(re.findall(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", text + " " + " ".join(re.findall(r'mailto:([^"?]+)', h)))):
            if em.lower() != EMAIL:
                add("FAIL", f"{rel}: email address {em} (should be {EMAIL})")
        for d in jsonld(h):
            for o in walk(d):
                if "telephone" in o and o["telephone"] != PHONE_LD:
                    add("FAIL", f"{rel}: JSON-LD telephone {o['telephone']}")
        # 7. sitemap
        u = url_of(p)
        if p.name == "404.html":
            pass
        elif noindex and u in in_map:
            add("FAIL", f"{rel}: noindex page is in sitemap.xml")
        elif not noindex and u not in in_map:
            add("FAIL", f"{rel}: indexable page missing from sitemap.xml ({u})")
        # 8. structure
        h1 = len(re.findall(r"<h1\b", re.sub(r"<!--.*?-->", "", h, flags=re.S)))
        if h1 != 1:
            add("FAIL", f"{rel}: {h1} <h1> elements (want exactly 1)")
        for s in re.findall(r'\sstyle="([^"]*)"', h):
            if not all(part.strip().startswith("--") for part in s.split(";") if part.strip()):
                add("FAIL", f'{rel}: inline style="{s}" (only custom properties are allowed)')
        # 9. props
        tilts = len(re.findall(r'class="[^"]*\btilt\b', h))
        if tilts > 1:
            add("FAIL", f"{rel}: {tilts} tilted objects (at most one a page)")
    for loc in in_map:
        f = ROOT / loc.lstrip("/") / "index.html" if loc.endswith("/") else ROOT / loc.lstrip("/")
        if not f.exists():
            add("FAIL", f"sitemap.xml lists {loc}, which has no page")
    if len(versions) > 1:
        add("FAIL", "asset versions differ: " + "; ".join(f"?v={v} on {len(ps)} page(s), e.g. {sorted(ps)[0]}" for v, ps in sorted(versions.items())))
    elif versions:
        add("PASS", f"every asset link carries ?v={next(iter(versions))}")
    home = (ROOT / "index.html").read_text()
    if "TESTIMONIALS-START" not in home:
        add("WARN", "the testimonials block on the home page is switched on: confirm every quote is real and approved (rule 2)")
    if not page_problems:
        add("PASS", f"price wording and package prices agree with the README on {len(pages())} pages")


def check_faq():
    f = ROOT / "faq" / "index.html"
    if not f.exists():
        return
    h = f.read_text()
    norm = lambda s: " ".join(html.unescape(re.sub(r"<[^>]+>", " ", s)).split())
    ld = {}
    for d in jsonld(h):
        for o in walk(d):
            if o.get("@type") == "Question":
                ld[norm(o.get("name", ""))] = norm((o.get("acceptedAnswer") or {}).get("text", ""))
    shown = {}
    for m in re.finditer(r"<details\b[^>]*>\s*<summary\b[^>]*>(.*?)</summary>(.*?)</details>", h, re.S):
        shown[norm(m.group(1))] = norm(m.group(2))
    bad = 0
    for q, a in shown.items():
        if q not in ld:
            add("FAIL", f"faq: question not in the FAQPage data: {q[:70]}")
            bad += 1
        elif ld[q] != a:
            add("FAIL", f"faq: answer differs from the FAQPage data: {q[:70]}")
            bad += 1
    for q in set(ld) - set(shown):
        add("FAIL", f"faq: FAQPage data has a question the page doesn't show: {q[:70]}")
        bad += 1
    if not bad:
        add("PASS", f"all {len(shown)} FAQ answers match the structured data")


def run_tool(args, label):
    p = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True)
    if p.returncode == 0:
        add("PASS", label)
    else:
        add("FAIL", f"{label} failed: {(p.stdout + p.stderr).strip()[:400]}")


def main():
    table = readme_prices()
    if not table:
        add("FAIL", "couldn't read the README's 'Current published prices' table")
    check_banned(tracked())
    check_pages(table)
    check_faq()
    run_tool(["tools/sync_chrome.py", "--check"], "header, footer and phone bar in step (sync_chrome.py --check)")
    run_tool(["tools/check_pricing.py"], "pricing table and phone folders agree (check_pricing.py)")
    for level in ("FAIL", "WARN", "PASS"):
        for msg in results[level]:
            print(f"{level:4}  {msg}")
    print(f"\n{len(results['FAIL'])} fail, {len(results['WARN'])} warn, {len(results['PASS'])} pass")
    sys.exit(1 if results["FAIL"] else 0)


if __name__ == "__main__":
    main()
