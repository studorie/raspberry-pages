"""
Check whether a chapter page contains the expected reading container.

This script reports structural metadata only:
- HTTP status
- whether the selector exists
- paragraph count
- element/class details

It deliberately does not print or save the chapter text.
"""

from __future__ import annotations

import argparse

import requests
from bs4 import BeautifulSoup

try:
    from function.requests_retryer import requests_retry_session
except ImportError:
    def requests_retry_session():
        return requests.Session()


CONTENT_SELECTOR = 'div.epcontent.entry-content[itemprop="text"]'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    args = parser.parse_args()

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/153.0.0.0 Safari/537.36"
        )
    }

    with requests_retry_session() as session:
        response = session.get(
            args.url,
            headers=headers,
            timeout=30,
        )

    print(f"HTTP status : {response.status_code}")
    print(f"Final URL   : {response.url}")

    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    content = soup.select_one(CONTENT_SELECTOR)

    if not content:
        print(f"Selector    : NOT FOUND")
        print(f"Expected    : {CONTENT_SELECTOR}")
        return

    paragraphs = content.find_all("p")
    ads = content.select(".rf-unit")
    report_lines = content.select(".brr-report-line")

    print(f"Selector    : FOUND")
    print(f"Tag         : {content.name}")
    print(f"Classes     : {' '.join(content.get('class', []))}")
    print(f"Paragraphs  : {len(paragraphs)}")
    print(f"Ad blocks   : {len(ads)}")
    print(f"Report rows : {len(report_lines)}")


if __name__ == "__main__":
    main()
