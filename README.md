# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/glodut815/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/glodut815/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: the official list, a saved checklist, filters, a spoiler setting, a roadmap to the platinum and a guide to every trophy.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=s9fbxxcj&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

## What it covers

- **Checklist** — all 55 trophies (1 Platinum, 2 Gold, 6 Silver, 46 Bronze) with their official name, description and grade, plus a guide to each in my own words with its sources. Click a trophy to check it off; progress is saved in your browser.
- **Filters** — by kind (Story, 100% & Collections, Activities, Strangers, Robberies, Money & Property, Mischief), by grade, by earned or not earned, and by name search.
- **Spoiler setting** — hides story trophies until you earn them, so nothing about the plot leaks while you browse.
- **Roadmap** — the three-step route to the platinum (story, then the 100% checklist, then Strangers & Freaks), with the facts that matter: about 200 hours, one playthrough, all offline, no mission replay.
- **Missables** — the one trophy you can miss (Positive Mental Attitude, and the Chapter 1 meditation behind it), the five hidden trophies whose method is still unconfirmed, and the traps to avoid: cheats disable trophies, and there is no mission replay.
- **Export and import** — save your progress as a JSON file and load it back on another machine.

## How it is built

Static files only, no build step and no network at run time: `app/index.html`, `app/app.js`, `app/style.css` and `app/data/trophies.json`. `main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored dossier builder in `vendor/makefun-frontend.ts`. `serve.ts` is a small static file server for local testing on port 8080.

## Sources

The trophy list and the facts behind the guides come from PowerPyx, GameMapa, HowToVideoGame, GTA BOOM, KeenGamer, GTA Scoop, Mobalytics and GamesFuze. Each trophy's guide cites its sources in the app. The guide text itself is written for this page; it draws on those guides without copying their words.
