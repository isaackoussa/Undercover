// Logique du mode en ligne. Indépendante du stockage : `storage` fournit
// load(code) -> { room, etag } | null  et  save(code, room, etag|null) -> boolean.
import CATEGORIES from "../../../words.js";

export const MAX_PLAYERS = 12;
const IMPOSTORS = { 3:1, 4:1, 5:2, 6:2, 7:2, 8:3, 9:3, 10:3, 11:4, 12:4 };
const POINTS = { civil: 2, infiltre: 10, blanc: 6 };
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export class GameError extends Error { constructor(msg, status = 400){ super(msg); this.status = status; } }
const fail = (msg, status) => { throw new GameError(msg, status); };

const rand = n => Math.floor(Math.random() * n);
const shuffle = a => { a = [...a]; for(let i = a.length - 1; i > 0; i--){ const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const token = () => Array.from({ length: 24 }, () => "0123456789abcdef"[rand(16)]).join("");
const clean = (s, max) => String(s ?? "").replace(/[\u0000-\u001f]/g, "").replace(/\s+/g, " ").trim().slice(0, max);
const normalize = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

function randomRoles(n){
  const total = IMPOSTORS[Math.min(Math.max(n, 3), 12)];
  const blancs = total < 2 ? 0 : rand(Math.floor(total / 2) + 1);
  return shuffle([
    ...Array(total - blancs).fill("infiltre"),
    ...Array(blancs).fill("blanc"),
    ...Array(n - total).fill("civil")
  ]);
}

function pickPair(room){
  const pool = [];
  for(const [cat, list] of Object.entries(CATEGORIES)) list.forEach(p => pool.push({ cat, pair: p }));
  (room.custom || []).forEach(p => pool.push({ cat: "✏️ Mots perso", pair: p }));
  const key = x => x.pair.join("|");
  let fresh = pool.filter(x => !room.used.includes(key(x)));
  if(!fresh.length){ room.used = []; fresh = pool; }
  const choice = fresh[rand(fresh.length)];
  room.used.push(key(choice));
  const [a, b] = Math.random() < .5 ? choice.pair : [...choice.pair].reverse();
  return { cat: choice.cat, civil: a, infiltre: b };
}

const alive = room => room.players.filter(p => p.alive);
const byPid = (room, pid) => room.players.find(p => p.pid === pid);

function newRoundOrder(room){
  const live = alive(room);
  const starters = live.filter(p => p.role !== "blanc");
  const first = (starters.length ? starters : live)[rand(starters.length || live.length)];
  const i = live.indexOf(first);
  room.order = [...live.slice(i), ...live.slice(0, i)].map(p => p.pid);
  room.turn = 0;
  room.votes = {};
  room.phase = "clues";
}

function startGame(room){
  if(room.players.length < 3) fail("Il faut au moins 3 joueurs.");
  const pair = pickPair(room);
  const roles = randomRoles(room.players.length);
  Object.assign(room, pair, { round: 1, clues: [], event: null, winner: null, blancWinner: null });
  room.players.forEach((p, i) => {
    p.role = roles[i];
    p.alive = true;
    p.word = p.role === "civil" ? pair.civil : p.role === "infiltre" ? pair.infiltre : null;
    p.win = false;
  });
  room.game = (room.game || 0) + 1;
  newRoundOrder(room);
}

function endGame(room, winner, blanc){
  room.phase = "end";
  room.winner = winner;
  room.players.forEach(p => {
    let win = false;
    if(winner === "civil") win = p.role === "civil";
    if(winner === "imposteurs") win = p.role !== "civil" && (p.alive || p.role === "infiltre");
    if(winner === "blanc") win = p === blanc;
    p.win = win;
    if(win) room.scores[p.name] = (room.scores[p.name] || 0) + POINTS[p.role];
  });
}

function checkWin(room){
  const live = alive(room);
  const civ = live.filter(p => p.role === "civil").length;
  if(civ === live.length) return endGame(room, "civil");
  if(civ <= 1) return endGame(room, "imposteurs");
  room.round++;
  newRoundOrder(room);
}

function resolveVote(room){
  const tally = {};
  Object.values(room.votes).forEach(t => { tally[t] = (tally[t] || 0) + 1; });
  const max = Math.max(...Object.values(tally));
  const top = Object.keys(tally).filter(k => tally[k] === max).map(Number);
  if(top.length > 1){
    room.votes = {};
    room.event = { type: "tie", names: top.map(pid => byPid(room, pid).name), n: (room.event?.n || 0) + 1 };
    return;
  }
  const p = byPid(room, top[0]);
  p.alive = false;
  room.event = { type: "eliminated", pid: p.pid, name: p.name, role: p.role, votes: max };
  if(p.role === "blanc"){ room.phase = "guess"; room.guesser = p.pid; return; }
  checkWin(room);
}

const actions = {
  start(room, me){
    if(!me.host) fail("Seul l'hôte peut lancer la partie.", 403);
    if(room.phase !== "lobby") fail("La partie a déjà commencé.");
    startGame(room);
  },
  clue(room, me, { text }){
    if(room.phase !== "clues") fail("Ce n'est pas le moment des indices.");
    if(room.order[room.turn] !== me.pid) fail("Ce n'est pas ton tour.");
    const t = clean(text, 40);
    if(!t) fail("Écris un indice.");
    if(me.word && normalize(t).includes(normalize(me.word))) fail("Tu ne peux pas donner ton mot !");
    room.clues.push({ round: room.round, pid: me.pid, text: t });
    if(++room.turn >= room.order.length){ room.phase = "vote"; room.votes = {}; room.event = null; }
  },
  skip(room, me){
    if(!me.host) fail("Seul l'hôte peut passer un tour.", 403);
    if(room.phase !== "clues") fail("Rien à passer.");
    room.clues.push({ round: room.round, pid: room.order[room.turn], text: "⏭️ (passé)" });
    if(++room.turn >= room.order.length){ room.phase = "vote"; room.votes = {}; room.event = null; }
  },
  vote(room, me, { target }){
    if(room.phase !== "vote") fail("Ce n'est pas le moment de voter.");
    if(!me.alive) fail("Tu es éliminé, tu ne votes plus.");
    const t = byPid(room, Number(target));
    if(!t || !t.alive) fail("Joueur introuvable.");
    if(t === me) fail("Tu ne peux pas voter contre toi.");
    room.votes[me.pid] = t.pid;
    if(Object.keys(room.votes).length >= alive(room).length) resolveVote(room);
  },
  closevote(room, me){
    if(!me.host) fail("Seul l'hôte peut clore le vote.", 403);
    if(room.phase !== "vote") fail("Aucun vote en cours.");
    if(!Object.keys(room.votes).length) fail("Personne n'a encore voté.");
    resolveVote(room);
  },
  guess(room, me, { text }){
    if(room.phase !== "guess") fail("Pas de devinette en cours.");
    if(room.guesser !== me.pid) fail("Ce n'est pas à toi de deviner.");
    const g = clean(text, 40);
    room.event = { ...room.event, guess: g || "…", correct: !!g && normalize(g) === normalize(room.civil) };
    if(room.event.correct) return endGame(room, "blanc", me);
    checkWin(room);
  },
  skipguess(room, me){
    if(!me.host) fail("Seul l'hôte peut passer la devinette.", 403);
    if(room.phase !== "guess") fail("Pas de devinette en cours.");
    room.event = { ...room.event, guess: "(pas de réponse)", correct: false };
    checkWin(room);
  },
  replay(room, me){
    if(!me.host) fail("Seul l'hôte peut relancer.", 403);
    if(room.phase !== "end") fail("La partie n'est pas finie.");
    room.phase = "lobby";
    room.players.forEach(p => { p.alive = true; p.role = null; p.word = null; p.win = false; });
    room.event = null;
  },
  abort(room, me){
    if(!me.host) fail("Seul l'hôte peut arrêter la partie.", 403);
    if(room.phase === "lobby" || room.phase === "end") fail("Aucune partie en cours.");
    room.phase = "end"; room.winner = null;
  },
  kick(room, me, { target }){
    if(!me.host) fail("Seul l'hôte peut retirer un joueur.", 403);
    if(room.phase !== "lobby") fail("Impossible pendant une partie.");
    const t = byPid(room, Number(target));
    if(!t || t === me) fail("Joueur introuvable.");
    room.players = room.players.filter(p => p !== t);
  },
  leave(room, me){
    if(room.phase !== "lobby" && room.phase !== "end") fail("Impossible de quitter pendant une partie.");
    room.players = room.players.filter(p => p !== me);
    if(me.host && room.players.length) room.players[0].host = true;
  }
};

// Ce que voit un joueur : jamais le mot ni le rôle des autres tant qu'ils sont en jeu.
export function view(room, me){
  const ended = room.phase === "end";
  const reveal = p => ended || !p.alive;
  return {
    code: room.code, version: room.version, phase: room.phase, round: room.round, game: room.game || 0,
    you: { pid: me.pid, name: me.name, host: !!me.host, alive: me.alive !== false, word: me.word ?? null,
           blanc: me.role === "blanc", hasRole: !!me.role, voted: room.votes?.[me.pid] ?? null, guesser: room.guesser === me.pid },
    players: room.players.map(p => ({
      pid: p.pid, name: p.name, host: !!p.host, alive: p.alive !== false,
      role: reveal(p) ? p.role : null, win: ended ? !!p.win : false,
      voted: room.phase === "vote" ? p.pid in (room.votes || {}) : false
    })),
    order: room.order || [], turn: room.turn || 0,
    clues: room.clues || [], event: room.event || null,
    end: ended ? { winner: room.winner, civil: room.civil, infiltre: room.infiltre } : null,
    scores: room.scores
  };
}

async function mutate(storage, code, fn){
  for(let attempt = 0; attempt < 8; attempt++){
    const found = await storage.load(code);
    if(!found) fail("Salle introuvable. Vérifie le code.", 404);
    const room = found.room;
    const result = fn(room);
    room.version++;
    room.updatedAt = Date.now();
    if(await storage.save(code, room, found.etag)) return { room, result };
    await new Promise(r => setTimeout(r, 40 + rand(120)));
  }
  fail("Trop de monde en même temps, réessaie.", 409);
}

function findMe(room, tok){
  const me = room.players.find(p => p.token === tok);
  if(!me) fail("Tu ne fais plus partie de cette salle.", 403);
  return me;
}

function parseCustom(custom){
  if(!Array.isArray(custom)) return [];
  return custom.slice(0, 300)
    .filter(p => Array.isArray(p) && p.length === 2)
    .map(p => [clean(p[0], 30), clean(p[1], 30)])
    .filter(p => p[0] && p[1] && normalize(p[0]) !== normalize(p[1]));
}

export async function handle(body, storage){
  const action = String(body?.action || "");
  const code = clean(body?.code, 8).toUpperCase();

  if(action === "create"){
    const name = clean(body.name, 20);
    if(!name) fail("Entre ton prénom.");
    for(let i = 0; i < 20; i++){
      const c = Array.from({ length: 4 }, () => CODE_CHARS[rand(CODE_CHARS.length)]).join("");
      const tok = token();
      const room = {
        code: c, version: 1, createdAt: Date.now(), updatedAt: Date.now(), phase: "lobby", nextPid: 1,
        players: [{ pid: 0, token: tok, name, host: true, alive: true }],
        used: [], scores: {}, custom: parseCustom(body.custom)
      };
      if(await storage.save(c, room, null)) return { token: tok, code: c, state: view(room, room.players[0]) };
    }
    fail("Impossible de créer une salle, réessaie.", 500);
  }

  if(action === "join"){
    const name = clean(body.name, 20);
    if(!name) fail("Entre ton prénom.");
    const tok = token();
    const { room } = await mutate(storage, code, room => {
      if(room.phase !== "lobby") fail("La partie a déjà commencé, attends la suivante.");
      if(room.players.length >= MAX_PLAYERS) fail(`Salle pleine (${MAX_PLAYERS} joueurs maximum).`);
      if(room.players.some(p => normalize(p.name) === normalize(name))) fail("Ce prénom est déjà pris dans la salle.");
      room.players.push({ pid: room.nextPid++, token: tok, name, alive: true });
    });
    return { token: tok, code, state: view(room, findMe(room, tok)) };
  }

  if(action === "state"){
    const found = await storage.load(code);
    if(!found) fail("Salle introuvable. Vérifie le code.", 404);
    const me = findMe(found.room, body.token);
    if(body.version && Number(body.version) === found.room.version) return { unchanged: true };
    return { state: view(found.room, me) };
  }

  const fn = actions[action];
  if(!fn) fail("Action inconnue.");
  const { room } = await mutate(storage, code, room => fn(room, findMe(room, body.token), body));
  const me = room.players.find(p => p.token === body.token);
  return me ? { state: view(room, me) } : { left: true };
}
