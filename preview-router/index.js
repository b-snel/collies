// <alias>.collies.app/path → <alias>-<TARGET>/path. Custom domains (collies.app,
// original-fever-dream.collies.app) win over this route, so they never land here.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const alias = url.hostname.split('.')[0];
    if (!/^[a-z0-9-]{1,63}$/.test(alias) || alias === 'www') return Response.redirect('https://collies.app' + url.pathname + url.search, 302);
    const target = new URL(url.pathname + url.search, `https://${alias}-${env.TARGET}`);
    const res = await fetch(new Request(target, request), { redirect: 'manual' });
    if (res.status === 404 && url.pathname === '/') return new Response(`No preview for "${alias}"`, { status: 404 });
    const out = new Response(res.body, res);
    const loc = out.headers.get('Location');   // keep redirects on the pretty host
    if (loc) out.headers.set('Location', loc.replace(target.origin, url.origin));
    out.headers.set('X-Robots-Tag', 'noindex');
    return out;
  },
};
