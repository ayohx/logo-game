# Logo Quiz — Brand Recognition Game

A fast-paced, colourful logo recognition game playable on desktop and mobile.
Hosted on GitHub Pages · Powered by [logo.dev](https://logo.dev)

**Live:** https://ayohx.github.io/logo-game

---

## What This Is

A timed brand-logo quiz with two game modes:

| Mode | Prompt shown | Player answers |
|---|---|---|
| **Logo → Name** | A logo image appears | Pick the correct brand name from 3 options |
| **Name → Logo** | A brand name appears | Pick the correct logo from 3 logo images |

Both modes are randomly interleaved during a single game session.

---

## Game Flow

```
Start screen
    ↓
[Shuffle animation — logo tiles spin and land]
    ↓
Question revealed (logo or name)
    ↓  ← 5-second countdown starts immediately
3 options shown (A / B / C)
    ↓
Player answers via click · touch · keyboard (1/2/3 or A/B/C) · voice
    ↓
Correct  → score += seconds_remaining  → next question
Wrong    → score += 0, correct answer highlighted
Time out → score += 0, correct answer revealed for 1.5s
    ↓
After 10 questions → Results screen (score, rank, share)
```

### Scoring

```
Score per question = seconds remaining on the clock (max 5)
10 questions × max 5 pts = 50 points possible per game
```

| Points | Rank |
|---|---|
| 45–50 | Brand Genius 🏆 |
| 35–44 | Logo Pro 🥇 |
| 20–34 | Getting There 🥈 |
| 0–19  | Logo Newbie 🥉 |

---

## Input Methods

All four work simultaneously — whichever fires first wins:

1. **Click / tap** — click the option card
2. **Keyboard** — press `1` `2` `3` or `A` `B` `C`
3. **Voice** — say the letter or brand name aloud (Web Speech API)
4. **Timer expires** — answer revealed automatically

---

## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Runtime | Vanilla HTML/CSS/JS | Zero build step, instant GitHub Pages deploy |
| Logos | logo.dev REST API | Free CDN-hosted brand logos by domain |
| Audio | Web Audio API | Generated tones — no file hosting needed |
| Voice | Web Speech API | Native browser, no API key |
| Persistence | localStorage | High scores survive sessions, no backend |
| Hosting | GitHub Pages (`gh-pages` branch) | Free, zero config |
| Animation | CSS keyframes + JS | Shuffle spin, countdown pulse, score pop |

---

## logo.dev Integration

### How it works
```
https://img.logo.dev/{domain}?token={YOUR_TOKEN}&size=128&format=png
```

Example:
```
https://img.logo.dev/shopify.com?token=pk_xxx&size=128
https://img.logo.dev/netflix.com?token=pk_xxx&size=128
```

### Free-tier constraints & mitigation

| Constraint | Impact | Mitigation |
|---|---|---|
| ~1,000 requests/month free | ~33 full games/day if 30 logos/game | **Curated pool of 50 fixed logos** — browser caches aggressively |
| No private domains | Some niche brands won't resolve | Stick to top global brands with confirmed logo.dev support |
| Token exposed client-side | Anyone can use your token | logo.dev free tokens are public-rate-limited by origin — acceptable for a hobby game |
| No batch endpoint | Each logo = 1 request | **Preload only logos needed for current session** (10 questions × 4 options = 40 max, but deduped across shared pool) |

### Cache strategy
- `<img>` tags with `loading="lazy"` — browser HTTP cache handles repeats
- A logo seen in question 2 reused in question 8 = 0 additional requests
- Realistically: ~15–20 unique logo requests per 10-question game

### The 50-logo pool (confirmed working on logo.dev)

```
apple.com        google.com       microsoft.com    amazon.com
meta.com         netflix.com      spotify.com      airbnb.com
uber.com         twitter.com      linkedin.com     instagram.com
youtube.com      whatsapp.com     slack.com        zoom.us
shopify.com      stripe.com       figma.com        notion.so
discord.com      reddit.com       pinterest.com    snapchat.com
tiktok.com       paypal.com       ebay.com         samsung.com
sony.com         nike.com         adidas.com       ikea.com
coca-cola.com    pepsi.com        mcdonalds.com    starbucks.com
tesla.com        bmw.com          toyota.com       volkswagen.com
booking.com      tripadvisor.com  airfranceklm.com emirates.com
bbc.com          cnn.com          nytimes.com      github.com
atlassian.com    salesforce.com
```

---

## File Structure

```
Logo-Game/
├── index.html          # Single-page app shell
├── style.css           # All styles — variables, animations, responsive
├── game.js             # Game engine — state, scoring, question generation
├── logos.js            # Curated logo pool with domain + display name pairs
├── audio.js            # Web Audio API — tones for correct/wrong/tick/end
├── speech.js           # Web Speech API wrapper — voice input with fallback
├── config.js           # Token, timing constants, difficulty settings
└── README.md
```

---

## Gap Analysis

### Confirmed possible ✅
- Logo image fetching from logo.dev by domain
- Two-mode quiz (logo→name, name→logo)
- 5-second countdown with visual pulse
- Keyboard, click/touch, and voice input simultaneously
- Web Audio API generated sounds (no files needed)
- Score accumulation + localStorage high score
- GitHub Pages hosting off `main` branch
- Fully responsive — mobile portrait works with tap
- Shuffle/spin CSS animation between questions

### Possible with caveats ⚠️
| Feature | Caveat |
|---|---|
| Voice input | Chrome/Edge only — Safari partial. Show mic icon only when supported, silent fallback otherwise |
| Specific brand logos | ~5% of the 50 pool may return a placeholder on logo.dev — need to verify each domain during build |
| Offline play | Not possible — logo.dev images require network. Could pre-download to base64 in `logos.js` for a fully offline version |
| Difficulty levels | Easy (10s) / Medium (5s) / Hard (3s) — trivial to add via `config.js` |

### Not possible on free tier ❌
| Feature | Reason |
|---|---|
| Dynamic brand search (user types any brand) | Would burn API quota unpredictably |
| Leaderboard across users | Needs a backend/database |
| 100+ logo pool with per-session random selection | Risk of quota overrun at scale |
| Logo.dev SVG format | Only PNG available on free tier |

---

## GitHub Pages Deployment

The game lives on the `main` branch root — GitHub Pages serves `index.html` directly.

1. Repo settings → Pages → Source: `main` branch, `/ (root)`
2. URL becomes: `https://ayohx.github.io/logo-game`
3. Every push to `main` auto-deploys (no CI needed)

---

## What You Need Before Build Starts

1. **logo.dev token** — sign up at https://logo.dev, copy your `pk_xxx` public key
2. Confirm which domains from the 50-logo pool resolve correctly (can test in browser)
3. Decide: 10 questions per game, or configurable?
4. Decide: single-player only, or add a "challenge a friend" share link (URL-encoded score)?

---

## Phases

| Phase | Scope |
|---|---|
| **1 — Core** | Single HTML file, logo→name mode only, click input, timer, score |
| **2 — Polish** | Shuffle animation, sounds, name→logo mode, keyboard input |
| **3 — Extras** | Voice input, difficulty levels, high score board, share button |
