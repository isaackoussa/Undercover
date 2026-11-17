"use strict";
/* Mode en ligne : chaque joueur sur son téléphone, synchronisé via /api/room. */
(() => {
  const root = $("#online-root");
  let session = store.get("online", null);   // { code, token }
  let state = null, timer = null, busy = false, lastEventKey = null, hideWord = true;

  /* ---------- Onglets ---------- */
  function setMode(mode){
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("on", t.dataset.mode === mode));
    $("#local-setup").hidden = mode !== "local";
    $("#online-setup").hidden = mode !== "online";
    store.set("mode", mode);
  }
  document.querySelectorAll(".tab").forEach(t => t.onclick = () => setMode(t.dataset.mode));

  /* ---------- API ---------- */
  async function api(action, extra = {}){
    if(location.protocol === "file:") throw new Error("Le mode en ligne fonctionne une fois le site en ligne (Netlify).");
    let res;
    try {
      res = await fetch("api/room", { method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...(session || {}), ...extra }) });
    } catch { throw new Error("Connexion impossible. Vérifie ton réseau."); }
    const data = await res.json().catch(() => ({ error: "Le serveur ne répond pas correctement." }));
    if(!res.ok){ const e = new Error(data.error || "Erreur"); e.status = res.status; throw e; }
    return data;
  }
  async function act(action, extra){
    if(busy) return;
    busy = true;
    try { const d = await api(action, extra); if(d.left) return leaveLocal(); apply(d.state); }
    catch(e){ toast(e.message); }
    finally { busy = false; }
  }
  function toast(msg){
    modal(`<p class="center">${esc(msg)}</p>`, [{ label: "OK" }]);
  }

  /* ---------- Créer / rejoindre ---------- */
  const nameInput = $("#online-name");
  nameInput.value = store.get("online-name", "");
  function getName(){
    const n = nameInput.value.trim();
    if(!n){ $("#online-error").textContent = "Entre ton prénom."; nameInput.focus(); return null; }
    store.set("online-name", n);
    $("#online-error").textContent = "";
    return n;
  }
  async function enter(action, extra){
    const name = getName(); if(!name) return;
    session = null;
    try {
      const d = await api(action, { name, ...extra });
      session = { code: d.code, token: d.token };
      store.set("online", session);
      history.replaceState(null, "", `?salle=${d.code}`);
      hideWord = true; lastEventKey = null;
      apply(d.state);
      show("online");
      poll();
    } catch(e){ $("#online-error").textContent = e.message; }
  }
  $("#online-create").onclick = () => enter("create", { custom: store.get("custom", []) });
  $("#online-join").onclick = () => {
    const code = $("#online-code").value.trim().toUpperCase();
    if(code.length !== 4){ $("#online-error").textContent = "Le code fait 4 lettres."; return; }
    enter("join", { code });
  };
  $("#online-code").addEventListener("keydown", e => { if(e.key === "Enter") $("#online-join").click(); });

  function leaveLocal(){
    clearTimeout(timer);
    session = null; state = null;
    store.set("online", null);
    history.replaceState(null, "", location.pathname);
    setMode("online");
    show("setup");
  }

  /* ---------- Synchronisation ---------- */
  async function poll(){
    clearTimeout(timer);
    if(!session) return;
    try {
      const d = await api("state", { version: state?.version });
      if(!d.unchanged) apply(d.state);
    } catch(e){
      if(e.status === 403 || e.status === 404){ toast(e.message); return leaveLocal(); }
    }
    timer = setTimeout(poll, document.hidden ? 5000 : 1500);
  }
  document.addEventListener("visibilitychange", () => { if(!document.hidden && session) poll(); });

  function apply(s){
    if(!s) return;
    if(state && s.game !== state.game) hideWord = true;
    state = s;
    announce();
    render();
  }

  /* ---------- Annonces ---------- */
  const ROLE_TXT = { civil: "un civil 🙂", infiltre: "un infiltré 🕵️", blanc: "l'amnésique 👻" };
  function announce(){
    const ev = state.event;
    if(!ev) return;
    const key = `${state.game}-${state.round}-${ev.type}-${ev.pid ?? ev.n}-${ev.guess ?? ""}`;
    if(key === lastEventKey) return;
    const first = lastEventKey === null;
    lastEventKey = key;
    if(first) return; // pas de popup en rejoignant/rechargeant
    if(ev.type === "tie") return modal(`<p class="big-emoji">⚖️</p><h2 class="center">Égalité !</h2><p class="center muted">${ev.names.map(esc).join(", ")} sont à égalité. On revote.</p>`, [{ label: "OK" }]);
    if(ev.type === "eliminated" && ev.guess === undefined)
      return modal(`<p class="big-emoji">${ev.role === "civil" ? "🙂" : ev.role === "infiltre" ? "🕵️" : "👻"}</p><h2 class="center">${esc(ev.name)} est éliminé·e</h2><p class="center">C'était ${ROLE_TXT[ev.role]}${ev.role === "blanc" ? " ! Il/elle peut encore deviner le mot des civils." : "."}</p>`, [{ label: "OK" }]);
    if(ev.guess !== undefined)
      return modal(`<p class="big-emoji">${ev.correct ? "🎯" : "❌"}</p><h2 class="center">${ev.correct ? "Bien deviné !" : "Raté !"}</h2><p class="center muted">${esc(ev.name)} a proposé « ${esc(ev.guess)} ».</p>`, [{ label: "OK" }]);
  }

  /* ---------- Rendu ---------- */
  const P = pid => state.players.find(p => p.pid === pid) || { name: "?" };
  const ROLE_LBL = { civil: "🙂 Civil", infiltre: "🕵️ Infiltré", blanc: "👻 Amnésique" };

  function wordCard(){
    const y = state.you;
    if(!y.hasRole) return "";
    const w = y.blanc ? "👻 Tu es l'Amnésique (pas de mot)" : esc(y.word);
    return `<div class="card mini-word"><div><small class="muted">${y.alive ? "Ton mot" : "Tu es éliminé·e · ton mot était"}</small><br>
      <strong class="${hideWord ? "blur" : ""}" data-toggle-word>${w}</strong></div>
      <button class="btn ghost small" data-toggle-word>${hideWord ? "👀 Voir" : "🙈 Cacher"}</button></div>`;
  }

  function cluesCard(){
    if(!state.clues.length && state.phase !== "clues") return "";
    let html = "", round = 0;
    state.clues.forEach(c => {
      if(c.round !== round){ round = c.round; html += `</ul><p class="clue-round">Tour ${round}</p><ul class="clues">`; }
      html += `<li><span class="who">${esc(P(c.pid).name)}</span><strong>${esc(c.text)}</strong></li>`;
    });
    if(state.phase === "clues"){
      if(round !== state.round) html += `</ul><p class="clue-round">Tour ${state.round}</p><ul class="clues">`;
      state.order.slice(state.turn).forEach((pid, i) =>
        html += `<li><span class="who">${esc(P(pid).name)}</span><span class="${i === 0 ? "now" : "muted"}">${i === 0 ? "écrit…" : "en attente"}</span></li>`);
    }
    return `<div class="card"><h2>💬 Indices</h2><ul class="clues">${html}</ul></div>`;
  }

  function header(){
    const titles = { lobby: "Salle d'attente", clues: `Tour ${state.round} · indices`, vote: `Tour ${state.round} · vote`, guess: `Tour ${state.round} · dernière chance`, end: "Fin de partie" };
    return `<header class="hero small-hero"><h2>${titles[state.phase]}</h2><p class="sub">Salle <strong>${esc(state.code)}</strong> · ${esc(state.you.name)}${state.you.host ? " (hôte)" : ""}</p></header>`;
  }

  function lobby(){
    const y = state.you, n = state.players.length;
    const imp = { 3:1, 4:1, 5:2, 6:2, 7:2, 8:3, 9:3, 10:3, 11:4, 12:4 }[n];
    return `
      <div class="card center"><small class="muted">Code de la salle</small><div class="room-code">${esc(state.code)}</div>
        <button class="btn small" data-share>📤 Inviter des amis</button></div>
      <div class="card"><h2>Joueurs <span class="pill">${n} / 12</span></h2>
        <ul class="players-online">${state.players.map(p => `<li><span>${p.host ? "👑 " : ""}${esc(p.name)}${p.pid === y.pid ? " (toi)" : ""}</span>
          ${y.host && p.pid !== y.pid ? `<button class="link-btn" data-kick="${p.pid}">retirer</button>` : ""}</li>`).join("")}</ul>
        <p class="muted">${n >= 3 ? `${n - imp} civils · ${imp} imposteur${imp > 1 ? "s cachés" : " caché"} (répartition au hasard)` : "Il faut au moins 3 joueurs."}</p></div>
      ${y.host ? `<button class="btn big" data-act="start" ${n < 3 ? "disabled" : ""}>🚀 Lancer la partie</button>`
               : `<div class="banner"><span class="spin"></span>En attente que l'hôte lance la partie…</div>`}
      ${scoresCard()}
      <button class="btn ghost danger" data-leave>Quitter la salle</button>`;
  }

  function clues(){
    const y = state.you, cur = state.order[state.turn], mine = cur === y.pid;
    const last = state.event?.type === "eliminated" && state.round > 1 && state.clues.every(c => c.round !== state.round)
      ? `<div class="banner warn">${esc(state.event.name)} a été éliminé·e : c'était ${ROLE_TXT[state.event.role]}</div>` : "";
    return `${last}${wordCard()}
      ${mine ? `<div class="card"><h2>✍️ À toi !</h2><p class="muted">Donne un indice (un mot ou une courte phrase) sans dire ton mot.</p>
          <form class="row" data-form="clue"><input id="clue-input" maxlength="40" placeholder="Ton indice" autocomplete="off"><button class="btn">Envoyer</button></form></div>`
             : `<div class="banner"><span class="spin"></span>${esc(P(cur).name)} cherche son indice…</div>`}
      ${cluesCard()}
      ${y.host && !mine ? `<button class="btn ghost small" data-act="skip">⏭️ Passer le tour de ${esc(P(cur).name)}</button>` : ""}`;
  }

  function vote(){
    const y = state.you, live = state.players.filter(p => p.alive);
    const done = live.filter(p => p.voted).length;
    const tie = state.event?.type === "tie" ? `<div class="banner warn">⚖️ Égalité ! On revote.</div>` : "";
    return `${tie}${wordCard()}
      <div class="banner">${y.alive ? (y.voted !== null ? "✅ Vote enregistré, tu peux encore changer." : "🗳️ Vote pour éliminer le plus suspect") : "Tu es éliminé·e, tu regardes les autres voter."}
        <br><small class="muted">${done} / ${live.length} ont voté</small></div>
      <div class="grid">${state.players.map(p => {
        const can = y.alive && p.alive && p.pid !== y.pid;
        return `<button class="vote ${p.alive ? "" : "dead"} ${y.voted === p.pid ? "mine" : ""}" ${can ? `data-vote="${p.pid}"` : "disabled"}>
          ${esc(p.name)}${p.pid === y.pid ? " (toi)" : ""}
          ${p.alive ? (p.voted ? `<span class="check">a voté ✓</span>` : "") : `<span class="tag">${ROLE_LBL[p.role]}</span>`}</button>`;
      }).join("")}</div>
      ${cluesCard()}
      ${y.host ? `<button class="btn ghost small" data-act="closevote" ${done ? "" : "disabled"}>⏱️ Clore le vote maintenant</button>` : ""}`;
  }

  function guess(){
    const y = state.you, ev = state.event;
    return `${wordCard()}
      <div class="banner warn">👻 ${esc(ev.name)} était l'amnésique !</div>
      ${y.guesser ? `<div class="card"><h2>🎯 Dernière chance</h2><p class="muted">Devine le mot des civils pour gagner seul·e.</p>
          <form class="row" data-form="guess"><input id="guess-input" maxlength="40" placeholder="Le mot des civils" autocomplete="off"><button class="btn">Valider</button></form></div>`
        : `<div class="banner"><span class="spin"></span>${esc(ev.name)} tente de deviner le mot des civils…</div>`}
      ${cluesCard()}
      ${y.host && !y.guesser ? `<button class="btn ghost small" data-act="skipguess">⏭️ Passer la devinette</button>` : ""}`;
  }

  function scoresCard(){
    const rows = Object.entries(state.scores || {}).sort((a, b) => b[1] - a[1]);
    if(!rows.length) return "";
    return `<div class="card"><h2>🏆 Scores de la salle</h2><ul class="roles scores">${rows.map(([n, s], i) =>
      `<li><span>${["🥇","🥈","🥉"][i] || ""} ${esc(n)}</span><span>${s} pts</span></li>`).join("")}</ul></div>`;
  }

  function end(){
    const e = state.end, y = state.you;
    const t = {
      civil: ["🎉 Les civils gagnent !", "Tous les imposteurs ont été démasqués."],
      imposteurs: ["🕵️ Les imposteurs gagnent !", "Ils ont survécu jusqu'au bout."],
      blanc: ["👻 L'amnésique gagne !", "Il/elle a deviné le mot des civils."],
      null: ["Partie arrêtée", "L'hôte a mis fin à la partie."]
    }[e.winner];
    const me = state.players.find(p => p.pid === y.pid);
    return `<header class="hero"><h1>${t[0]}</h1><p class="sub">${t[1]}${me?.win ? " <strong>Tu as gagné !</strong>" : ""}</p><p class="sub">Salle ${esc(state.code)}</p></header>
      <div class="card words-reveal"><div><small>Mot des civils</small><strong>${esc(e.civil)}</strong></div><div><small>Mot des infiltrés</small><strong>${esc(e.infiltre)}</strong></div></div>
      <div class="card"><h2>Rôles</h2><ul class="roles">${state.players.map(p =>
        `<li><span>${p.win ? "🏆 " : ""}${esc(p.name)}</span><span>${ROLE_LBL[p.role] || ""}</span></li>`).join("")}</ul></div>
      ${cluesCard()}
      ${scoresCard()}
      ${y.host ? `<button class="btn big" data-act="replay">🔄 Nouvelle partie</button>` : `<div class="banner"><span class="spin"></span>En attente que l'hôte relance…</div>`}
      <button class="btn ghost danger" data-leave>Quitter la salle</button>`;
  }

  function render(){
    // Conserver la saisie en cours lors d'un rafraîchissement.
    const typing = document.activeElement && ["clue-input", "guess-input"].includes(document.activeElement.id) ? document.activeElement.id : null;
    const saved = { clue: $("#clue-input")?.value, guess: $("#guess-input")?.value };
    const body = { lobby, clues, vote, guess, end }[state.phase]();
    root.innerHTML = (state.phase === "end" ? "" : header()) + body +
      (state.phase !== "lobby" && state.phase !== "end" && state.you.host ? `<button class="btn ghost danger small" data-act="abort">Arrêter la partie</button>` : "");
    if(saved.clue && $("#clue-input")) $("#clue-input").value = saved.clue;
    if(saved.guess && $("#guess-input")) $("#guess-input").value = saved.guess;
    if(typing && $("#" + typing)) $("#" + typing).focus();
  }

  /* ---------- Interactions ---------- */
  root.addEventListener("click", e => {
    const t = e.target.closest("[data-act],[data-vote],[data-kick],[data-leave],[data-share],[data-toggle-word]");
    if(!t) return;
    if(t.dataset.toggleWord !== undefined){ hideWord = !hideWord; return render(); }
    if(t.dataset.vote) return act("vote", { target: +t.dataset.vote });
    if(t.dataset.kick) return act("kick", { target: +t.dataset.kick });
    if(t.dataset.share !== undefined) return share();
    if(t.dataset.leave !== undefined) return modal(`<h2>Quitter la salle ?</h2>`, [
      { label: "Oui, quitter", fn: async () => { try { await api("leave"); } catch {} leaveLocal(); } },
      { label: "Rester", cls: "ghost" }]);
    const a = t.dataset.act;
    if(a === "abort") return modal(`<h2>Arrêter la partie pour tout le monde ?</h2>`, [
      { label: "Oui, arrêter", fn: () => act("abort") }, { label: "Continuer", cls: "ghost" }]);
    act(a);
  });
  root.addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target.dataset.form;
    const input = f === "clue" ? $("#clue-input") : $("#guess-input");
    const text = input.value.trim();
    if(!text) return input.focus();
    act(f, { text });
  });

  async function share(){
    const url = `${location.origin}${location.pathname}?salle=${state.code}`;
    const text = `Rejoins ma partie d'Infiltré ! Code : ${state.code}`;
    if(navigator.share){ try { await navigator.share({ title: "Infiltré", text, url }); return; } catch {} }
    try { await navigator.clipboard.writeText(`${text}\n${url}`); toast("Lien copié ! Envoie-le à tes amis."); }
    catch { toast(`Envoie ce lien à tes amis :\n${url}`); }
  }

  /* ---------- Démarrage ---------- */
  const urlCode = new URLSearchParams(location.search).get("salle");
  setMode(urlCode ? "online" : store.get("mode", "local"));
  if(urlCode) $("#online-code").value = urlCode.toUpperCase().slice(0, 4);
  if(session && (!urlCode || urlCode.toUpperCase() === session.code)){
    api("state").then(d => { apply(d.state); show("online"); poll(); })
      .catch(e => { if(e.status === 403 || e.status === 404) store.set("online", null), session = null; });
  }
})();
