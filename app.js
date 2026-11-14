"use strict";
const $ = s => document.querySelector(s);
const store = {
  get(k, d){ try{ const v = localStorage.getItem("infiltre:"+k); return v ? JSON.parse(v) : d; }catch{ return d; } },
  set(k, v){ try{ localStorage.setItem("infiltre:"+k, JSON.stringify(v)); }catch{} }
};
const shuffle = a => { a = [...a]; for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const CUSTOM = "✏️ Mes mots";
const ROLE = {
  civil:    { label:"Civil",     emoji:"🙂" },
  infiltre: { label:"Infiltré",  emoji:"🕵️" },
  blanc:    { label:"Amnésique", emoji:"👻" }
};

let settings = store.get("settings", { names: [] });
settings.names = settings.names.slice(0, 12);
let scores = store.get("scores", {});
let used = store.get("used", []);
let game = null;

/* ---------- Catégories ---------- */
function allCategories(){
  const custom = store.get("custom", []);
  return custom.length ? { ...CATEGORIES, [CUSTOM]: custom } : CATEGORIES;
}
// Tous les thèmes sont utilisés, tirés au hasard et jamais affichés.
const selectedCats = () => Object.keys(allCategories());
const MAX_PLAYERS = 12;

/* ---------- Écrans ---------- */
function show(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.id === "screen-"+id));
  window.scrollTo(0, 0);
}
function modal(html, actions){
  $("#modal-content").innerHTML = html;
  const box = $("#modal-actions"); box.innerHTML = "";
  actions.forEach(a => {
    const b = document.createElement("button");
    b.className = "btn " + (a.cls || "");
    b.textContent = a.label;
    b.onclick = () => { if(a.keep !== true) closeModal(); a.fn && a.fn(); };
    box.appendChild(b);
  });
  $("#modal").hidden = false;
}
const closeModal = () => { $("#modal").hidden = true; };

/* ---------- Configuration ---------- */
function save(){ store.set("settings", settings); }
// Nombre total d'imposteurs selon le nombre de joueurs (3 → 12).
const IMPOSTORS = { 3:1, 4:1, 5:2, 6:2, 7:2, 8:3, 9:3, 10:3, 11:4, 12:4 };
const impostorCount = n => IMPOSTORS[Math.min(Math.max(n, 3), 12)];
// Répartition aléatoire : au moins 1 infiltré, jusqu'à la moitié d'amnésiques.
function randomRoles(n){
  const total = impostorCount(n);
  const blancs = total < 2 ? 0 : Math.floor(Math.random() * (Math.floor(total / 2) + 1));
  return shuffle([
    ...Array(total - blancs).fill("infiltre"),
    ...Array(blancs).fill("blanc"),
    ...Array(n - total).fill("civil")
  ]);
}
function renderSetup(){
  const n = settings.names.length;
  $("#player-count").textContent = `${n} / ${MAX_PLAYERS}`;
  $("#player-list").innerHTML = settings.names.map((p,i) =>
    `<li>${esc(p)}<button data-del="${i}" aria-label="Retirer">✕</button></li>`).join("");
  const imp = impostorCount(n);
  $("#role-summary").textContent = n >= 3
    ? `${n - imp} civils · ${imp} imposteur${imp>1?"s cachés":" caché"}`
    : "Ajoute au moins 3 joueurs.";

  $("#custom-words").value = store.get("custom", []).map(p => p.join(" / ")).join("\n");
  save();
}

$("#add-player-form").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#player-input").value.trim();
  $("#setup-error").textContent = "";
  if(!name) return;
  if(settings.names.some(n => n.toLowerCase() === name.toLowerCase())){ $("#setup-error").textContent = "Ce prénom existe déjà."; return; }
  if(settings.names.length >= MAX_PLAYERS){ $("#setup-error").textContent = `${MAX_PLAYERS} joueurs maximum.`; return; }
  settings.names.push(name);
  $("#player-input").value = "";
  $("#player-input").focus();
  renderSetup();
});
$("#player-list").addEventListener("click", e => {
  const i = e.target.dataset.del;
  if(i !== undefined){ settings.names.splice(+i, 1); renderSetup(); }
});
$("#save-custom").onclick = () => {
  const pairs = $("#custom-words").value.split("\n")
    .map(l => l.split("/").map(s => s.trim()).filter(Boolean))
    .filter(p => p.length === 2 && p[0].toLowerCase() !== p[1].toLowerCase());
  store.set("custom", pairs);
  $("#custom-status").textContent = ` ${pairs.length} paire${pairs.length>1?"s":""} enregistrée${pairs.length>1?"s":""}`;
  renderSetup();
};

