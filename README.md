# देसी नॉस्टैल्जिया आर्काइव

65 Indian nostalgia websites on one screen, with real screenshots and how many
people each site says are inside it right now.

## Deploying

It is a static site. There is no build step, no server, no database.

```bash
npx vercel --prod
```

That is the whole deploy. Files that must ship:

| file | what it is |
|---|---|
| `index.html` | the page — markup, styles, script, inlined font |
| `shots.js` | 65 screenshots as data URIs (~4 MB) |
| `palette.js` | two colours pulled out of each screenshot |
| `crowd.js` | each site's live count + the timestamp it was read |
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
the headline total, the chowk ranking and the row totals. Right now that is 11
of 40 sites, which is the difference between the honest 5,865 and the naive
6,355.

The counts are read off each site by a headless browser, because a browser
cannot fetch them cross-origin. Re-read them any time:

```bash
node refresh.js              # counts only  (~4 min)
node refresh.js --shots      # counts + re-capture weak previews  (~15 min)
```

Then redeploy. To automate, run `node refresh.js` on a cron / GitHub Action and
commit the changed `crowd.js` — the page always shows the time of the reading,
so it never claims to be more live than it is.

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
