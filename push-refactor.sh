#!/bin/bash
# Run this from inside the Logo-Game directory
# It clears the stale git lock, stages all changes, and pushes.

set -e
cd "$(dirname "$0")"

echo "🔓 Clearing stale git lock..."
rm -f .git/index.lock

echo "📦 Staging changes..."
git add src/ index.html
git rm --cached --ignore-unmatch game.js disney.js audio.js speech.js logos.js config.js 2>/dev/null || true
git rm game.js disney.js audio.js speech.js logos.js config.js 2>/dev/null || true

echo "✅ Committing..."
git commit -m "refactor: ES module architecture + strict Disney cartoon allowlist

Split monolithic 601-line game.js into 13 focused ES modules under src/:
  config.js | data/brands.js | data/disney.js
  utils/helpers.js | utils/audio.js | utils/speech.js
  game/questions.js | game/timer.js | game/engine.js
  ui/screens.js | ui/shuffle.js | ui/history.js | main.js

Disney pack fix: strict FAMOUS_NAMES allowlist of ~100 iconic animated
Disney/Pixar characters — eliminates all live-action/obscure characters.
Film distractors drawn from curated FAMOUS_FILMS list only.

index.html: 6 global script tags -> single type=module entry point."

echo "🚀 Pushing..."
git push origin main

echo ""
echo "✅ Done! GitHub Pages will update in ~30 seconds."
echo "   Preview: https://ayohx.github.io/logo-game/"
