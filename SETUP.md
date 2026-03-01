# AlgoMatch — Complete Setup & Deployment Guide
## $0/month to run. Built with Supabase + FastAPI + React + Vercel + Render.

---

## PROJECT STRUCTURE

```
dsa-buddy/
├── frontend/          ← React + Vite app (deploy to Vercel)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   ├── lib/supabase.js
│   │   └── pages/
│   │       ├── Landing.jsx
│   │       ├── Auth.jsx
│   │       ├── ProfileSetup.jsx
│   │       ├── Questionnaire.jsx
│   │       ├── Matches.jsx
│   │       └── Profile.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example    ← copy to .env.local
├── backend/           ← FastAPI (deploy to Render)
│   ├── main.py
│   ├── matching.py
│   ├── requirements.txt
│   └── .env.example    ← copy to .env
└── supabase_schema.sql ← run once in Supabase SQL Editor
```

---

## STEP 1 — SUPABASE SETUP (10 min)

1. Go to https://supabase.com → New project (free)
2. Name it `algomatch`, pick any region, set a password
3. Wait ~2 min for project to spin up
4. Go to **SQL Editor** → paste contents of `supabase_schema.sql` → Run
5. Go to **Authentication** → Email → Enable "Magic Link" (disable password login)
6. Go to **Project Settings** → API:
   - Copy `Project URL` → this is your `SUPABASE_URL`
   - Copy `anon / public` key → `SUPABASE_ANON_KEY`
   - Copy `service_role` key → `SUPABASE_SERVICE_KEY` (keep secret!)

---

## STEP 2 — BACKEND SETUP & DEPLOY TO RENDER (15 min)

### Local test first:
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in .env with your Supabase keys

uvicorn main:app --reload       # runs on http://localhost:8000
# Test: open http://localhost:8000 → should return {"status":"ok"}
```

### Deploy to Render (free):
1. Push code to GitHub (create repo, push dsa-buddy folder)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root directory**: `backend`
   - **Runtime**: Python 3
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   SUPABASE_URL         = https://xxxx.supabase.co
   SUPABASE_ANON_KEY    = eyJ...
   SUPABASE_SERVICE_KEY = eyJ...
   ```
6. Deploy → copy the URL e.g. `https://algomatch-api.onrender.com`

> ⚠️ Render free tier sleeps after 15 min inactivity. First request after sleep takes ~10s.
> This is fine for MVP. Upgrade to $7/mo Render starter to keep it awake when you have users.

---

## STEP 3 — FRONTEND SETUP & DEPLOY TO VERCEL (10 min)

### Local test:
```bash
cd frontend
npm install

cp .env.example .env.local
# Fill in:
# VITE_SUPABASE_URL = https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY = eyJ...
# VITE_API_URL = http://localhost:8000   (local) or your Render URL

npm run dev    # opens http://localhost:5173
```

### Deploy to Vercel (free):
1. Go to https://vercel.com → New Project
2. Import GitHub repo → set **Root Directory** to `frontend`
3. Add Environment Variables:
   ```
   VITE_SUPABASE_URL      = https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   VITE_API_URL           = https://algomatch-api.onrender.com
   ```
4. Deploy → your app is live at `https://algomatch.vercel.app`

---

## STEP 4 — CONNECT SUPABASE AUTH REDIRECT

1. In Supabase → Authentication → URL Configuration
2. Set **Site URL**: `https://algomatch.vercel.app`
3. Add to **Redirect URLs**: `https://algomatch.vercel.app/*`

This ensures magic link emails redirect back to your app.

---

## FULL USER FLOW RECAP

```
Landing page
  ↓ "Find My Match"
Auth (enter email → magic link sent)
  ↓ click link in email
Profile Setup
  → username, display name, bio
  → LeetCode URL (validated live against API)
  → Discord / Telegram contact (hidden until match)
  ↓
Questionnaire (8 steps)
  → Platform, Level, Difficulty, Language
  → Practice Style, Goal
  → Favourite Topics (multi-select chips)
  → Timezone + Time + Duration + Days
    (all converted to UTC minutes on save)
  ↓
Matches Page
  → Top 3 cards (dating-app style)
  → Score %, shared topics, practice overlap time shown
  → "💜 Interested" button
  → If other person also clicks → MATCH!
  → Contact card revealed (Discord/Telegram)
  → Users connect off-platform
```

---

## HOW TIMEZONE MATCHING WORKS

```
User A: India (IST, UTC+5:30) — sets 9:00 PM
  → saved as utc_start_min = 930 (15:30 UTC), utc_end_min = 990 (16:30)

User B: USA EST (UTC-5) — sets 11:00 AM  
  → saved as utc_start_min = 960 (16:00 UTC), utc_end_min = 1020 (17:00)

Overlap: 960–990 = 30 minutes ✅ → MATCH

User C: USA PST (UTC-8) — sets 9:00 PM
  → saved as utc_start_min = 300 (05:00 UTC), utc_end_min = 360

Overlap with User A: none ❌ → NOT MATCHED
```

No timezone buckets, no approximations — pure UTC math.

---

## COST BREAKDOWN

| Service     | Free tier limit       | Monthly cost |
|-------------|----------------------|-------------|
| Supabase    | 500MB DB, 50k MAU    | $0          |
| Render      | 750 hrs/month        | $0          |
| Vercel      | 100GB bandwidth      | $0          |
| **Total**   |                      | **$0**      |

Scale costs (when you have real users):
| Users    | Action needed           | Cost     |
|----------|------------------------|----------|
| 0–1,000  | Nothing                | $0       |
| 1,000–5k | Render starter (no sleep) | $7/mo |
| 5k–10k   | Supabase Pro           | $25/mo   |
| 10k+     | Supabase Pro + Render  | $35/mo   |

---

## MONETIZATION PLAN (add later)

Phase 1 (0-500 users): FREE — validate the product
Phase 2 (500+ users): Add Stripe

| Feature                          | Model    | Price    |
|----------------------------------|----------|----------|
| See 3 matches                    | Free     | $0       |
| See 10 matches                   | Pro      | $4.99/mo |
| Skip mutual-accept (instant contact) | Pro  | $4.99/mo |
| Priority placement in results    | Pro      | $4.99/mo |
| Re-run matching (fresh results)  | Free 1/week, Pro unlimited | — |

Easiest Stripe integration: add `is_pro boolean` to users table,
use Stripe Checkout for one-time payment or subscription.

---

## COMMON ISSUES

**Magic link not working locally**
→ Change Supabase Site URL to `http://localhost:5173` during dev, change back before deploying.

**CORS error from backend**
→ The backend allows all origins (`*`). If you want to restrict: replace `"*"` with your Vercel URL.

**Render backend sleeping**
→ Normal on free tier. Add a cron job to ping `/` every 14 min to keep it awake, or upgrade to $7/mo.

**LeetCode validation fails**
→ The external API (leetcode-stats-api.herokuapp.com) may be down. The code falls back to accepting the URL anyway. You can add your own validator if needed.

**Supabase RLS blocking backend**
→ The backend uses the `service_role` key which bypasses RLS. Never expose this key on the frontend.
