# Game Portal

Landing page for small browser games.

Live (once Pages is on): [https://tabyen.github.io/game-portal/](https://tabyen.github.io/game-portal/)

Games come from `games.json` plus any public GitHub repo under `tabyen` that has GitHub Pages. To add a game, either:

1. Enable Pages on the game repo, or
2. Add an entry to `games.json`.

If you open this page on `localhost` and a game lists a `local` URL, the portal probes it and offers **Play locally**.

```bash
cd game-portal
python3 -m http.server 8770
```

Then [http://127.0.0.1:8770](http://127.0.0.1:8770). Run Crawler on 8765 at the same time to see the local button.
