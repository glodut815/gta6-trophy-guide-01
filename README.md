# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/glodut815/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/glodut815/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Guide — the best guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. An offline web app: a checklist saved in the browser with export and import, filters by kind, grade and status, a spoiler setting that hides story trophies until they are earned, a three-step roadmap to the platinum, the one missable trophy flagged, and a guide to every trophy in your own words that cites its sources. Trophy names, descriptions and grades follow the published list (GamesRadar+ / PowerPyx, cross-checked on GameMapa, KeenGamer and GamesFuze, November 2026); five hidden trophies whose unlock methods are still unconfirmed are marked as such rather than guessed at.

## Run it

```sh
node serve.ts
# open http://localhost:8080/
```

Or open `app/index.html` directly in a desktop browser — the guide works offline, with no network calls.

To build the entry dossier:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/trophy-out node main.ts
```

## How it is built

- `app/index.html`, `app/style.css`, `app/app.js` — the guide itself (plain HTML/CSS/JS, no framework, no network)
- `app/data/trophies.json` — all 55 trophies with official name, description and grade, plus an own-words guide and sources for each
- `main.ts` — entry program (Node 22, stdlib only) that copies `app/` and `screenshots/` to the output dir and writes `dossier.json` via the kit's `buildDossier`
- `vendor/makefun-frontend.ts` — copied from the kit unchanged
- `screenshots/` — 4 real renders of the guide's own code

---

<sub>Entered on [make.fun](https://make.fun/?ref=s9fbxxcj&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
