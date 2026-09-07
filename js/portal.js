const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const HEADLINER_KEY = "portal-headliner";

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function addButtons(el, game) {
  el.replaceChildren();
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

function card(game, onPick) {
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
  const makeHeadliner = document.createElement("button");
  makeHeadliner.type = "button";
  makeHeadliner.className = "btn ghost";
  makeHeadliner.textContent = "Make headliner";
  makeHeadliner.addEventListener("click", () => onPick(game.id));
  article.querySelector(".actions").prepend(makeHeadliner);
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

function idFromHash() {
  return decodeURIComponent(location.hash.replace(/^#/, "")).trim();
}

function pickId(games) {
  const fromHash = idFromHash();
  if (fromHash && games.some((g) => g.id === fromHash)) return fromHash;
  const stored = localStorage.getItem(HEADLINER_KEY);
  if (stored && games.some((g) => g.id === stored)) return stored;
  return games[0].id;
}

async function main() {
  let games = [];
  try {
    const res = await fetch("games.json", { cache: "no-store" });
    if (res.ok) games = await res.json();
  } catch {
    games = [];
  }
  if (!games.length) return;

  if (isLocalHost) {
    await Promise.all(
      games.map(async (g) => {
        g.localUp = await probeLocal(g.local);
      })
    );
  }

  const byId = Object.fromEntries(games.map((g) => [g.id, g]));
  const doorList = document.getElementById("door-list");
  const shelf = document.getElementById("games");
  const more = document.getElementById("more");
  const hero = document.getElementById("hero");

  function setHeadliner(id, { pushHash } = { pushHash: true }) {
    const game = byId[id] || games[0];
    localStorage.setItem(HEADLINER_KEY, game.id);
    if (pushHash) history.replaceState(null, "", `#${game.id}`);

    if (game.cover) hero.style.backgroundImage = `url("${game.cover}")`;
    document.getElementById("title").textContent = game.title;
    document.getElementById("tagline").textContent = game.tagline || "";
    document.getElementById("lede").textContent = game.lede || game.description || "";
    document.title = `${game.title} — Game Portal`;
    addButtons(document.getElementById("hero-actions"), game);

    doorList.querySelectorAll(".door").forEach((btn) => {
      btn.classList.toggle("on", btn.dataset.id === game.id);
      btn.setAttribute("aria-current", btn.dataset.id === game.id ? "true" : "false");
    });

    const rest = games.filter((g) => g.id !== game.id);
    shelf.replaceChildren();
    if (rest.length) {
      more.classList.remove("hidden");
      for (const g of rest) shelf.append(card(g, (next) => setHeadliner(next)));
    } else {
      more.classList.add("hidden");
    }
  }

  doorList.replaceChildren();
  for (const g of games) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "door";
    btn.dataset.id = g.id;
    btn.innerHTML = `<span class="door-title">${escapeHtml(g.title)}</span>`;
    btn.addEventListener("click", () => setHeadliner(g.id));
    doorList.append(btn);
  }

  setHeadliner(pickId(games), { pushHash: !idFromHash() });
  window.addEventListener("hashchange", () => {
    const id = idFromHash();
    if (id && byId[id]) setHeadliner(id, { pushHash: false });
  });
}

main();
