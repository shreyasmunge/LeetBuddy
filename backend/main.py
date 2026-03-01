from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client, Client
from matching import compute_matches

app = FastAPI(title="AlgoMatch API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async def get_current_user(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = authorization.split(" ")[1]
    client = create_client(SUPABASE_URL, os.environ["SUPABASE_ANON_KEY"])
    try:
        user = client.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/matches")
async def get_matches(user_id: str = Depends(get_current_user)):
    db = get_supabase()
    me_q = db.table("questionnaire").select("*").eq("user_id", user_id).single().execute()
    if not me_q.data:
        raise HTTPException(400, "Complete your questionnaire first")

    connected_res = db.table("interests").select("to_user_id, from_user_id").or_(
        f"from_user_id.eq.{user_id},to_user_id.eq.{user_id}"
    ).eq("status", "accepted").execute()
    connected_ids = set()
    for row in (connected_res.data or []):
        connected_ids.add(row["from_user_id"])
        connected_ids.add(row["to_user_id"])
    connected_ids.discard(user_id)

    all_q = db.table("questionnaire").select("*, users(*)").neq("user_id", user_id).execute()

    scored = []
    for q in (all_q.data or []):
        if q["user_id"] in connected_ids:
            continue
        score, shared_topics, overlap_time = compute_matches(me_q.data, q)
        if score > 0:
            user_data = q.get("users", {}) or {}
            scored.append({
                "id":            q["user_id"],
                "username":      user_data.get("username"),
                "display_name":  user_data.get("display_name"),
                "bio":           user_data.get("bio"),
                "avatar_emoji":  user_data.get("avatar_emoji"),
                "leetcode_url":  user_data.get("leetcode_url"),
                "level":         q["level"],
                "language":      q["language"],
                "difficulty":    q["difficulty"],
                "practice_style": q["practice_style"],
                "goal":          q["goal"],
                "score":         score,
                "shared_topics": shared_topics,
                "overlap_time":  overlap_time,
            })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return {"matches": scored[:3]}


class InterestRequest(BaseModel):
    to_user_id: str

@app.post("/interest")
async def send_interest(body: InterestRequest, user_id: str = Depends(get_current_user)):
    db = get_supabase()
    existing = db.table("interests").select("*")\
        .eq("from_user_id", body.to_user_id)\
        .eq("to_user_id", user_id).execute()

    if existing.data:
        db.table("interests").update({"status": "accepted"})\
            .eq("from_user_id", body.to_user_id)\
            .eq("to_user_id", user_id).execute()
        their_profile = db.table("users").select("*")\
            .eq("id", body.to_user_id).single().execute()
        return {"matched": True, "contact": their_profile.data}

    db.table("interests").insert({
        "from_user_id": user_id,
        "to_user_id":   body.to_user_id,
        "status":       "pending",
    }).execute()
    return {"matched": False}


@app.get("/interests/incoming")
async def get_incoming(user_id: str = Depends(get_current_user)):
    db = get_supabase()
    res = db.table("interests").select("from_user_id, users!interests_from_user_id_fkey(*)")\
        .eq("to_user_id", user_id).eq("status", "pending").execute()
    requests = []
    for row in (res.data or []):
        requests.append({"from_user": row.get("users", {})})
    return {"requests": requests}


class RespondRequest(BaseModel):
    from_user_id: str
    accept: bool

@app.post("/interest/respond")
async def respond_interest(body: RespondRequest, user_id: str = Depends(get_current_user)):
    db = get_supabase()
    if body.accept:
        db.table("interests").update({"status": "accepted"})\
            .eq("from_user_id", body.from_user_id)\
            .eq("to_user_id", user_id).execute()
        db.table("interests").insert({
            "from_user_id": user_id,
            "to_user_id":   body.from_user_id,
            "status":       "accepted"
        }).execute()
        contact = db.table("users").select("*")\
            .eq("id", body.from_user_id).single().execute()
        return {"accepted": True, "contact": contact.data}
    else:
        db.table("interests").delete()\
            .eq("from_user_id", body.from_user_id)\
            .eq("to_user_id", user_id).execute()
        return {"accepted": False}

@app.get("/")
def health():
    return {"status": "ok", "service": "AlgoMatch API"}
