# Single's Hangout 2026 - Registration Portal

Free, age-gated (23+) registration portal for **Single's Hangout 2026** -
The Church of Pentecost, Foso Town District, Habitat Assembly, Youth Ministry.

Registrants fill in a short form, receive their registration code by SMS
(Moolre), and show a QR ticket at the door.

## Event

| | |
| --- | --- |
| Date | Saturday, 26 September 2026 |
| Time | 4:30 PM |
| Venue | Before Ring, Pizzaman, Foso |
| Entry | Free, strictly 23+ |

Event details live in one place: [`src/lib/event.ts`](src/lib/event.ts).
Change them there and every page, SMS, ticket and calendar invite follows.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** with a red / white / black theme
- **Prisma 7** + **Neon Postgres** (driver adapter, `@prisma/adapter-pg`)
- **Moolre** SMS Open API
- **zod** validation, `qrcode` for tickets, `html5-qrcode` for door scanning
- Deployed on **Vercel**

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create a database

Create a free project at [neon.tech](https://neon.tech), then copy the two
connection strings it gives you (pooled and direct).

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** connection string (used at runtime) |
| `DIRECT_URL` | Neon **direct** connection string (used by migrations) |
| `MOOLRE_API_KEY` | Moolre VAS key from [app.moolre.com](https://app.moolre.com) |
| `MOOLRE_SENDER_ID` | Approved Sender ID, max 11 characters |
| `ADMIN_PASSWORD` | Password for the admin dashboard |
| `ADMIN_SESSION_SECRET` | Long random string used to sign the admin cookie |
| `SITE_URL` | Public base URL, e.g. `https://www.register.kamartec.org` |
| `SMS_DRY_RUN` | `true` logs SMS to the console instead of sending |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> Leave `MOOLRE_API_KEY` empty or set `SMS_DRY_RUN=true` while developing:
> registration still works and the SMS text is printed to the server console.

### 4. Set up the schema

```bash
npm run db:deploy   # apply migrations
npm run db:seed     # writes the default capacity (150) and opens registration
```

To change the initial cap, set `INITIAL_CAPACITY=200` before seeding.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run db:migrate` | Create + apply a migration in development |
| `npm run db:deploy` | Apply committed migrations (production) |
| `npm run db:seed` | Seed capacity / registration-open settings |
| `npm run db:studio` | Browse data in Prisma Studio |
| `npm run assets` | Regenerate flyer images from the print original |

## Routes

| Route | Description |
| --- | --- |
| `/` | Landing page: flyer, details, spots-left counter |
| `/register` | Registration form |
| `/ticket/[code]` | QR ticket, add-to-calendar, share |
| `/find` | Recover a ticket by code or phone number |
| `/admin` | Dashboard: stats, registrations, resend SMS, CSV export |
| `/admin/checkin` | Door check-in with camera scanner |
| `/admin/settings` | Change capacity, open/close registration |
| `/api/og` | Dynamic social preview image (WhatsApp) |
| `/api/ics` | Calendar invite |

## How registration behaves

- **Age gate.** Under-23s are rejected on the client *and* again on the
  server. The limit is `EVENT.minAge`.
- **One registration per phone number.** Re-submitting an existing number
  does not create a second record; the original code is re-sent instead.
- **Capacity.** Registration closes automatically at the cap. The count is
  re-checked inside the database transaction so the cap is never exceeded.
- **SMS failures never block registration.** If Moolre is unreachable the
  record is saved and flagged `FAILED`; an admin can resend it later.
- **Phone numbers** are normalised to `233XXXXXXXXX` for Moolre and stored
  in that canonical form, so `024…`, `+233…` and `233…` all match.
- **Codes** use an alphabet without `0/O` or `1/I/L` so they are easy to
  read aloud (`SH26-XXXXX`).

## SMS

Sent from the server only, via [`src/lib/moolre.ts`](src/lib/moolre.ts):

```
POST https://api.moolre.com/open/sms/send
X-API-VASKEY: <MOOLRE_API_KEY>
{ "type": 1, "senderid": "<MOOLRE_SENDER_ID>", "messages": [ ... ] }
```

The message is kept within a single 160-character SMS segment. The ticket
link is only appended when the whole message still fits.

## Flyer assets

The print flyer is 12000 x 14999 (about 5 MB) and must never be served to a
browser. `npm run assets` generates the web versions into `public/`:

- `flyer.jpg` - 1200px desktop hero
- `flyer-sm.jpg` - 720px mobile hero
- `og-fallback.jpg` - 1200 x 630 social preview fallback

Run it with an explicit source path if the original is elsewhere:

```bash
node scripts/optimize-assets.mjs "C:\path\to\flyer.jpg"
```

## Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel.
2. Add every variable from `.env.example` in **Project Settings → Environment
   Variables**. `SITE_URL` must be the final public URL, because QR codes and
   OG images are built from it.
3. `postinstall` runs `prisma generate` automatically. Apply migrations once
   against Neon:
   ```bash
   npm run db:deploy
   npm run db:seed
   ```
4. In your DNS provider, point the flyer's address at Vercel:
   - `www.register.kamartec.org` → `CNAME` → `cname.vercel-dns.com`
   - add `www.register.kamartec.org` as a domain on the Vercel project
   (use `register.kamartec.org` with an `A`/`ALIAS` record instead if you drop
   the `www`).
5. Verify `https://<your-domain>/api/og` returns an image and that the
   WhatsApp link preview looks right.

> Camera check-in requires HTTPS. It works on the Vercel deployment but not
> over plain `http://` on a LAN IP.

## Admin

Sign in at `/admin/login` with `ADMIN_PASSWORD`. The session is an
HMAC-signed, httpOnly cookie valid for 12 hours; `/admin/*` and
`/api/admin/*` are both protected (the page routes by `src/proxy.ts`, the
API route by an explicit cookie check).

Use `/admin/settings` to change the cap or pause registration at any time
without a redeploy.

## Security notes

- Ticket pages and the admin area send `noindex, nofollow`.
- CSV exports escape leading `=`, `+`, `-` and `@` to prevent spreadsheet
  formula injection.
- The admin password comparison and cookie signature check are
  constant-time.
- Keep `.env.local` out of version control (it is gitignored).
