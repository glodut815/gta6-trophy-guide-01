[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/glodut815/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/glodut815/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Bounty: https://make.fun/bounty/gta6-trophy-guide-01

# GTA 6 Trophy Guide — make.fun entry

An offline web app that is the best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: static files that open in a desktop browser and work with the network off.

## What it does

- **All 55 official trophies** with exact names, official descriptions and grades (1 Platinum, 2 Gold, 6 Silver, 46 Bronze), each with a guide in the author's own words that cites its sources.
- **Checklist saved in the browser** (localStorage) — tick trophies off as you earn them; progress survives reloads.
- **Export and import** your progress as JSON, plus a reset button.
- **Filters** by kind (Story, Strangers, Activities, Collections, Crime, Completion), grade and status, plus full-text search.
- **Spoiler setting** that hides story and hidden trophies until they are earned.
- **Platinum roadmap** in three steps, built from the official descriptions and the PowerPyx roadmap.
- **Missable trophies flagged** — Positive Mental Attitude is the only one flagged as possibly missable, with the Chapter 1 warning spelled out.

## Run it

```sh
node serve.ts
# open http://localhost:8080/
```

Or open `app/index.html` directly in a desktop browser — everything works offline.

## Build the entry

```sh
MAKEFUN_OUTPUT_DIR=/tmp/trophy-out node main.ts
# writes /tmp/trophy-out/dossier.json via vendor/makefun-frontend.ts
```

`main.ts` (Node 22, stdlib only) copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-frontend.ts` (copied from the kit unchanged).

## Sources

Trophy names, descriptions and grades follow the list PlayStation and Xbox show since launch, as collected by PSNProfiles and TrueAchievements and cross-checked across GTASpotter, Insider Gaming, KeenGamer, GameMapa, GTA BOOM and GamesFuze — see the full source list in the app and in `app/data/trophies.json`. Five hidden trophies still have cryptic descriptions; their guides say so honestly instead of inventing a method.

Unofficial fan guide. Not affiliated with Rockstar Games, Sony or PlayStation. No Rockstar logo or official artwork is used.

## License

MIT — see [LICENSE](LICENSE).
