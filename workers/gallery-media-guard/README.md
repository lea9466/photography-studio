# gallery-media-guard — deploy runbook

This Worker sits in front of `albums.studio-galleries.com` and stops anyone
without a valid, unexpired signature from reading a private gallery's
photos directly from R2 — closing the leak where a raw CDN link (copied,
right-clicked, or opened in a new tab) worked forever with no password
check. Public portfolio galleries and branding/cover images are unaffected —
they're still served exactly as fast, straight from Cloudflare's edge.

None of this touches the Next.js app's deploy — it's a separate, one-time
setup in your Cloudflare account. Do these steps in order.

## 1. Install and log in to wrangler (one-time, on your machine)

```
npm install -g wrangler
wrangler login
```

This opens a browser tab asking you to authorize wrangler against your
Cloudflare account.

## 2. Set the shared secret

Use this generated value (or any other random 64-char hex string — just
keep it secret):

```
95705fc12e28a1f14b4f9aa0c36923ee8eadd147d40b22134c4e8270c0938797
```

From this folder, run:

```
wrangler secret put R2_EDGE_SIGNING_SECRET
```

When it prompts, paste the value above.

## 3. Deploy the Worker

From this folder:

```
wrangler deploy
```

This uploads the Worker and, because of the `routes` entry already in
`wrangler.toml`, should bind it to `albums.studio-galleries.com/*`
automatically. If it reports the route is already claimed by something else
(the current direct R2 binding), continue to step 4 — you'll attach the
route there instead.

## 4. Confirm the route in the dashboard

Go to **Cloudflare dashboard → Workers & Pages → gallery-media-guard →
Settings → Triggers → Routes**, and confirm `albums.studio-galleries.com/*`
is listed. If it isn't (or if step 4 reported a conflict), add it there
manually — this is what replaces the previous direct "R2 bucket → custom
domain" binding for that domain. If the dashboard still shows the old
direct R2-to-domain binding for `albums.studio-galleries.com` under your R2
bucket's **Settings → Public access**, remove/disconnect that binding so
the Worker is the only thing serving requests to this domain (otherwise
requests may bypass the Worker entirely).

## 5. Add the same secret to the Next.js app's environment

Add this line to your local `.env.local` **and** to your production
environment variables (wherever the app is deployed — e.g. Vercel project
settings):

```
R2_EDGE_SIGNING_SECRET=95705fc12e28a1f14b4f9aa0c36923ee8eadd147d40b22134c4e8270c0938797
```

Must be the exact same value used in step 2 — this is what lets the app's
signed links and the Worker's verification agree.

## 6. Verify

- Open a **private** gallery in the app — photos should load normally.
- Copy a photo's direct URL (right-click → copy image address) and open it
  in a private/incognito window with no session. It should now load only
  while the link is fresh, and return `403 Forbidden` once it's stale
  (private-gallery links expire ~30 minutes after being issued — reloading
  the gallery page issues a fresh one).
- Open a **public portfolio** gallery — photos should still load instantly,
  with the same URL reused across page reloads that day (check the Network
  tab: repeated requests for the same photo should hit Cloudflare's cache,
  not round-trip to R2 each time).
- Try a direct URL to an `originals/`, `edited/`, or `zips/` key (if you
  have one from before) — it should now always return `403`, regardless of
  any query string.

If anything 403s that shouldn't, double check the secret matches exactly in
both places (step 2 and step 5) and that no extra whitespace snuck in when
pasting.
