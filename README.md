# 🧠 LeetBuddy

> Find your perfect DSA practice partner — matched by skill level, topics, coding language, and real timezone overlap.

![LeetBuddy](https://img.shields.io/badge/LeetBuddy-DSA%20Matching-7c6aff?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![Supabase](https://img.shields.io/badge/Supabase-Free-3ECF8E?style=flat-square&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Free-000000?style=flat-square&logo=vercel)

---

## What is LeetBuddy?

LeetBuddy helps developers find compatible DSA practice partners. Instead of posting in random Discord servers, LeetBuddy matches you based on:

- **Skill level** — Beginner, Intermediate, Advanced, Expert
- **Preferred topics** — Trees, Graphs, DP, and 13 more
- **Coding language** — Python, Java, C++, JavaScript, Go
- **Practice style** — Pair programming, mock interviews, compete, etc.
- **Real timezone overlap** — Converts all schedules to UTC and finds actual overlapping time windows

No more matching with someone 12 hours away who's never free at the same time as you.

---

## Live Demo

🌐 **[leetbuddy.vercel.app](https://algomatch-six.vercel.app)**

---

## Features

- ✅ Magic link login — no passwords
- ✅ Profile with LeetCode URL validation
- ✅ 8-step questionnaire with dropdowns
- ✅ Smart UTC-based timezone matching
- ✅ Dating-app style match cards with compatibility score
- ✅ Mutual interest system — contact only revealed on both sides accepting
- ✅ Discord / Telegram contact reveal on match
- ✅ Fully responsive dark UI

---

## Tech Stack

| Layer | Technology | Cost |
|---|---|---|
| Frontend | React + Vite | Free |
| Backend | FastAPI (Python) | Free |
| Database + Auth | Supabase (PostgreSQL) | Free |
| Frontend Hosting | Vercel | Free |
| Backend Hosting | Render | Free |
| **Total** | | **$0/month** |

---

## How Timezone Matching Works

Every user enters their local practice time + timezone. The backend converts it to UTC minutes once on save, then matches by actual UTC overlap — not timezone buckets.

```
User A: India (IST, UTC+5:30) — 9:00 PM
→ saved as utc_start_min = 930 (15:30 UTC)

User B: USA EST (UTC-5) — 11:00 AM
→ saved as utc_start_min = 960 (16:00 UTC)

Overlap: 30 minutes ✅ → MATCH
```

---

## Project Structure

```
LeetBuddy/
├── frontend/                  # React + Vite app
│   ├── src/
│   │   ├── App.jsx            # Routing + auth state
│   │   ├── index.css          # Design system
│   │   ├── lib/supabase.js    # Supabase client
│   │   └── pages/
│   │       ├── Landing.jsx    # Landing page
│   │       ├── Auth.jsx       # Magic link login
│   │       ├── ProfileSetup.jsx
│   │       ├── Questionnaire.jsx
│   │       ├── Matches.jsx    # Match cards
│   │       └── Profile.jsx
│   ├── index.html
│   ├── package.json
│   └── vercel.json
├── backend/                   # FastAPI
│   ├── main.py                # API endpoints
│   ├── matching.py            # Matching engine
│   ├── requirements.txt
│   └── .env.example
└── supabase_schema.sql        # DB schema + RLS policies
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A free Supabase account

### 1. Clone the repo
```bash
git clone https://github.com/shreyasmunge/LeetBuddy.git
cd LeetBuddy
```

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase_schema.sql`
3. Go to **Project Settings** → **API** → copy your keys

### 3. Run the backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in your Supabase keys in .env

uvicorn main:app --reload
# Running at http://localhost:8000
```

### 4. Run the frontend
```bash
cd frontend
npm install

cp .env.example .env.local
# Fill in:
# VITE_SUPABASE_URL=https://xxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJ...
# VITE_API_URL=http://localhost:8000

npm run dev
# Running at http://localhost:5173
```

---

## Deployment

| Service | Platform | Config |
|---|---|---|
| Frontend | Vercel | Root dir: `frontend`, auto-deploys on push |
| Backend | Render | Root dir: `backend`, start: `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Database | Supabase | Run `supabase_schema.sql` once |

See `SETUP.md` for full step-by-step deployment instructions.

---

## Matching Algorithm

```python
final_score = (
    0.30 * level_similarity     +
    0.20 * difficulty_match     +
    0.20 * topic_overlap        +
    0.20 * utc_schedule_overlap +  # real UTC math, no buckets
    0.10 * practice_style
)
```

Hard filters applied before scoring:
- Same coding language (unless either selects "any")
- Same platform (unless either selects "both")
- At least 30 minutes UTC schedule overlap

---

## Database Schema

```
users           → profile, contact info, avatar
questionnaire   → answers + UTC schedule (utc_start_min, utc_end_min)
interests       → from_user_id, to_user_id, status (pending/accepted)
```

Full schema with RLS policies in `supabase_schema.sql`.

---

## Roadmap

- [ ] Email notifications on match
- [ ] Re-run matching (refresh results weekly)
- [ ] Pro tier — see 10 matches instead of 3
- [ ] Group matching (3-person study groups)
- [ ] Mock interview scheduling

---

## Contributing

Pull requests welcome. For major changes please open an issue first.

---

## License

MIT
