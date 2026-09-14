"""
Discover chapter links and titles from a book listing page.

This intentionally extracts metadata only (chapter title + URL).
It does not download or save book chapter text.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import requests
from bs4 import BeautifulSoup

try:
    from function.requests_retryer import requests_retry_session
except ImportError:
    # Portable fallback for machines that do not have the user's helper module.
    def requests_retry_session():
        return requests.Session()


DEFAULT_URL = "https://readfreebooksonline.org/manga/alchemised/"


def get_html(url: str) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/153.0.0.0 Safari/537.36"
        )
    }

    with requests_retry_session() as session:
        response = session.get(
            url,
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        return response.text


def parse_chapters(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    chapters = []
    seen = set()

    for anchor in soup.select('article.bs a[itemprop="url"]'):
        url = (anchor.get("href") or "").strip()
        title = (anchor.get("title") or anchor.get_text(" ", strip=True)).strip()

        if not url or "alchemised" not in url.lower() or url in seen:
            continue

        seen.add(url)

        if "prologue" in title.lower():
            order = 0
            label = "Prologue"
        else:
            match = re.search(r"chapter\s+(\d+)", title, re.I)

            if not match:
                continue

            order = int(match.group(1))
            label = f"Chapter {order}"

        chapters.append(
            {
                "order": order,
                "label": label,
                "title": title,
                "url": url,
                "slug": url.rstrip("/").split("/")[-1],
            }
        )

    return sorted(chapters, key=lambda item: item["order"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--url",
        default=DEFAULT_URL,
        help="Listing page containing article.bs chapter cards.",
    )
    parser.add_argument(
        "--html",
        help="Optional local HTML file instead of requesting the website.",
    )
    parser.add_argument(
        "--output",
        default="chapters.discovered.json",
    )
    args = parser.parse_args()

    if args.html:
        html = Path(args.html).read_text(
            encoding="utf-8",
            errors="replace",
        )
    else:
        html = get_html(args.url)

    chapters = parse_chapters(html)

    Path(args.output).write_text(
        json.dumps(chapters, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Found {len(chapters)} chapters")
    print(f"Saved metadata to {args.output}")

    if chapters:
        print(f"First: {chapters[0]['label']} -> {chapters[0]['url']}")
        print(f"Last : {chapters[-1]['label']} -> {chapters[-1]['url']}")


if __name__ == "__main__":
    main()
