"""
Export all chapter URLs from chapters.json into local JSON files for the reader.

This is a one-off conversion script for chapters that are allowed to be downloaded
and stored locally. It reads the chapter metadata and fetches each chapter page,
extracts the main reading content, and writes the JSON format used by the app.
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
    def requests_retry_session():
        return requests.Session()

CONTENT_SELECTORS = [
    'div.epcontent.entry-content[itemprop="text"]',
    'div.epcontent.entry-content',
    'div.entry-content[itemprop="text"]',
    'div.entry-content',
]


def repair_mojibake(text: str) -> str:
    replacements = {
        "\u00a0": " ",
        "\u202f": " ",
        "\u200b": "",
        "Â": "",
        "â": "’",
        "â€™": "’",
        "â€˜": "'",
        "â€œ": "“",
        "â€": "”",
        "â€\"": '"',
        "â€“": "–",
        "â€”": "—",
        "â€¦": "…",
        "â€¢": "•",
        "â€": "",
        "Ã©": "é",
        "Ã¨": "è",
        "Ãª": "ê",
        "Ã¡": "á",
        "Ã¢": "â",
        "Ã£": "ã",
        "Ã¼": "ü",
        "Ã¶": "ö",
        "Ã±": "ñ",
        "Ã³": "ó",
        "Ãº": "ú",
        "Ãµ": "õ",
        "Ã‰": "É",
        "Ã": "Á",
        "Ã": "Ï",
        "Ãœ": "Ü",
        "Ã–": "Ö",
        "Ã": "È",
        "Ãˆ": "È",
        "ÃŒ": "Ì",
        "Ã”": "Ó",
        "Ãš": "Ú",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    if any(marker in text for marker in ["â", "Ã", "Â"]):
        try:
            recovered = text.encode("latin-1", "ignore").decode("utf-8", "ignore")
            if recovered and recovered != text:
                text = recovered
        except Exception:
            pass

    text = text.replace("\xa0", " ")
    text = text.replace("\u200b", "")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def clean_text(value: str) -> str:
    return repair_mojibake(value)


def rebuild_fragment_text(parts: list[str]) -> str:
    cleaned = []
    for part in parts:
        cleaned_part = clean_text(part)
        if cleaned_part:
            cleaned.append(cleaned_part)

    if not cleaned:
        return ""

    merged: list[str] = []
    for part in cleaned:
        if not part:
            continue

        if merged and len(merged[-1]) == 1 and merged[-1].isalpha() and part and part[0].isalpha() and part[0].isupper():
            merged[-1] += part
            continue

        if merged:
            merged.append(f" {part}")
        else:
            merged.append(part)

    text = "".join(merged)
    text = re.sub(r"\s+([,.;:!?])", r"\1", text)
    return text.strip()


def find_content_node(soup: BeautifulSoup):
    for selector in CONTENT_SELECTORS:
        node = soup.select_one(selector)
        if node is not None:
            return node
    return None


def extract_paragraphs(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    content = find_content_node(soup)

    if content is None:
        raise RuntimeError(
            "Could not find chapter content. Expected one of: "
            + ", ".join(CONTENT_SELECTORS)
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

    paragraphs: list[str] = []
    for paragraph in content.find_all("p"):
        text = rebuild_fragment_text(list(paragraph.stripped_strings))
        if text:
            paragraphs.append(text)

    if not paragraphs:
        raise RuntimeError("No readable paragraphs were found in the chapter content.")

    return paragraphs


def export_chapter(chapter: dict, output_root: Path, headers: dict[str, str]) -> dict:
    url = chapter.get("url")
    if not url:
        raise ValueError(f"Chapter {chapter!r} is missing a URL")

    slug = chapter.get("slug") or re.sub(r"[^a-z0-9]+", "-", str(chapter.get("label", "chapter")).lower()).strip("-")
    output_path = output_root / f"{slug}.json"

    with requests_retry_session() as session:
        response = session.get(url, headers=headers, timeout=30)
        print(f"{chapter.get('label')}: HTTP {response.status_code} -> {response.url}")
        response.raise_for_status()
        paragraphs = extract_paragraphs(response.text)

    payload = {
        "label": chapter.get("label"),
        "title": chapter.get("title") or chapter.get("label"),
        "source": url,
        "paragraphs": paragraphs,
    }

    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(paragraphs)} paragraphs to {output_path}")

    return {**chapter, "content": f"content/{output_path.name}"}


def main():
    parser = argparse.ArgumentParser(description="Export chapter URLs into local JSON book files.")
    parser.add_argument("--chapters", default="chapters.json", help="Metadata file containing chapter entries.")
    parser.add_argument("--output-dir", default="content", help="Directory for exported JSON chapter files.")
    parser.add_argument("--dry-run", action="store_true", help="Validate chapter URLs without writing files.")
    args = parser.parse_args()

    chapters_path = Path(args.chapters)
    output_root = Path(args.output_dir)
    output_root.mkdir(parents=True, exist_ok=True)

    chapters = json.loads(chapters_path.read_text(encoding="utf-8"))

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/153.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    updated = []
    for chapter in chapters:
        if args.dry_run:
            url = chapter.get("url")
            if not url:
                continue
            with requests_retry_session() as session:
                response = session.get(url, headers=headers, timeout=30)
                print(f"{chapter.get('label')}: {response.status_code} {response.url}")
            updated.append(chapter)
            continue

        updated.append(export_chapter(chapter, output_root, headers))

    if not args.dry_run:
        chapters_path.write_text(json.dumps(updated, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Updated {chapters_path}")


if __name__ == "__main__":
    main()
