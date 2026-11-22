# Brief: Tendle, a daily Top 10 game where rare finds score most

2026-11-21. Owner: Dimitar Panayotov. Built by the software factory as its first real project.

## The game in one line

Every day, everyone gets the same Top 10 list to guess. You type your guesses. The entries few other players found score the most.

## Who it is for

People who play Wordle-style games and trivia (Krillion, Daily Tens): a few minutes a day, on the phone, in English, anywhere in the world.

## How it plays

- **One list a day** for everyone, new at midnight UTC. Topics change: music, sports, geography, film, science, anything with facts.
- **You type guesses.** Small typos and other names for the same thing count ("Man Utd" = "Manchester United").
- **Three wrong guesses** and the round ends. Finding all ten ends it too.
- **Scoring by rarity:** each entry you found is worth more the fewer players found it. Finding all ten gives a bonus.
- **Your score settles at midnight.** During the day it is "so far", because more players change the rarity. Coming back tomorrow shows your final score and the crowd's results.
- **Results:** which entries you found, how many players found each one, your streak.
- **Share card:** a short text with ten squares coloured by rarity, your score and the link. No answers in it.

## Where the lists come from

- Facts only, never someone else's pictures, audio or text.
- Built from open data: Wikidata and MusicBrainz (free to use), Wikipedia (free to use with credit). Each list keeps its source links.
- Never copied whole from a chart or a ranking site (Billboard, Spotify charts): in the EU a database is protected even when single facts are not.
- The real lists are kept in a private repository, never in this public one: they are the answers. A person checks each list and loads it into the database. This repository holds only made-up lists for tests.
- Later: a tool that builds lists from Wikidata.

## How it makes money

- Display ads around the results page, never inside the playing area.
- Visitors in the EU must agree to ad cookies first (a consent banner).
- Free to run for now: Cloudflare's free plan (one Worker, D1, a daily timer) at tendle.dimitar-panayotov.workers.dev. Ads need a domain of our own, so one is bought when there are enough players to show ads to.

## Rules the code must keep

- The list's answers never reach the browser before the round ends, so nobody can peek.
- No accounts and no personal data: a random player id kept in the browser.
- Each guess is checked on the server, and each player plays a day's list once.

## First version (v1)

**In:** the daily list, guessing with typo tolerance, three strikes, rarity scoring with the midnight settle, results and crowd stats, the share card, streaks, a script that loads lists into the database, 30 lists ready, the consent banner and ad slots, a page about the game and its data sources.

**Out (later):** accounts and leaderboards, other languages, the Wikidata list builder, an archive of past days, mobile apps.

## Success bar for the factory test

Written before the first paid run, and kept apart from whether the game earns.

| Measure                                        | Bar                         |
| ---------------------------------------------- | --------------------------- |
| Tickets merged with no code change by Dimitar  | at least 70%                |
| Dimitar's time per ticket (median)             | at most 10 minutes          |
| Agent runs per merged ticket (median)          | at most 5                   |
| Tokens per merged ticket                       | recorded, no bar yet        |
| Security boundary breaches                     | none                        |
| The same 3 tickets done with plain Claude Code | compared on time and result |

## Open decisions

- The name: **Tendle** (chosen 2026-11-21). No game, app or trademark of that name found in a quick search; a full trademark check (EU TMview, USPTO) is still to do. Free domains: tendle.gg, tendle.io, playtendle.com. Taken: tendle.com, tendle.net, tendle.app.
- The rarity formula, and what scoring does on day one with few players.
- Technology, decided 2026-11-21: TypeScript; Hono on Cloudflare Workers; D1 (SQLite) for the data; Preact and Vite for the page; Vitest, Biome and dependency-cruiser for the checks.
