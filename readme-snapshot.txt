# Single's Hangout 2026 - Registration Portal

Free, age-gated (22+) registration portal for **Single's Hangout 2026** -
The Church of Pentecost, Foso Town District, Habitat Assembly, Youth Ministry.

Registrants fill in a short form, receive their registration code by SMS
(Moolre), and show a QR ticket at the door.

## Event

| | |
| --- | --- |
| Date | Saturday, 26 September 2026 |
| Time | 4:00 PM |
| Theme | Before the Ring |
| Venue | Pizzaman Chickenman, Asin Foso |
| Entry | Free, strictly 22+ |
| Dress code | Strictly formal (enforced at the door) |
| Capacity | 30 (editable from the admin dashboard) |

## Registration flow

The form is step-based. Later steps depend on earlier answers:

1. **Personal info** - name, location, phone, age, gender, panel question.
2. **Your part** - "Are you facilitating this event?"
   - **Yes** → skips straight to submit. Recorded as `Organizer`.
   - **No** → continues to step 3.
3. **Where you fellowship** - Habitat Assembly / another COP assembly /
   doesn't attend COP.
   - **Habitat** or **another COP assembly** → continues to step 4.
   - **Doesn't attend COP** → skips step 4, recorded as `Participant`.
4. **Your role** - Organizer / Protocol Member / Participant.

The server re-runs the same branching in `registrationSchema`, so a tampered
form cannot skip a required answer. See `src/lib/registration-options.ts` for
the option lists and the two `resolve*` helpers that map a person's answers
onto the stored `affiliation` and `role`.

Event details live in one place: [`src/lib/event.ts`](src/lib/event.ts).
Change them there and every page, SMS, ticket and calendar invite follows.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** with a red / white / black theme
- **Prisma 7** + **Supabase Postgres** (driver adapter, `@prisma/adapter-pg`)
- **Moolre** SMS Open API
- **zod** validation, `qrcode` for tickets, `html5-qrcode` for door scanning
- Deployed on **Vercel**

## Getting started

### 1. Install

```bash
npm install
```

### 2. Create a database

Create a project at [supabase.com](https://supabase.com), then open
**Connect** (top of the dashboard) and pick the **ORMs → Prisma** tab. Copy
both strings it shows. Two details matter:

- Use the **Transaction pooler** string (port **6543**) for `DATABASE_URL`.
  It must keep the `?pgbouncer=true` suffix — Supavisor in transaction mode
  does not support the prepared statements Prisma uses by default.
- The username is `postgres.<project-ref>`, **not** plain `postgres`.
- If your password contains `@`, `#`, `%` or similar, percent-encode it
  (`@` becomes `%40`), otherwise the URL will not parse.

`DIRECT_URL` is the same credentials on port **5432**, used only by the
Prisma CLI for migrations.

> Within Vercel, prefer the pooler host (port 6543/5432) over
> `db.<ref>.supabase.co`, which is IPv6-only and unreachable from Vercel.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Supabase **pooled** string, transaction mode, port 6543 |
| `DIRECT_URL` | Supabase direct/session string, port 5432 (migrations) |
| `DATABASE_POOL_MAX` | Optional. Pool size per instance (default 5) |
| `DATABASE_SSL_NO_VERIFY` | Optional. Supabase is auto-detected, so normally leave unset |
| `DATABASE_SSL_CA` | Optional. Verify against Supabase's CA for full TLS verification |
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
npm run db:seed     # writes the default capacity (30) and opens registration
```

The event capacity is editable later from the admin dashboard, so you do not
need to re-seed to change it. To seed a different initial cap, set
`INITIAL_CAPACITY=30` before running the seed.

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

## Flyer and logo assets

The print flyer is 12000 x 14999 (about 5 MB) and must never be served to a
browser. `npm run assets` generates the web versions into `public/`:

- `flyer.jpg` - 1200px desktop hero
- `flyer-sm.jpg` - 720px mobile hero
- `og-fallback.jpg` - 1200 x 630 social preview fallback

It also prepares the church logo for the header, footer and OG card:

- `cop-habitat-assembly.png` - full colour, for light backgrounds
- `cop-habitat-assembly-white.png` - white, for the dark sections
- `src/app/icon.png` - favicon, generated from the logo

Run it with explicit source paths if the originals are elsewhere:

```bash
node scripts/optimize-assets.mjs "C:\path\to\flyer.jpg" "C:\path\to\logo.png"
```

## Deploying to Vercel

1. Push this folder to a Git repository and import it in Vercel.
2. Add every variable from `.env.example` in **Project Settings → Environment
   Variables**. `SITE_URL` must be the final public URL, because QR codes and
   OG images are built from it.
3. `postinstall` runs `prisma generate` automatically. Apply migrations once
   against Supabase — either locally against the Supabase `DIRECT_URL`, or by
   running these in a shell with the production env vars:
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

## Troubleshooting Supabase

| Symptom | Cause and fix |
| --- | --- |
| `prepared statement "s0" already exists` | Connecting on port 6543 without `?pgbouncer=true`. Add it to `DATABASE_URL`. |
| `Tenant or user not found` | Username must be `postgres.<project-ref>`, not `postgres`. |
| `password authentication failed` | Special characters in the password are not percent-encoded. |
| `Can't reach database server` from Vercel | You used `db.<ref>.supabase.co` (IPv6-only). Use the pooler host instead. |
| `Max client connections reached` | Lower `DATABASE_POOL_MAX` (try 1–3) or raise the pool size in Supabase → Database Settings. |
| `self-signed certificate in certificate chain` | Normally handled automatically for Supabase pooler hosts. If it still appears, set `DATABASE_SSL_NO_VERIFY=true`, or `DATABASE_SSL_CA` to verify properly. |
| Registration returns a 500 | Check the Vercel function logs. Usually a missing or malformed `DATABASE_URL`. |

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
