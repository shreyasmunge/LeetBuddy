import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

const API = import.meta.env.VITE_API_URL

export default function Matches({ user, profile, onProfile }) {
  const [matches, setMatches]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [selected, setSelected]     = useState(null)   // expanded card
  const [connected, setConnected]   = useState(null)   // connection modal
  const [interests, setInterests]   = useState({})     // user_id -> status
  const [toast, setToast]           = useState("")

  useEffect(() => { fetchMatches() }, [])

  async function fetchMatches() {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${API}/matches`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      setMatches(data.matches || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function sendInterest(toUserId) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${API}/interest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ to_user_id: toUserId })
    })
    const data = await res.json()
    setInterests(prev => ({ ...prev, [toUserId]: "sent" }))
    if (data.matched) {
      setConnected(matches.find(m => m.id === toUserId))
    } else {
      showToast("💜 Interest sent! We'll notify you if they match back.")
    }
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(""), 3500)
  }

  function scoreColor(s) {
    if (s >= 85) return "var(--green)"
    if (s >= 70) return "var(--accent)"
    return "var(--gold)"
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="loader-ring" />
    </div>
  )

  return (
    <div className="page" style={{ background: "var(--bg)", minHeight: "100vh" }}>

      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo">AlgoMatch</span>
        <button className="btn btn-ghost btn-sm" onClick={onProfile}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="avatar" style={{ width: "30px", height: "30px", fontSize: "0.9rem" }}>
            {profile?.avatar_emoji || "👤"}
          </div>
          {profile?.username}
        </button>
      </nav>

      <div className="container-wide" style={{ paddingTop: "40px" }}>

        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h2 className="fade-up" style={{ marginBottom: "6px" }}>
            Your top matches ✦
          </h2>
          <p className="fade-up delay-1" style={{ color: "var(--muted)", fontSize: "0.95rem" }}>
            Matched by skill level, topics, and overlapping practice schedule.
            {matches.length === 0 && " We're still finding your matches — check back soon!"}
          </p>
        </div>

        {/* Cards grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px"
        }}>
          {matches.map((m, i) => (
            <MatchCard
              key={m.id}
              match={m}
              index={i}
              interestStatus={interests[m.id]}
              onInterest={() => sendInterest(m.id)}
              onExpand={() => setSelected(selected?.id === m.id ? null : m)}
              scoreColor={scoreColor}
            />
          ))}
        </div>

        {/* Requests section */}
        <PendingRequests user={user} onConnect={setConnected} />

      </div>

      {/* Expanded card modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <ExpandedMatch
              match={selected}
              interestStatus={interests[selected.id]}
              onInterest={() => { sendInterest(selected.id); setSelected(null) }}
              onClose={() => setSelected(null)}
              scoreColor={scoreColor}
            />
          </div>
        </div>
      )}

      {/* Connected modal */}
      {connected && (
        <div className="modal-overlay">
          <div className="modal" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ marginBottom: "8px" }}>It's a Match!</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
              You and <strong style={{ color: "var(--text)" }}>{connected.display_name || connected.username}</strong> both want to practice together!
            </p>

            <div className="card" style={{ textAlign: "left", marginBottom: "20px" }}>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Contact Details
              </p>
              {connected.contact_discord && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span>💬</span>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Discord</div>
                    <div style={{ fontWeight: 600 }}>{connected.contact_discord}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }}
                    onClick={() => navigator.clipboard.writeText(connected.contact_discord).then(() => showToast("Copied!"))}>
                    Copy
                  </button>
                </div>
              )}
              {connected.contact_telegram && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>✈️</span>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Telegram</div>
                    <div style={{ fontWeight: 600 }}>{connected.contact_telegram}</div>
                  </div>
                  <button className="btn btn-outline btn-sm" style={{ marginLeft: "auto" }}
                    onClick={() => navigator.clipboard.writeText(connected.contact_telegram).then(() => showToast("Copied!"))}>
                    Copy
                  </button>
                </div>
              )}
            </div>

            <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "20px" }}>
              🕐 Best practice time: <strong style={{ color: "var(--accent)" }}>{connected.overlap_time || "overlapping window"}</strong>
            </p>

            <button className="btn btn-primary btn-full" onClick={() => setConnected(null)}>
              Awesome! 🚀
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function MatchCard({ match, index, interestStatus, onInterest, onExpand, scoreColor }) {
  return (
    <div className="match-card fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Card header with avatar */}
      <div className="match-card-header" onClick={onExpand}>
        <div className="match-avatar-bg">
          <span style={{ opacity: 0.15 }}>{match.avatar_emoji}</span>
        </div>
        <div className="match-card-gradient" />

        {/* Score ring */}
        <div className="match-score-ring" style={{ borderColor: scoreColor(match.score) }}>
          <span style={{ color: scoreColor(match.score), fontSize: "0.85rem", fontWeight: 800 }}>
            {match.score}%
          </span>
        </div>

        {/* Name */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "2rem" }}>{match.avatar_emoji}</span>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700 }}>
                {match.display_name || match.username}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.78rem" }}>
                @{match.username}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="match-card-body">
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "14px" }}>
          {match.bio || "No bio yet."}
        </p>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
          <span className="badge badge-purple">{match.level}</span>
          <span className="badge badge-pink">{match.language}</span>
          {match.goal && <span className="badge badge-gold">{match.goal}</span>}
        </div>

        {/* Schedule overlap */}
        {match.overlap_time && (
          <div style={{
            background: "rgba(124,106,255,0.08)", border: "1px solid rgba(124,106,255,0.15)",
            borderRadius: "8px", padding: "8px 12px", marginBottom: "16px",
            fontSize: "0.8rem", color: "var(--accent)"
          }}>
            🕐 Practice overlap: <strong>{match.overlap_time}</strong>
          </div>
        )}

        {/* Topic overlap */}
        {match.shared_topics?.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "6px" }}>
              Shared topics
            </div>
            <div className="chips">
              {match.shared_topics.slice(0, 3).map(t => (
                <span key={t} className="chip" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>{t}</span>
              ))}
              {match.shared_topics.length > 3 && (
                <span className="chip" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
                  +{match.shared_topics.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="interest-btn no" onClick={onExpand} title="View profile">
            👁️
          </button>
          <button
            className="interest-btn yes"
            onClick={onInterest}
            disabled={!!interestStatus}
            title={interestStatus ? "Interest sent" : "Send interest"}
            style={{ flex: 1, borderRadius: "10px", width: "auto",
              opacity: interestStatus ? 0.6 : 1
            }}
          >
            {interestStatus ? "💜 Sent" : "💜 Interested"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpandedMatch({ match, interestStatus, onInterest, onClose, scoreColor }) {
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3>Profile</h3>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
      </div>

      <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ fontSize: "3.5rem" }}>{match.avatar_emoji}</div>
        <div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 700 }}>
            {match.display_name || match.username}
          </div>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>@{match.username}</div>
          <a href={match.leetcode_url} target="_blank" rel="noreferrer"
            style={{ color: "var(--accent)", fontSize: "0.8rem", textDecoration: "none" }}>
            LeetCode profile ↗
          </a>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "center" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: scoreColor(match.score) }}>
            {match.score}%
          </div>
          <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>match</div>
        </div>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "16px" }}>
        {match.bio}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
        <span className="badge badge-purple">{match.level}</span>
        <span className="badge badge-pink">{match.language}</span>
        <span className="badge badge-gold">{match.difficulty}</span>
        <span className="badge badge-green">{match.practice_style}</span>
      </div>

      {match.shared_topics?.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Shared topics
          </div>
          <div className="chips">
            {match.shared_topics.map(t => (
              <span key={t} className="chip active" style={{ fontSize: "0.78rem", padding: "5px 12px" }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {match.overlap_time && (
        <div style={{
          background: "rgba(124,106,255,0.08)", border: "1px solid rgba(124,106,255,0.2)",
          borderRadius: "10px", padding: "12px 16px", marginBottom: "20px"
        }}>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "4px" }}>Practice overlap</div>
          <div style={{ color: "var(--accent)", fontWeight: 600 }}>🕐 {match.overlap_time}</div>
        </div>
      )}

      <button className="btn btn-primary btn-full"
        onClick={onInterest} disabled={!!interestStatus}>
        {interestStatus ? "💜 Interest sent!" : "💜 Send Interest"}
      </button>
    </>
  )
}

function PendingRequests({ user, onConnect }) {
  const [requests, setRequests] = useState([])
  const API = import.meta.env.VITE_API_URL

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${API}/interests/incoming`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    const data = await res.json()
    setRequests(data.requests || [])
  }

  async function respond(fromUserId, accept) {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${API}/interest/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ from_user_id: fromUserId, accept })
    })
    const data = await res.json()
    setRequests(prev => prev.filter(r => r.from_user.id !== fromUserId))
    if (accept && data.contact) onConnect(data.contact)
  }

  if (requests.length === 0) return null

  return (
    <div style={{ marginTop: "48px" }}>
      <h3 style={{ marginBottom: "16px" }}>
        Incoming Requests
        <span style={{ background: "var(--accent)", color: "white", borderRadius: "999px",
          padding: "2px 8px", fontSize: "0.75rem", marginLeft: "10px", fontFamily: "'DM Sans', sans-serif" }}>
          {requests.length}
        </span>
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {requests.map(r => (
          <div key={r.from_user.id} className="card"
            style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ fontSize: "1.8rem" }}>{r.from_user.avatar_emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{r.from_user.display_name || r.from_user.username}</div>
              <div style={{ color: "var(--muted)", fontSize: "0.82rem" }}>{r.from_user.bio?.slice(0, 60)}…</div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="interest-btn no" onClick={() => respond(r.from_user.id, false)}>✕</button>
              <button className="interest-btn yes" style={{ width: "48px", borderRadius: "50%" }}
                onClick={() => respond(r.from_user.id, true)}>💜</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
