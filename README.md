# Tokenized Incentive System for Public Transport

Web2 + Web3-inspired integration: Supabase (auth/db) + cryptographic hash-chain ledger (tamper-evident, no wallet needed)

## How the "blockchain" works

Instead of a real chain, each reward entry is SHA-256 hashed with the previous entry's hash — forming a tamper-evident chain stored in Supabase. Any modification to a past record breaks all subsequent hashes, making it auditable and immutable in practice.

```
entry_hash = SHA256(userId | distance | tokens | timestamp | prev_hash)
```

No wallet. No gas. No MetaMask. Same tamper-evidence story.

## Setup

### 1. Supabase

1. Create a project at https://supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Deploy the Edge Function:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy log-trip

# Set secrets (only two needed now)
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in Supabase URL and anon key
npm run dev
```

Deploy to Vercel: connect your repo and set the same env vars in the Vercel dashboard.

## Architecture

```
User (browser)
  └─> React frontend (Vercel)
        └─> Supabase Auth (login/signup)
        └─> Supabase Edge Function (log-trip)
              └─> trips table (trip records)
              └─> profiles table (token balance)
              └─> reward_ledger table (hash-chain, append-only)
```

## Token Calculation

`tokens = distance_km × 10`

No wallet required. The hash-chain ledger provides tamper-evidence without any blockchain infrastructure.
