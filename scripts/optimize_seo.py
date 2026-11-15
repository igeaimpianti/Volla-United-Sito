#!/usr/bin/env python3
"""Complete missing SEO metadata and correct canonical URLs for public pages.
Preserves editorial titles, descriptions, images and existing structured data.
"""
from pathlib import Path
from html import escape, unescape
from html.parser import HTMLParser
from urllib.parse import quote, urlparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.vollaunitedacademy.com"
LOGO = BASE + "/assets/volla-google-logo-1200.png"
EXCLUDE = {"404.html"}
SKIP_DIRS = {".git", ".github", "node_modules", "scripts", "tests", "dist"}

class ParseHead(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags = []
        self.title = ""
        self.in_title = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag in ("meta", "link"):
            self.tags.append((tag, attrs))
    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
    def handle_data(self, data):
        if self.in_title:
            self.title += data
    def field(self, tag, key, value, attr="content"):
        for t, attrs in self.tags:
            if t == tag and attrs.get(key, "").lower() == value.lower():
                return attrs.get(attr, "")
        return ""
    def canonical(self):
        for t, attrs in self.tags:
            if t == "link" and "canonical" in attrs.get("rel", "").lower().split():
                return attrs.get("href", "")
        return ""

def add_tag(head, element):
    return head + "\n" + element

def replace_or_add_canonical(head, url, current):
    tag = '<link rel="canonical" href="' + escape(url, quote=True) + '">'
    if not current:
        return add_tag(head, tag)
    return re.sub(r'<link\b(?=[^>]*\brel="canonical")[^>]*>', lambda _: tag, head, count=1, flags=re.I)

def set_meta(head, key, name, value, overwrite=False):
    # Do not alter an editorially selected value unless the field is a page URL.
    regexp = re.compile(r'<meta\b(?=[^>]*\b' + re.escape(key) + r'="' + re.escape(name) + r'")[^>]*>', re.I)
    tag = '<meta ' + key + '="' + name + '" content="' + escape(value, quote=True) + '">'
    if regexp.search(head):
        return regexp.sub(lambda _: tag, head, count=1) if overwrite else head
    return add_tag(head, tag)

def main():
    changes = []
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT)
        if path.name in EXCLUDE or any(x.startswith(".") or x in SKIP_DIRS for x in rel.parts[:-1]):
            continue
        raw = path.read_text(encoding="utf-8", errors="replace")
        match = re.search(r'<head\b[^>]*>([\s\S]*?)</head\s*>', raw, re.I)
        if not match:
            continue
        head = match.group(1)
        parser = ParseHead()
        parser.feed(head)
        robots = parser.field("meta", "name", "robots")
        if "noindex" in robots.lower():
            continue
        url = BASE + ("/" if rel.as_posix() == "index.html" else "/" + quote(rel.as_posix(), safe="/-._~"))
        raw_title = unescape(parser.title).strip()
        title = raw_title or (path.stem.replace("-", " ").title() + " | Volla United Academy")
        description = parser.field("meta", "name", "description").strip()
        if not description:
            excerpt = re.search(r'<(?:p|h1)\b[^>]*>([\s\S]*?)</(?:p|h1)>', raw[match.end():], re.I)
            plain = re.sub(r'<[^>]+>', " ", excerpt.group(1)) if excerpt else ""
            plain = re.sub(r'\s+', " ", unescape(plain)).strip()
            description = (plain[:155].rsplit(" ", 1)[0] if len(plain) > 155 else plain) or (title + ". Notizie, squadre e aggiornamenti ufficiali Volla United Academy.")
        if not raw_title:
            head = add_tag(head, "<title>" + escape(title) + "</title>")
        head = set_meta(head, "name", "description", description)
        head = replace_or_add_canonical(head, url, parser.canonical())
        head = set_meta(head, "name", "robots", "index,follow,max-image-preview:large")
        head = set_meta(head, "property", "og:type", "article" if rel.parts[0] == "notizie" else "website")
        head = set_meta(head, "property", "og:site_name", "Volla United Academy")
        head = set_meta(head, "property", "og:title", title)
        head = set_meta(head, "property", "og:description", description)
        head = set_meta(head, "property", "og:url", url, overwrite=True)
        head = set_meta(head, "property", "og:image", LOGO)
        head = set_meta(head, "property", "og:locale", "it_IT")
        head = set_meta(head, "name", "twitter:card", "summary_large_image")
        head = set_meta(head, "name", "twitter:title", title)
        head = set_meta(head, "name", "twitter:description", description)
        img = parser.field("meta", "property", "og:image") or LOGO
        head = set_meta(head, "name", "twitter:image", img)
        structured = re.findall(r'<script\b[^>]*type=["\\']application/ld\+json["\\'][^>]*>([\s\S]*?)</script>', head, re.I)
        has_page = any('"WebPage"' in s or '"NewsArticle"' in s or '"Article"' in s for s in structured)
        if not has_page:
            data = {"@context": "https://schema.org",
                    "@type": "NewsArticle" if rel.parts[0] == "notizie" else "WebPage",
                    "headline" if rel.parts[0] == "notizie" else "name": title,
                    "description": description, "url": url, "inLanguage": "it-IT",
                    "isPartOf": {"@type": "WebSite", "name": "Volla United Academy", "url": BASE + "/"}}
            if rel.parts[0] == "notizie":
                data["image"] = [img]
                data["publisher"] = {"@type": "Organization", "name": "Volla United Academy", "logo": {"@type": "ImageObject", "url": LOGO}}
            head = add_tag(head, '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\u003c") + '</script>')
        updated = raw[:match.start(1)] + head + raw[match.end(1):]
        if updated != raw:
            path.write_text(updated, encoding="utf-8")
            changes.append(str(rel))
    print(f"SEO metadata updated in {len(changes)} pages")
    for change in changes:
        print(" - " + change)

if __name__ == "__main__":
    main()
