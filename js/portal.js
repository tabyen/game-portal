const OWNER = "tabyen";
const SKIP = new Set(["game-portal"]);
const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

const gamesEl = document.getElementById("games");
const statusEl = document.getElementById("status");

function card(game) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    ${game.cover ? `<img src="${game.cover}" alt="">` : `<img alt="">`}
    <div class="card-body">
      ${game.localUp ? `<span class="badge">Local server</span>` : ""}
      <h3>${escapeHtml(game.title)}</h3>
      ${game.tagline ? `<p class="tag">${escapeHtml(game.tagline)}</p>` : ""}
      <p>${escapeHtml(game.description || "")}</p>
      <div class="actions"></div>
    </div>
  `;
  const actions = article.querySelector(".actions");
  const playUrl = game.localUp ? game.local : game.play;
  if (playUrl) {
    const play = document.createElement("a");
    play.className = "btn";
    play.href = playUrl;
    play.textContent = game.localUp ? "Play locally" : "Play";
    actions.append(play);
  }
  if (game.localUp && game.play) {
    const web = document.createElement("a");
    web.className = "btn ghost";
    web.href = game.play;
    web.textContent = "Play on the web";
    actions.append(web);
  }
  if (game.repo) {
    const repo = document.createElement("a");
    repo.className = "btn ghost";
    repo.href = game.repo.startsWith("http") ? game.repo : `https://github.com/${game.repo}`;
    repo.textContent = "Source";
    actions.append(repo);
  }
  return article;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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

function fromGithub(repo) {
  const name = repo.name;
  return {
    id: name,
    title: prettyTitle(name),
    tagline: "",
    description: repo.description || "A browser game.",
    repo: repo.full_name,
    play: `https://${OWNER}.github.io/${name}/`,
    local: null,
    cover: "",
  };
}

function prettyTitle(name) {
  return name
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function githubGames() {
  try {
    const res = await fetch(`https://api.github.com/users/${OWNER}/repos?per_page=100&sort=updated`);
    if (!res.ok) return [];
    const repos = await res.json();
    return repos.filter((r) => r.has_pages && !SKIP.has(r.name) && !r.fork).map(fromGithub);
  } catch {
    return [];
  }
}

function merge(catalog, extra) {
  const byId = new Map();
  for (const g of extra) byId.set(g.id, g);
  for (const g of catalog) byId.set(g.id, { ...byId.get(g.id), ...g });
  return [...byId.values()];
}

async function main() {
  let catalog = [];
  try {
    const res = await fetch("games.json", { cache: "no-store" });
    if (res.ok) catalog = await res.json();
  } catch {
    catalog = [];
  }

  const remote = await githubGames();
  const games = merge(catalog, remote);

  if (isLocalHost) {
    await Promise.all(
      games.map(async (g) => {
        g.localUp = await probeLocal(g.local);
      })
    );
  }

  gamesEl.replaceChildren();
  if (!games.length) {
    gamesEl.innerHTML = `<p class="empty">No games on the shelf yet.</p>`;
    statusEl.textContent = "The hall is empty.";
    return;
  }

  const localCount = games.filter((g) => g.localUp).length;
  statusEl.textContent = isLocalHost
    ? localCount
      ? `${games.length} game${games.length === 1 ? "" : "s"}. ${localCount} running on this machine.`
      : `${games.length} game${games.length === 1 ? "" : "s"} on GitHub. Start a local server to play here.`
    : `${games.length} game${games.length === 1 ? "" : "s"}.`;

  for (const g of games) gamesEl.append(card(g));
}

main();
