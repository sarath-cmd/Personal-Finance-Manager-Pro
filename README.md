# Personal Finance Manager Pro

A full multi-user personal finance tracker — accounts, transactions, budgets,
bills, savings goals, debt payoff, a calendar, and a "Lent & Borrowed" tab —
built with Next.js (App Router), MongoDB, and NextAuth.js.

## Features (this build)

- Email/password auth (NextAuth v5, bcrypt-hashed passwords, JWT sessions) — every
  user only ever sees their own data.
- Accounts (checking, savings, cash, credit card, investment, retirement) with a
  balance that's automatically kept in sync as you add/edit/delete transactions.
- Transactions ledger: add, **edit**, and delete, with filtered Income and
  Expenses views, category breakdowns, and color-coded tags.
- Month navigation that always defaults to the real current month and
  automatically advances when the calendar rolls over — nothing from past months
  is ever deleted; you can always navigate back to view or add to old months.
- Cash Flow page with a 6-month income vs. expense chart.
- Lent & Borrowed: track people you've lent money to, log "lent"/"returned"
  entries over time, and see each person's running balance and monthly history.
- Today: what's happening today — transactions, bills/tasks due, and a 14-day
  upcoming timeline.
- Calendar: a month grid of bills, subscriptions, debt due-dates and events.
- Financial Snapshot: a read-only monthly summary plus a short reflection note.
- Tags and Budget Categories: manage the color palette and category lists used
  throughout the app.
- Monthly Budget: set a budget per category and track spend-vs-budget progress.
- Bills: recurring bills and subscriptions, with a "Mark Paid" action that
  creates the linked expense transaction (and updates the account balance if
  paid from one).
- Savings Goals: regular goals, sinking funds, and an emergency fund, each with
  a progress bar and a contribution log.
- Debt Payoff: track balances, interest and payments toward paying off debt.
- Settings: update your display name and change your password.

## 1. Local setup

```bash
npm install
cp .env.example .env.local   # if you don't already have one
```

Fill in `.env.local`:

| Variable | What it is |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string (see below) |
| `NEXTAUTH_SECRET` | A random secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` locally; your Vercel URL in production |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional — see "Rate limiting" below |

Then:

```bash
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/register` on first visit.

## 2. Setting up MongoDB Atlas (free tier)

1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Create a new **Project**, then click **Build a Database** → choose the **M0 Free** tier → pick any cloud region close to you → **Create**.
3. **Database Access** (left sidebar) → **Add New Database User**. Create a username/password user with "Read and write to any database" scoped to this project (don't reuse your Atlas account password). Save the password somewhere safe.
4. **Network Access** (left sidebar) → **Add IP Address**. For a quick start, choose **Allow Access From Anywhere** (`0.0.0.0/0`) — Vercel's serverless functions use dynamic IPs, so this is the simplest option; Atlas still requires the correct username/password to connect, so this does not expose your data.
5. Go back to **Database** → **Connect** on your cluster → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
6. Paste it into `MONGODB_URI` in `.env.local`, filling in your username/password, and add a database name before the `?`, e.g. `.../personal_finance?retryWrites=true...`.

Multi-document transactions (used for keeping account balances in sync when you
add/edit/delete a transaction) work out of the box on Atlas M0 — it's a replica
set by default.

## 3. Deploying to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. On [vercel.com](https://vercel.com), **Add New Project** → import the repo.
3. In the project's **Settings → Environment Variables**, add `MONGODB_URI`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` (set this to your Vercel production URL, e.g. `https://your-app.vercel.app`) for the **Production** environment — and again for **Preview** if you want preview deployments to work.
4. Deploy.

I won't create the Atlas cluster, the Vercel project, or run a deploy on your
behalf — those need your own accounts/credentials. Ask me if you'd like help
troubleshooting a specific step once you're in there.

## 4. Rate limiting (optional but recommended)

Login and registration are rate-limited to slow down brute-force/credential-
stuffing attempts. By default (no Upstash env vars set) this uses a small
TTL-indexed collection in your own MongoDB — zero extra setup, slightly higher
latency. For better performance and correctness across Vercel's distributed
serverless instances, create a free Redis database at
[upstash.com](https://upstash.com), copy its REST URL/token into
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, and the app will use it
automatically.

## Security notes

- Passwords are hashed with bcrypt (cost factor 12) — never stored in plaintext,
  never included in the session token.
- Every API route resolves the current user from the verified session (never
  from client-supplied input) and scopes every database query by that user's id,
  so one user can never read or modify another user's data.
- All inputs (API bodies and query params) are validated with Zod before
  touching the database.
- Security headers (CSP, HSTS, X-Frame-Options, etc.) are set in
  `next.config.ts`.
- `.env.local` is git-ignored; only `.env.example` (with no real secrets) is
  committed.

## Scope

Every page group from the original mockup is covered. A few pages that were
near-duplicates in the mockup (Calendar / Bill Calendar / Budget Calendar, and
Bills / Recurring Bills / Subscriptions, and Savings Goals / Sinking Funds /
Emergency Fund) were consolidated into one page each with in-page filters,
rather than built as separate nav items — same functionality, fewer redundant
screens. The mockup's multi-currency setting is not implemented; the app is
fixed to ₹ (INR).