/* ---------- Lancement ---------- */
function pickPair(){
  const cats = allCategories();
  const pool = [];
  selectedCats().forEach(c => cats[c].forEach(p => pool.push({ cat:c, pair:p })));
  if(!pool.length) return null;
  const key = x => x.pair.join("|");
  let fresh = pool.filter(x => !used.includes(key(x)));
  if(!fresh.length){ used = []; fresh = pool; }
  const choice = fresh[Math.floor(Math.random() * fresh.length)];
  used.push(key(choice));
  if(used.length > 1000) used = used.slice(-1000);
  store.set("used", used);
  const [a, b] = Math.random() < .5 ? choice.pair : [...choice.pair].reverse();
  return { cat: choice.cat, civil: a, infiltre: b };
}

function startGame(){
  const n = settings.names.length;
  if(n < 3){ $("#setup-error").textContent = "Il faut au moins 3 joueurs."; return; }
  const pair = pickPair();
  $("#setup-error").textContent = "";
  const roles = randomRoles(n);
  game = {
    ...pair, round: 1, dealIndex: 0,
    players: settings.names.map((name, i) => ({
      name, role: roles[i], alive: true,
      word: roles[i] === "civil" ? pair.civil : roles[i] === "infiltre" ? pair.infiltre : null
    }))
  };
  dealNext();
  show("deal");
}

/* ---------- Distribution ---------- */
function dealNext(){
  const p = game.players[game.dealIndex];
  $("#deal-progress").textContent = `Joueur ${game.dealIndex + 1} / ${game.players.length}`;
  $("#deal-name").textContent = p.name;
  $("#deal-hidden").hidden = false;
  $("#deal-shown").hidden = true;
}
function showWord(p, el){
  if(p.role === "blanc"){
    $("#deal-label").textContent = "Tu es…";
    el.textContent = "👻 L'Amnésique";
    $("#deal-hint").textContent = "Tu n'as pas de mot ! Écoute les autres et bluffe. Si tu es démasqué, tu pourras deviner le mot des civils pour gagner.";
  } else {
    $("#deal-label").textContent = "Ton mot secret est";
    el.textContent = p.word;
    $("#deal-hint").textContent = "Attention : tu ne sais pas si tu es civil ou infiltré…";
  }
}
$("#reveal-btn").onclick = () => {
  showWord(game.players[game.dealIndex], $("#deal-word"));
  $("#deal-hidden").hidden = true;
  $("#deal-shown").hidden = false;
};
$("#hide-btn").onclick = () => {
  if(game.peek){ game.peek = false; show("game"); return; }
  game.dealIndex++;
  if(game.dealIndex < game.players.length) dealNext();
  else { setupRound(); show("game"); }
};

/* ---------- Tours & votes ---------- */
function setupRound(){
  const alive = game.players.filter(p => p.alive);
  const starters = alive.filter(p => p.role !== "blanc");
  const start = (starters.length ? starters : alive)[Math.floor(Math.random() * (starters.length || alive.length))];
  const idx = alive.indexOf(start);
  game.order = [...alive.slice(idx), ...alive.slice(0, idx)];
  renderGame();
}
function renderGame(){
  $("#round-num").textContent = game.round;
  $("#starter").textContent = `${game.order[0].name} commence !`;
  $("#order-list").innerHTML = game.order.map(p => `<li>${esc(p.name)}</li>`).join("");
  $("#vote-grid").innerHTML = game.players.map((p, i) =>
    `<button class="vote ${p.alive?"":"dead"}" data-vote="${i}" ${p.alive?"":"disabled"}>${esc(p.name)}${p.alive?"":`<span class="tag">${ROLE[p.role].emoji} ${ROLE[p.role].label}</span>`}</button>`).join("");
}
$("#vote-grid").addEventListener("click", e => {
  const b = e.target.closest("[data-vote]"); if(!b || b.disabled) return;
  const p = game.players[+b.dataset.vote];
  modal(`<h2>Éliminer ${esc(p.name)} ?</h2><p class="muted">Le groupe a voté contre ${esc(p.name)} ?</p>`, [
    { label: "Oui, éliminer", fn: () => eliminate(p) },
    { label: "Annuler", cls: "ghost" }
  ]);
});
function eliminate(p){
  p.alive = false;
  const r = ROLE[p.role];
  if(p.role === "blanc"){
    modal(`<p class="big-emoji">👻</p><h2 class="center">${esc(p.name)} était l'Amnésique !</h2>
      <p class="muted center">Dernière chance : quel est le mot des civils ?</p>
      <input id="guess" type="text" placeholder="Ta réponse" autocomplete="off">`, [
      { label: "Valider", keep: true, fn: () => {
        const g = $("#guess").value;
        closeModal();
        if(normalize(g) && normalize(g) === normalize(game.civil)) return endGame("blanc", p);
        modal(`<p class="big-emoji">❌</p><h2 class="center">Raté !</h2><p class="center muted">Ce n'était pas « ${esc(g || "…")} ».</p>`,
          [{ label: "Continuer", fn: afterElimination }]);
      }}
    ]);
    setTimeout(() => $("#guess") && $("#guess").focus(), 50);
    return;
  }
  modal(`<p class="big-emoji">${r.emoji}</p><h2 class="center">${esc(p.name)} était ${p.role === "civil" ? "un civil" : "un infiltré"} !</h2>`,
    [{ label: "Continuer", fn: afterElimination }]);
}
const normalize = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
function afterElimination(){
  const alive = game.players.filter(p => p.alive);
  const civ = alive.filter(p => p.role === "civil").length;
  const imp = alive.length - civ;
  if(imp === 0) return endGame("civil");
  if(civ <= 1) return endGame("imposteurs");
  game.round++;
  setupRound();
}
$("#peek-btn").onclick = () => {
  const names = game.players.filter(p => p.alive);
  modal(`<h2>Qui veut revoir son mot ?</h2>`, [
    ...names.map(p => ({ label: p.name, cls: "ghost", fn: () => {
      game.peek = true;
      game.dealIndex = game.players.indexOf(p);
      dealNext();
      $("#deal-progress").textContent = "Revoir son mot";
      show("deal");
    }})),
    { label: "Annuler" }
  ]);
};
$("#quit-btn").onclick = () => modal(`<h2>Abandonner la partie ?</h2>`, [
  { label: "Oui, abandonner", fn: () => endGame(null) },
  { label: "Continuer à jouer", cls: "ghost" }
]);

