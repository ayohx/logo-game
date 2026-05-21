# Logo Game Plan

## Active Workstream

1. Keep the active app in `src/` as the source of truth.
2. Clean up any legacy root-level clutter only if it affects clarity.
3. Improve the game in three passes:
   - smarter question generation and better distractors
   - clearer answer feedback and results UX
   - audio and accessibility polish
4. Run the test suite before any commit.
5. Hold for play testing before taking the next step.

## Notes

- The live app is served from `index.html` and loads `src/main.js`.
- Legacy root files are not part of the active runtime unless explicitly wired in.
- Any structural cleanup should preserve the current `src/` module layout.
