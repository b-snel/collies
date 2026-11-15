// Cloudflare Worker: the static site (dist/, ASSETS), plus /turn: relay (TURN) credentials for online co-op, so two
// browsers whose networks won't link straight (carrier NAT: phone, satellite, rural internet) still can.
// Minted by Cloudflare's TURN service (Realtime → TURN Server: a key) when the TURN_KEY_ID and TURN_KEY_TOKEN
// secrets are set. Else, or if Cloudflare says no, a line saying why (open /turn in a browser to check) and the game
// uses the free ones (index.html: netIce).
export default {
  async fetch(req, env) {
    if (new URL(req.url).pathname === '/turn') return turn(env);
    return env.ASSETS.fetch(req);
  },
};

const H = { 'cache-control': 'no-store' };
const say = (status, text) => new Response(text + '\n', { status, headers: { ...H, 'content-type': 'text/plain; charset=utf-8' } });
async function turn(env) {
  const id = String(env.TURN_KEY_ID || '').trim(), token = String(env.TURN_KEY_TOKEN || '').trim();   // (pasted with a space or a newline)
  if (!id || !token) return say(404, `relay off: no ${!id ? 'TURN_KEY_ID' : ''}${!id && !token ? ' or ' : ''}${!token ? 'TURN_KEY_TOKEN' : ''} on this Worker (Settings → Variables and Secrets)`);
  let last = 0;
  // the newer endpoint gives the whole list; the older one, one entry
  for (const ep of ['generate-ice-servers', 'generate']) {
    try {
      const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/${ep}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ ttl: 86400 }),   // a day
      });
      last = r.status;
      if (r.status === 404) continue;
      if (!r.ok) break;
      const j = await r.json();
      // (port 53 is blocked by browsers: drop it)
      const ice = [].concat(j.iceServers || []).map(s => ({ ...s, urls: [].concat(s.urls || []).filter(u => !/:53(\?|$)/.test(u)) })).filter(s => s.urls.length);
      if (!ice.length) break;
      return new Response(JSON.stringify({ iceServers: ice }), { headers: { ...H, 'content-type': 'application/json' } });
    } catch (e) { last = -1; }
  }
  return say(502, `relay off: Cloudflare's TURN service said ${last < 0 ? 'nothing (unreachable)' : last}` +
    (last === 401 || last === 403 ? ': check TURN_KEY_TOKEN is the key\'s API token' : last === 404 ? ': check TURN_KEY_ID is the key\'s ID' : ''));
}
