# Aether Drive — Car Rental Template

Next.js 16 car rental template with **shadcn/ui**, **Supabase**, **GSAP**, and **PayMongo** (PHP).

## Stack

- Next.js App Router + Tailwind v4 + shadcn (radix-nova)
- Supabase Auth + Postgres + RLS
- PayMongo Checkout Session V2 (webhooks)
- GSAP via `@gsap/react`

## Setup

```bash
bun install
cp .env.example .env.local
bun run dev
```

### Supabase local (recommended first)

Ports are **offset** (`55321+`) so this stack can run next to another project on the default `54321` ports.

```bash
# Requires Docker Desktop
supabase start
supabase status -o env   # copy ANON_KEY / SERVICE_ROLE_KEY / API_URL

# After changing migrations/seed:
supabase db reset --local
```

`.env.local` for local (example values from `supabase status -o env`):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY jwt>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY jwt>
```

| Service | URL |
|---------|-----|
| API | http://127.0.0.1:55321 |
| Studio | http://127.0.0.1:55323 |
| Mailpit | http://127.0.0.1:55324 |
| DB | postgresql://postgres:postgres@127.0.0.1:55322/postgres |

Migrations live in `supabase/migrations/` (includes grants for `anon` / `authenticated`). Seed: `supabase/seed.sql` (10 cars, 3 PH locations).

Promote an admin after signup:

```sql
update public.profiles set role = 'admin' where id = '<your-user-uuid>';
```

### Supabase cloud

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations `20240101000001` … `09` then `seed.sql` (or `supabase db push`)
3. Copy URL + anon key into `.env.local`


### PayMongo

1. [Dashboard](https://dashboard.paymongo.com) → API keys (`sk_test_…`)
2. Create webhook → `https://your-domain/api/webhooks/paymongo`
   - Event: `checkout_session.payment.paid`
3. Set `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`
4. Local webhooks: tunnel (e.g. cloudflared) to your machine

### Demo mode

Without Supabase keys the site still renders the fleet from `lib/data/demo.ts`. Bookings/auth need a live project.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |

## Implementation plan

See [docs/FULL-PLAN.md](docs/FULL-PLAN.md) for the full phased plan.
