# Lilac Bakery — one-page website

Mobile-first, fast-loading site for **Lilac Bakery**, 59 Cowick Street, St Thomas, Exeter.
Plain HTML/CSS/JS + one Vercel serverless function. No build step.

```
lilac-bakery/
├─ index.html         # the page (all sections + SEO + schema)
├─ styles.css         # design system (lilac / cream / charcoal, Fraunces + Jost)
├─ script.js          # Fresh Today board, order form, nav, Instagram
├─ api/
│  └─ order.js        # serverless function — emails pre-orders to the bakery
├─ assets/
│  ├─ logo.svg        # the seated-figure brand mark (recreated)
│  └─ placeholder.svg # swap these for real photos
├─ vercel.json        # clean URLs, caching, security headers
├─ package.json
├─ robots.txt
├─ sitemap.xml
└─ .env.example       # env vars to add in Vercel
```

---

## 1. Deploy to Vercel (≈2 min)

1. Push this folder to a GitHub repo (or drag it into the Vercel dashboard).
2. In Vercel: **New Project → Import** the repo.
3. Framework preset: **Other**. No build command needed. Click **Deploy**.

That's it — the static page and the `/api/order` function deploy together automatically.

To test locally: `npm i -g vercel` then `vercel dev`.

---

## 2. Turn on order emails (Resend)

The form posts to `/api/order`. Until you add a key it still "works" (and logs to
Vercel's function logs), but to actually receive emails:

1. Sign up at **resend.com** (free tier is plenty), verify your domain.
2. Create an API key.
3. In Vercel → **Project → Settings → Environment Variables**, add:

   | Name | Value |
   |------|-------|
   | `RESEND_API_KEY` | your `re_…` key |
   | `ORDER_EMAIL` | where orders should land, e.g. `hello@lilacbakery.co.uk` |
   | `FROM_EMAIL` | a verified sender, e.g. `Lilac Bakery <orders@lilacbakery.co.uk>` |

4. Redeploy. Orders now arrive by email; replies go straight to the customer.

> Prefer something other than Resend? The only thing to change is the `fetch(...)`
> block in `api/order.js`.

---

## 3. The "Fresh Today" board — owners update it from a Google Sheet

No code, no redeploy after first setup.

1. Make a Google Sheet with a tab named **`FreshToday`**.
2. Row 1 = headers. Then one bake per row:

   | Item | Note | Status |
   |------|------|--------|
   | Old Granary Sourdough | £4.50 | |
   | Cardamom Buns | | low |
   | Kouign-Amann | | sold out |

   - **Note** is optional (price, flavour…).
   - **Status**: leave blank, or type `low` / `selling fast`, or `sold out`.
3. **Share → General access → Anyone with the link → Viewer.**
4. Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/`**`THIS_ID`**`/edit`
5. Open `script.js`, paste it into `var SHEET_ID = "…";`, redeploy **once**.

From then on, the bakers just edit the sheet and refresh the site. If the sheet is
ever empty or offline, a sensible fallback list shows automatically.

---

## 4. Instagram feed (Behold)

A styled fallback grid shows by default. To switch on the live, auto-updating feed:

1. Go to **behold.so**, connect `@lilacbakery.exeter`, create a widget (free tier).
2. Copy your **widget ID**.
3. In `index.html`, paste it into `data-behold-id=""` on the `#beholdFeed` div.

The script loads Behold automatically and hides the fallback. (LightWidget works the
same way if you prefer — just drop its embed into the same div.)

---

## 5. Add the real photos

Every `<img>` currently points to `assets/placeholder.svg` and carries a
`data-photo="…"` hint (e.g. `croissant`, `storefront`, `sourdough`). Replace each
`src` with your real images (square ~600×600 for the menu grid, ~600×700 for the
story photo). Keep them optimised — WebP/JPG, ~150–250 KB each — to stay fast.

Also add `assets/og-image.jpg` (1200×630) for nice link previews on social.

---

## 6. Before go-live — quick checklist

- [ ] Replace `https://www.lilacbakery.co.uk/` with the real domain in:
      `index.html` (canonical, OG, schema), `robots.txt`, `sitemap.xml`.
- [ ] Add a real phone number / contact email if you want them shown.
- [ ] Confirm opening hours in `index.html` (visible table **and** the JSON-LD schema).
      Current: Mon–Fri 8–3, Sat 9–2, Sun 9:30–1.
- [ ] Double-check the map address pin.
- [ ] Drop in real photography + `og-image.jpg`.
- [ ] Set the Resend env vars and send yourself a test order.

---

## Notes on SEO

- Title, meta description and copy target *artisan bakery Exeter*, *bakery St Thomas
  Exeter*, *sourdough Cowick Street*.
- `schema.org` **Bakery / LocalBusiness** JSON-LD with address, geo, opening hours and
  Instagram is in `<head>` — validate at [search.google.com/test/rich-results](https://search.google.com/test/rich-results).
- After launch, add the site to **Google Search Console** and submit `sitemap.xml`,
  and claim/refresh the **Google Business Profile** for the St Thomas location.

— Built for Charged Studio.