/* ---------- Fin ---------- */
function endGame(winner, blancWinner){
  const pts = { civil: 2, infiltre: 10, blanc: 6 };
  game.players.forEach(p => {
    let win = false;
    if(winner === "civil") win = p.role === "civil";
    if(winner === "imposteurs") win = p.role !== "civil" && (p.alive || p.role === "infiltre");
    if(winner === "blanc") win = p === blancWinner;
    if(win) scores[p.name] = (scores[p.name] || 0) + pts[p.role];
    p.win = win;
  });
  store.set("scores", scores);

  const t = {
    civil: ["🎉 Les civils gagnent !", "Tous les imposteurs ont été démasqués."],
    imposteurs: ["🕵️ Les imposteurs gagnent !", "Ils ont survécu jusqu'au bout."],
    blanc: ["👻 L'Amnésique gagne !", `${blancWinner ? blancWinner.name : ""} a deviné le mot des civils !`],
    null: ["Partie abandonnée", "Voici ce qui se cachait…"]
  }[winner];
  $("#end-title").textContent = t[0];
  $("#end-sub").textContent = t[1];
  $("#end-civil").textContent = game.civil;
  $("#end-infiltre").textContent = game.infiltre;
  $("#end-roles").innerHTML = game.players.map(p =>
    `<li><span>${p.win ? "🏆 " : ""}${esc(p.name)}</span><span>${ROLE[p.role].emoji} ${ROLE[p.role].label}</span></li>`).join("");
  show("end");
}
$("#replay-btn").onclick = startGame;
$("#home-btn").onclick = () => { renderSetup(); show("setup"); };
$("#start-btn").onclick = startGame;

function showScores(){
  const rows = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  modal(`<h2>🏆 Scores</h2>${rows.length
    ? `<ul class="roles scores">${rows.map(([n, s], i) => `<li><span>${["🥇","🥈","🥉"][i] || ""} ${esc(n)}</span><span>${s} pts</span></li>`).join("")}</ul>`
    : `<p class="muted">Aucune partie terminée pour l'instant.</p>`}
    <p class="muted">Victoire : civil +2 · infiltré +10 · amnésique +6</p>`, [
    { label: "Fermer" },
    { label: "Remettre à zéro", cls: "ghost danger", fn: () => { scores = {}; store.set("scores", scores); } }
  ]);
}
$("#scores-btn").onclick = showScores;
$("#scores-btn-2").onclick = showScores;
$("#rules-btn").onclick = () => modal(`<div class="rules"><h2>📖 Règles</h2>
  <p>Chaque joueur reçoit secrètement un mot. Les <strong>civils</strong> ont tous le même. Les <strong>infiltrés</strong> ont un mot proche (ex : <em>Café</em> / <em>Thé</em>) et ne savent pas qu'ils sont infiltrés. L'<strong>amnésique</strong> n'a aucun mot.</p>
  <ol>
    <li>Chacun son tour, dites <strong>un seul mot ou une courte phrase</strong> qui décrit votre mot, sans le dire.</li>
    <li>Discutez, puis <strong>votez</strong> pour éliminer le joueur le plus suspect.</li>
    <li>Son rôle est révélé. Si c'est l'amnésique, il peut tenter de deviner le mot des civils pour gagner seul.</li>
    <li>On recommence jusqu'à la victoire d'un camp.</li>
  </ol>
  <p>✅ <strong>Civils</strong> : éliminer tous les infiltrés et amnésiques.<br>🕵️ <strong>Imposteurs</strong> : survivre jusqu'à ce qu'il ne reste qu'un seul civil.</p></div>`,
  [{ label: "C'est parti !" }]);
$("#modal").addEventListener("click", e => { if(e.target.id === "modal" && !$("#guess")) closeModal(); });

renderSetup();
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
