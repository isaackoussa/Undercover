import { getStore } from "@netlify/blobs";
import { handle, GameError } from "./lib/online.mjs";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
});

export default async (req) => {
  if(req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  const store = getStore({ name: "rooms", consistency: "strong" });
  const storage = {
    async load(code){
      if(!/^[A-Z]{4}$/.test(code)) return null;
      const r = await store.getWithMetadata(code, { type: "json" });
      return r ? { room: r.data, etag: r.etag } : null;
    },
    async save(code, room, etag){
      const res = await store.setJSON(code, room, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
      return res.modified;
    }
  };
  try {
    const body = await req.json().catch(() => ({}));
    return json(await handle(body, storage));
  } catch (e) {
    if(e instanceof GameError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Erreur du serveur, réessaie." }, 500);
  }
};

export const config = { path: "/api/room" };
