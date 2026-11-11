#!/usr/bin/env python3
"""Extract visible text of a page as one line per block, for proofreading."""
import sys, re, html
from html.parser import HTMLParser

BLOCK = set("p div section article header footer main nav aside h1 h2 h3 h4 h5 h6 ul ol li dl dt dd table thead tbody tfoot tr td th caption figure figcaption form fieldset legend label select option textarea button details summary blockquote address br hr pre".split())
SKIP = {"script", "style", "template", "noscript_"}
VOID = set("area base br col embed hr img input link meta param source track wbr".split())

class X(HTMLParser):
    def __init__(self, with_attrs=True):
        super().__init__(convert_charrefs=True)
        self.out = []
        self.cur = []
        self.skip = 0
        self.svg = 0
        self.in_body = False
        self.with_attrs = with_attrs
        self.stack = []
    def flush(self, tag=None):
        t = re.sub(r"[ \t\r\n\f]+", " ", "".join(self.cur)).strip()
        if t:
            self.out.append(t)
        self.cur = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "body":
            self.in_body = True
        if tag in SKIP:
            self.skip += 1
            return
        if tag == "svg":
            self.svg += 1
            if self.with_attrs and a.get("aria-label"):
                self.cur.append(" {svg aria-label: %s} " % a["aria-label"])
            return
        if self.svg:
            if tag in ("title", "desc", "text"):
                self.cur.append(" {svg-%s: " % tag)
            return
        if tag in BLOCK:
            self.flush()
        if not self.in_body:
            return
        if tag in ("h1","h2","h3","h4","h5","h6"):
            self.cur.append("[%s] " % tag.upper())
        if tag == "li": self.cur.append("* ")
        if tag == "summary": self.cur.append("[summary] ")
        if tag == "th": self.cur.append("[th] ")
        if tag == "td": self.cur.append("[td] ")
        if tag == "s" or tag == "del": self.cur.append("~~")
        if tag == "a":
            self.cur.append("<a %s> " % a.get("href", ""))
        if tag == "button":
            self.cur.append("<button> ")
        if tag == "option":
            self.cur.append("<option value=%r> " % a.get("value"))
        if tag == "input":
            self.cur.append("<input type=%s name=%s id=%s value=%r placeholder=%r> " % (a.get("type"), a.get("name"), a.get("id"), a.get("value"), a.get("placeholder")))
        if tag == "textarea":
            self.cur.append("<textarea name=%s placeholder=%r> " % (a.get("name"), a.get("placeholder")))
        if tag == "img":
            self.cur.append(" {img alt=%r src=%s} " % (a.get("alt"), a.get("src")))
        if self.with_attrs:
            for k in ("aria-label", "title", "data-label", "data-tip", "aria-description"):
                if a.get(k):
                    self.cur.append(" {%s: %s} " % (k, a[k]))
            if a.get("aria-hidden") == "true":
                self.cur.append(" {hidden>} ")
                self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in SKIP:
            self.skip = max(0, self.skip - 1); return
        if tag == "svg":
            self.svg = max(0, self.svg - 1); return
        if self.svg:
            if tag in ("title", "desc", "text"):
                self.cur.append("} ")
            return
        if tag == "s" or tag == "del": self.cur.append("~~")
        if tag == "a": self.cur.append(" </a>")
        if tag in BLOCK:
            self.flush()
    def handle_data(self, d):
        if self.skip: return
        if self.svg:
            # only text inside title/desc/text
            self.cur.append(d) if d.strip() else None
            return
        if not self.in_body: return
        self.cur.append(d)

def main():
    src = open(sys.argv[1], encoding="utf-8").read()
    x = X()
    x.feed(src); x.flush()
    print("\n".join(x.out))
main()
