// Cloudflare Worker: the static site (dist/, ASSETS), plus /turn: relay (TURN) credentials for online co-op, so two
// browsers whose networks won't link straight (carrier NAT: phone, satellite, rural internet) still can.
// Minted by Cloudflare's TURN service (Realtime → TURN Server: a key) when the TURN_KEY_ID and TURN_KEY_TOKEN
// secrets are set; else 204 and the game uses the free ones (index.html: netIce).
export default {
  async fetch(req, env) {
    if (new URL(req.url).pathname === '/turn') return turn(env);
    return env.ASSETS.fetch(req);
  },
};

const H = { 'cache-control': 'no-store', 'content-type': 'application/json' };
async function turn(env) {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_TOKEN) return new Response(null, { status: 204, headers: H });
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: { authorization: `Bearer ${env.TURN_KEY_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify({ ttl: 86400 }),   // a day
    });
    if (!r.ok) return new Response(null, { status: 502, headers: H });
    const j = await r.json();
    // (port 53 is blocked by browsers: drop it)
    const ice = [].concat(j.iceServers || []).map(s => ({ ...s, urls: [].concat(s.urls || []).filter(u => !/:53(\?|$)/.test(u)) })).filter(s => s.urls.length);
    return new Response(JSON.stringify({ iceServers: ice }), { headers: H });
  } catch (e) {
    return new Response(null, { status: 502, headers: H });
  }
}
