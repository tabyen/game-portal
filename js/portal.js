const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function addButtons(el, game) {
  const playUrl = game.localUp ? game.local : game.play;
  if (playUrl) {
    const play = document.createElement("a");
    play.className = "btn";
    play.href = playUrl;
    play.textContent = game.localUp ? "Play locally" : "Play";
    el.append(play);
  }
  if (game.localUp && game.play) {
    const web = document.createElement("a");
    web.className = "btn ghost";
    web.href = game.play;
    web.textContent = "Play on the web";
    el.append(web);
  }
  if (game.repo) {
    const repo = document.createElement("a");
    repo.className = "btn ghost";
    repo.href = game.repo.startsWith("http") ? game.repo : `https://github.com/${game.repo}`;
    repo.textContent = "Source";
    el.append(repo);
  }
}

function card(game) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    ${game.cover ? `<img src="${game.cover}" alt="">` : ""}
    <div class="card-body">
      <h3>${escapeHtml(game.title)}</h3>
      ${game.tagline ? `<p class="tag">${escapeHtml(game.tagline)}</p>` : ""}
      <p>${escapeHtml(game.description || "")}</p>
      <div class="actions"></div>
    </div>
  `;
  addButtons(article.querySelector(".actions"), game);
  return article;
}

async function probeLocal(url) {
  if (!isLocalHost || !url) return false;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 500);
  try {
    await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", signal: ctrl.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  let games = [];
  try {
    const res = await fetch("games.json", { cache: "no-store" });
    if (res.ok) games = await res.json();
  } catch {
    games = [];
  }

  if (isLocalHost) {
    await Promise.all(
      games.map(async (g) => {
        g.localUp = await probeLocal(g.local);
      })
    );
  }

  const featured = games[0];
  if (!featured) return;

  const hero = document.getElementById("hero");
  if (featured.cover) hero.style.backgroundImage = `url("${featured.cover}")`;
  document.getElementById("title").textContent = featured.title;
  document.getElementById("tagline").textContent = featured.tagline || "";
  document.getElementById("lede").textContent = featured.lede || featured.description || "";
  document.title = `${featured.title} — Game Portal`;
  addButtons(document.getElementById("hero-actions"), featured);

  const rest = games.slice(1);
  if (rest.length) {
    const more = document.getElementById("more");
    more.classList.remove("hidden");
    const shelf = document.getElementById("games");
    for (const g of rest) shelf.append(card(g));
  }
}

main();
