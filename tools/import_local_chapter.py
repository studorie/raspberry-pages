"""
Convert a locally saved chapter HTML file into the reader's JSON format.

Use this for HTML content you have locally and are allowed to use.
No network requests are made by this script.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from bs4 import BeautifulSoup


CONTENT_SELECTOR = 'div.epcontent.entry-content[itemprop="text"]'


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value.replace("\xa0", " ")).strip()


def extract(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    content = soup.select_one(CONTENT_SELECTOR)

    if not content:
        raise RuntimeError(
            f"Could not find chapter content with selector: {CONTENT_SELECTOR}"
        )

    for selector in [
        ".rf-unit",
        ".brr-report-line",
        "script",
        "style",
        "noscript",
        "iframe",
    ]:
        for node in content.select(selector):
            node.decompose()

    paragraphs = []

    for paragraph in content.find_all("p", recursive=False):
        text = clean_text(" ".join(paragraph.stripped_strings))

        if text:
            paragraphs.append(text)

    return paragraphs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("--label", required=True)
    parser.add_argument("--title")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    input_path = Path(args.input)

    paragraphs = extract(
        input_path.read_text(
            encoding="utf-8",
            errors="replace",
        )
    )

    result = {
        "label": args.label,
        "title": args.title or args.label,
        "source": f"local file: {input_path.name}",
        "paragraphs": paragraphs,
    }

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(f"Imported {len(paragraphs)} paragraphs")
    print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
