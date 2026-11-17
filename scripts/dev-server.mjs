// Serveur local : fichiers statiques + /api/room avec un stockage en mémoire.
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { handle, GameError } from "../netlify/functions/lib/online.mjs";

const root = new URL("..", import.meta.url).pathname;
const rooms = new Map();
let tick = 0;
const storage = {
  async load(code){ const r = rooms.get(code); return r ? { room: structuredClone(r.room), etag: r.etag } : null; },
  async save(code, room, etag){
    const cur = rooms.get(code);
    if(etag ? cur?.etag !== etag : cur) return false;
    rooms.set(code, { room: structuredClone(room), etag: String(++tick) });
    return true;
  }
};
const types = { ".html":"text/html", ".js":"text/javascript", ".mjs":"text/javascript", ".css":"text/css", ".json":"application/json", ".svg":"image/svg+xml" };

http.createServer(async (req, res) => {
  if(req.url.startsWith("/api/room")){
    let body = ""; for await (const c of req) body += c;
    let status = 200, out;
    try { out = await handle(JSON.parse(body || "{}"), storage); }
    catch(e){ status = e instanceof GameError ? e.status : 500; out = { error: e.message }; }
    res.writeHead(status, { "content-type": "application/json" });
    return res.end(JSON.stringify(out));
  }
  const path = normalize(join(root, decodeURIComponent(req.url.split("?")[0]) === "/" ? "index.html" : decodeURIComponent(req.url.split("?")[0])));
  if(!path.startsWith(root)){ res.writeHead(403); return res.end(); }
  try { const data = await readFile(path); res.writeHead(200, { "content-type": types[extname(path)] || "application/octet-stream" }); res.end(data); }
  catch { res.writeHead(404); res.end("Not found"); }
}).listen(process.env.PORT || 8888, () => console.log(`http://localhost:${process.env.PORT || 8888}`));
