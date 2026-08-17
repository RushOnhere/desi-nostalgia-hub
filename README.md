# देसी नॉस्टैल्जिया आर्काइव

86 Indian nostalgia websites on one screen, with real screenshots and how many
people each site says are inside it right now.

## Deploying

It is a static site: no build step and no server. Supabase is used only for the
live presence count.

```bash
npx vercel --prod
```

That is the whole deploy. Files that must ship:

| file | what it is |
|---|---|
| `index.html` | the page — markup, styles, script, inlined fonts |
| `shots.js` | 86 screenshots as data URIs (~3.9 MB) |
| `palette.js` | two colours pulled out of each screenshot |
| `crowd.js` | each site's scraped count + the time it was read |
| `frameable.js` | which sites allow being embedded live on hover |
| `presence.js` | Supabase config for the measured, real-time count |
| `badge.js` | the one-liner makers embed so their count becomes measured |
| `og.png` | the card X/WhatsApp show when the link is shared |
| `favicon.svg`, `robots.txt`, `sitemap.xml`, `vercel.json` | the usual |

Netlify, Cloudflare Pages or GitHub Pages work identically — point them at this
folder, no build command.

After pointing a domain at it, replace the relative `/og.png` in the meta tags
with the absolute URL (`https://yourdomain/og.png`) — X and WhatsApp will not
resolve a relative image.

## Keeping it fresh

GitHub Actions re-reads the counts every 20 minutes and commits `crowd.js`,
so a deployed copy is never more than about that stale. Enable it by pushing
`.github/workflows/refresh-counts.yml` and allowing Actions write access under
Settings → Actions → General → Workflow permissions.

Each reading is also classified as **live** (`1,283 listening now`) or
**cumulative** (`3,036 have passed through this gali`). A lifetime visitor
odometer only ever climbs, so ranking it against concurrent listeners is
meaningless — cumulative counts still show on their card, labelled "अब तक /
so far", but never enter the chowk, the totals or the crowd sort.

Each reading is appended to `crowd-history.json`. Any counter that has not
changed across three or more readings is marked `moved: false` — it still shows
on its card, but with a grey dot instead of a live one, and it is left out of
the headline total, the chowk ranking and the row totals. Sites whose counter never moves are excluded from the headline
total, the chowk ranking and the row totals.

The counts are read off each site by a headless browser, because a browser
cannot fetch them cross-origin. Re-read them any time:

```bash
node refresh.js              # counts only  (~4 min)
node refresh.js --shots      # counts + re-capture weak previews  (~15 min)
```

Then redeploy. To automate, run `node refresh.js` on a cron / GitHub Action and
commit the changed `crowd.js` — the page always shows the time of the reading,
so it never claims to be more live than it is.

## Two kinds of number

**Scraped** — what a site prints in its own header, read every 20 minutes by the
GitHub Action. Honest, but only as honest as that site's counter: some are
hard-coded, some are lifetime visitor totals rather than people present now.

**Measured** — our own count, in real time, through Supabase. A visitor sends an
anonymous heartbeat every 20 seconds and "here now" is distinct visitors seen in
the last 45 seconds. Any archived site carrying the badge gets a measured count
this way, marked with a brighter dot — those are public, since that is the point
of the badge.

**How many people are on the archive itself is private.** The public
`live_counts()` deliberately excludes it, so no visitor can read it even by
calling the API directly. It is returned only by `hub_viewers(token)`, and the
masthead chip (यहाँ अभी / here now) appears only in a browser that has the
token. Arrive once at `?owner=<token>` — it is stored locally and stripped from
the URL, so it never shows in the address bar or in a shared link. `?owner=off`
forgets it. The token itself is **not in this repo**; only a SHA-256 hash of it
is stored, in a table with RLS on and no policies.

Schema lives in the Supabase project `nostalgiahub`:

- `presence(site, visitor, seen_at)` — RLS on with **no policies**, so the public
  key can neither read nor write rows directly. Verified: a direct read returns
  an empty set, a direct insert returns 401.
- `heartbeat(site, visitor)` — the only way in. Rejects anything that is not
  `hub` or a hostname, and prunes rows older than five minutes.
- `live_counts()` — badge counts only. Aggregates, never raw rows, and never
  the archive's own count.
- `hub_viewers(token)` — the archive's own count, for the owner only.
- `owner_key` — one row holding a SHA-256 hash of the token. RLS on, no
  policies, no grants: unreadable through the API.

The key in `presence.js` is Supabase's **publishable** key and is meant to be
public. The `service_role` key must never appear in this repo or on the page.

### The badge

One line for a maker to paste. It turns their scraped number into a measured
one, and draws a small "N listening now" chip linking back here:

    <script defer src="https://YOUR-DOMAIN/badge.js"></script>

Add `data-chip="off"` to report the count without showing the chip.

## The scripts

| script | job |
|---|---|
| `capture.js` | screenshot every site in the list |
| `recapture.js` | re-shoot sites whose first capture caught an "enter" gate |
| `audit-shots.js` | flag previews that are blank, black or flat |
| `shrink-shots.js` | re-encode previews to the size the tiles actually paint |
| `extract-palette.js` | pull each site's two defining colours out of its screenshot |
| `scrape-counts.js` | read each site's own "N listening" counter |
| `compare-counts.js` | diff two snapshots — shows which counters actually move |
| `contact-sheet.js` | render every preview into one grid image, to eyeball them all |
| `fix-shots.js` | targeted re-capture: dismisses dialogs, then opens entry gates |
| `make-logo.js` | trim the black margin off Desi.png and size it for the masthead |
| `fetch-poppins.js` | download + inline the Poppins subsets (UI face) |
| `make-og.js` | build the share card from the real data |
| `build-artifact.js` | inline everything into one self-contained file |

## Where submissions come in

Two routes, set in `SUBMIT_TO` near the top of the script in `index.html`:

- `form` — the Google Form (live). Public, no sign-in, 3 required questions.
  Responses land in the linked Sheet; keep that Sheet private.
- `repo` — set it to `user/repo` once this is on GitHub. The sheet then gains a
  pre-filled issue link using `.github/ISSUE_TEMPLATE/add-a-site.yml`, and that
  becomes the primary route — which suits an audience already living on GitHub.

Whatever is not configured stays hidden, so no dead buttons.

## Adding a site

Add an entry to the `SITES` array in `index.html`:

```js
{ t:'हिंदी नाम', u:'https://example.com', d:'एक लाइन में', c:'chai',
  g:'☕', h:24, p:'p-dots', k:'latin search words',
  maker:'Name', handle:'their_x_handle', mv:1,
  te:'English name', de:'English one-liner' },
```

`mv:1` means the credit is confirmed — from the site itself or the maker's own
post. Leave it off and the card shows "पुष्टि बाकी / unconfirmed", which is the
honest default for a third-party listing.

Then `node capture.js` (or just `recapture.js` for the one new URL) and
`node refresh.js`.
