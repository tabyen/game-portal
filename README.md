# Game Portal

Doorway for browser games. Right now that is [Crawler](https://tabyen.github.io/dungeon-horde/).

Live: [https://tabyen.github.io/game-portal/](https://tabyen.github.io/game-portal/)

The featured game is the first entry in `games.json` (Crawler). Extra entries, like Print Under Fire, show under **Also on the shelf**.

If you open this page on `localhost` and Crawler is running locally, you get **Play locally**.

```bash
cd game-portal
python3 -m http.server 8770
```

Then [http://127.0.0.1:8770](http://127.0.0.1:8770). Run Crawler on 8765 at the same time to see the local button.
