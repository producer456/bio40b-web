# BIO 40B — Anatomy & Physiology II study site

A **read-only** study companion I share with my class. Students can:

- **Read** the material browsed by learning objective (objectives, content,
  figures, key terms, and self-check questions), and
- **Flashcards** — drill every section's learning objectives: reveal the model
  answer, rate how well they knew it (1–5), and any card rated below "Solid"
  comes back until all objectives are mastered.

No sign-in, no accounts, nothing writes back to the site. A student's flashcard
confidence is remembered only in their own browser (localStorage).

Content is adapted from OpenStax *Anatomy & Physiology* (CC BY). It mirrors the
BIO 40B iOS app and shares the same objective-card data.

## Only the owner updates it

Students consume; **I** update it by editing the data and pushing:

```bash
# regenerate objective cards in the app repo (if objectives/answers changed)
python3 ../bio40b-ios/tools/gen_objective_cards.py

# pull the latest chapter JSON + objective cards + optimized figures in
bash tools/sync_assets.sh            # defaults to ../bio40b-ios
git add -A && git commit -m "update content" && git push
```

GitHub Pages redeploys automatically on push.

## Structure

- `index.html`, `style.css`, `app.js` — the whole static app (vanilla JS).
- `data/ch*.json` — chapter content (from the app's bundled content).
- `data/objective_cards.json` — objective flashcards (objective + model answer).
- `figures/*.jpg` — textbook figures, downscaled to ≤1200px.
- `tools/sync_assets.sh` — refreshes `data/` and `figures/` from the app repo.
