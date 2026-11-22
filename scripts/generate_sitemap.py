#!/usr/bin/env python3
"""Regenerate sitemap.xml from public HTML pages in this GitHub Pages site."""
from datetime import datetime, timezone
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import quote
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://www.vollaunitedacademy.com"
SKIP_DIRS = {".git", ".github", "node_modules", "scripts", "tests", "test", "dist"}
SKIP_NAMES = {"404.html", "google-site-verification.html"}
ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
NS = "http://www.sitemaps.org/schemas/sitemap/0.9"

class HeadInfo(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_head = True
        self.noindex = False
        self.canonicals = set()
        self.article_modified = ""
    def handle_starttag(self, tag, attrs):
        if not self.in_head:
            return
        attrs = dict(attrs)
        if tag == "meta" and attrs.get("name", "").lower() in ("robots", "googlebot"):
            if "noindex" in attrs.get("content", "").lower():
                self.noindex = True
        if tag == "link" and "canonical" in attrs.get("rel", "").lower().split():
            self.canonicals.add(unescape(attrs.get("href", "")).rstrip("/"))
        if tag == "meta" and attrs.get("property") == "article:modified_time":
            self.article_modified = attrs.get("content", "")[:10]
    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False

def last_modified(path):
    try:
        result = subprocess.check_output(
            ["git", "-C", str(ROOT), "log", "-1", "--format=%cs", "--", str(path.relative_to(ROOT))],
            text=True, stderr=subprocess.DEVNULL
        ).strip()
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", result):
            return result
    except (OSError, subprocess.CalledProcessError):
        pass
    return datetime.now(timezone.utc).date().isoformat()

def main():
    urls = {}
    for path in ROOT.rglob("*.html"):
        rel = path.relative_to(ROOT)
        if any(part.startswith(".") or part in SKIP_DIRS for part in rel.parts[:-1]):
            continue
        if path.name.lower() in SKIP_NAMES:
            continue
        url_path = "/" if rel.as_posix() == "index.html" else "/" + quote(rel.as_posix(), safe="/-._~")
        url = BASE + url_path
        parser = HeadInfo()
        parser.feed(path.read_text(encoding="utf-8", errors="replace")[:250000])
        if parser.noindex:
            continue
        if parser.canonicals and parser.canonicals != {url.rstrip("/")}:
            continue
        if rel.parts[0] == "notizie" and re.fullmatch(r"\d{4}-\d{2}-\d{2}", parser.article_modified):
            urls[url] = parser.article_modified
        else:
            urls[url] = last_modified(path)
    root = ET.Element(f"{{{NS}}}urlset")
    for url in sorted(urls, key=lambda s: (s != BASE + "/", s)):
        entry = ET.SubElement(root, f"{{{NS}}}url")
        ET.SubElement(entry, f"{{{NS}}}loc").text = url
        ET.SubElement(entry, f"{{{NS}}}lastmod").text = urls[url]
    ET.indent(root, space="  ")
    output = ROOT / "sitemap.xml"
    output.write_bytes(b'<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="utf-8") + b"\n")
    print(f"Updated {output} with {len(urls)} public HTML pages")

if __name__ == "__main__":
    main()
