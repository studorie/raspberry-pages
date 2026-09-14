# Adi's Raspberry Library

A raspberry-themed reading app for Adi, built as a static GitHub Pages-friendly site with a warm, personal book UI, chapter navigation, ambient reading audio, and local chapter content.

## Features

- Raspberry / burgundy visual theme
- Personalized cover and reading experience
- Real paper-like page rendering instead of an iframe
- Keyboard and touch navigation
- Previous/next page controls
- Chapter drawer and persistent reading progress
- Local chapter JSON content support
- Ambient rain audio with a hidden bonus track
- Lightweight Python tools for chapter discovery and import

## Project structure

- `index.html` — app shell and page layout
- `styles.css` — raspberry-themed visual design
- `app.js` — reader logic, pagination, chapter navigation, mood controls
- `chapters.json` — chapter metadata and source links
- `content/` — local chapter JSON data for imported chapters
- `tools/` — Python utilities for chapter discovery and import
- `assets/` — visual and audio assets

## Running locally

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Start a local web server from the project root:

```bash
python -m http.server 8000
```

3. Open the site in a browser:

```text
http://localhost:8000
```

> Do not open the HTML directly in the browser for the local JSON-backed content; use the HTTP server so fetch calls work correctly.

## GitHub Pages deployment

This repo is ready for static deployment on GitHub Pages.

1. Push this project to a GitHub repository.
2. In GitHub, open the repository settings.
3. Go to Pages.
4. Set Source to GitHub Actions.
5. The included workflow in `.github/workflows/pages.yml` will deploy the site automatically.

## Python utilities

### Discover chapter metadata

```bash
python tools/discover_chapters.py
```

Or from a local HTML listing:

```bash
python tools/discover_chapters.py --html chapter-list.html
```

### Probe a chapter source page

```bash
python tools/probe_chapter.py https://readfreebooksonline.org/alchemised-chapter-39/
```

### Import local HTML into the reader

```bash
python tools/import_local_chapter.py chapter-39.html \
  --label "Chapter 39" \
  --title "Alchemised: Chapter 39" \
  --output content/alchemised-chapter-39.json
```

After importing, add the JSON file to the relevant chapter entry in `chapters.json` under the `content` field.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
