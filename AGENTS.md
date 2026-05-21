# Logo Game — Project Rules for Codex

## Browser Testing

**Always use the Codex in Chrome MCP tab group for any live browser testing.**

- Call `tabs_context_mcp` first to get the available tab IDs in the group.
- Navigate to the **live GitHub Pages URL**: `https://ayohx.github.io/logo-game/`
- Do NOT spin up a local HTTP server for testing — the sandbox localhost is not reachable from the host machine's browser.
- If you need to test local changes before pushing, note that ES modules require HTTP (not `file://`), so local testing requires a push to GitHub first, then verify on the live URL.

## Repository

- **Live URL**: https://ayohx.github.io/logo-game/
- **GitHub repo**: https://github.com/ayohx/logo-game
- **Branch**: `main` (auto-deploys to GitHub Pages)

## Architecture

All game logic lives under `src/` as ES modules. The entry point is `src/main.js`, loaded via `<script type="module">` in `index.html`.

```
src/
  config.js              ← game settings (timer, question count, etc.)
  data/brands.js         ← curated brand pool for logo quiz
  data/disney.js         ← strict FAMOUS_NAMES allowlist + FAMOUS_FILMS
  utils/helpers.js       ← shuffle, getRank
  utils/audio.js         ← Web Audio API engine
  utils/speech.js        ← Web Speech API voice input
  game/questions.js      ← question generation logic
  game/timer.js          ← RAF-based countdown timer
  game/engine.js         ← core game state + loop
  ui/screens.js          ← screen transitions + DOM helpers
  ui/shuffle.js          ← slot-machine animation
  ui/history.js          ← results + history rendering
  main.js                ← event wiring + boot
```

## Disney Pack Rules

- Characters must be in the `FAMOUS_NAMES` allowlist in `src/data/disney.js`
- **No live-action, no obscure, no Marvel, no Star Wars** — animated cartoon characters only
- Film distractors must come from `FAMOUS_FILMS` (recognisable animated titles)
- The session cache key is `logoquiz_disney_pool_v5` — bump the version to bust stale caches

## Git

- The macOS-mounted filesystem can produce a stale `.git/index.lock` file
- If `git commit` fails with a lock error, the workaround is: copy repo to `/tmp`, remove the lock there, commit, then push
- A helper script `push-refactor.sh` exists in the project root for this


<claude-mem-context>
# Memory Context

# [Logo-Game] recent context, 2026-05-18 10:39am GMT+1

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 8 obs (3,584t read) | 102,452t work | 97% savings

### May 18, 2026
31 10:35a 🔵 Logo-Game Project Structure and Refactor State
32 " 🔵 Logo-Game Full Architecture Deep-Read
33 10:37a 🔵 Audio Engine — Fully Synthesized via Web Audio API
34 " 🔵 Speech Recognition — Fuzzy Brand Name Matching
35 " 🔵 Dual localStorage Debug Logging System
36 " 🔵 Disney Mode Was a Second Game Pack — Now Fully Removed from src/
37 " 🔵 Test Suite is Static Source Analysis — Not Runtime Tests
38 " 🔵 LOGO_POOL Confirmed at 137 Brands; README File Structure is Stale

Access 102k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>