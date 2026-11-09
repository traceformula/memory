# Memory Training

Train like a memory champion: build a Dominic number system and memory journeys, drill your images, and practise competition events with real scoring.

Live at https://traceformula.github.io/memory/

## What's in it

- **Number system**: 00–99 as person + action (Dominic), person + action + object (PAO), or one image each (Major). Dominic letter or Major sound hints, paste a whole list at once.
- **Cards**: each card points to a number, so cards reuse your number images. Dominic-style default map, editable.
- **Journeys**: ordered stops with optional photos (resized and stored on the device).
- **Drills**: spaced review (SM-2), timed speed runs that save the time for every image, journey walks forwards, backwards or by random stop.
- **Events**: Speed Numbers, Memory League–style numbers, binary, custom; Speed Cards, Memory League–style cards, practice. Mistakes are traced to the journey stop and tagged with a reason.
- **Progress**: speed heatmap per image, trends, mistake reasons, history.

Scoring follows the WMSC Competitor's and Arbiter's Handbook (3rd edition) and the IAM Rulebook (November 2019); see `src/lib/scoring.js`.

## Data

Everything is stored in the browser (IndexedDB). Nothing is sent anywhere. Backup and restore are on the Backup and data page.

## Develop

```sh
npm install
npm run dev     # http://localhost:5173/memory/
npm test        # scoring, codes, cards, stats
npm run lint
npm run build
```

Pushing to `main` builds and deploys to the `gh-pages` branch with GitHub Actions.
