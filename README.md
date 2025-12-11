# GCSE Combined Science Topic Clicker

A tiny static web app: click parts of a composite image to reveal the GCSE Combined Science topic they represent.

## Setup

1. Ensure your composite image file `image-1765450376652.png` is in the project root (alongside `index.html`).
2. Adjust clickable regions in `topics.json` if the outlines don’t match. Coordinates assume an original image of roughly 1000×700; they rescale to fit.

## Run locally (macOS)

```zsh
cd "/Users/danieltagg/Desktop/Desktop - Daniel’s MacBook Pro/topicclicker"
python3 -m http.server 5500
```
Open http://localhost:5500 in your browser.

## Editing regions

- Toggle outlines with the button to see where regions are.
- Edit `topics.json` entries: `x`,`y`,`w`,`h` define rectangle positions in pixels relative to the original image size. `label` is what displays when clicked.

## Files

- `index.html` — page layout
- `styles.css` — basic styling and overlay visuals
- `script.js` — loads `topics.json`, draws clickable overlays, handles clicks
- `topics.json` — list of labeled regions
- `image-1765450376652.png` — your composite image (provided)
