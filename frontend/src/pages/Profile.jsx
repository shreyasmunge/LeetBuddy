import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Profile({ user, profile, onBack }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState({ ...profile })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]     = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    setLoading(true)
    await supabase.from("users").update({
      display_name: form.display_name,
      bio: form.bio,
      contact_discord: form.contact_discord,
      contact_telegram: form.contact_telegram,
    }).eq("id", user.id)
    setLoading(false)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <div className="page" style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 0%, rgba(124,106,255,0.08) 0%, transparent 50%), var(--bg)"
    }}>
      <nav className="nav">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← Matches</button>
        <span className="nav-logo">AlgoMatch</span>
        <button className="btn btn-ghost btn-sm" onClick={handleSignOut}
          style={{ color: "var(--muted)" }}>Sign out</button>
      </nav>

      <div className="container" style={{ paddingTop: "40px", paddingBottom: "60px" }}>
        {/* Profile hero */}
        <div className="card fade-up" style={{
          textAlign: "center", padding: "36px",
          background: "linear-gradient(135deg, rgba(124,106,255,0.08), rgba(255,106,176,0.06))",
          border: "1px solid rgba(124,106,255,0.2)",
          marginBottom: "20px"
        }}>
          <div style={{ fontSize: "4rem", marginBottom: "12px" }}>
            {profile?.avatar_emoji}
          </div>
          <h2 style={{ marginBottom: "4px" }}>{profile?.display_name || profile?.username}</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "12px" }}>
            @{profile?.username}
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: "300px", margin: "0 auto 16px" }}>
            {profile?.bio || "No bio yet."}
          </p>
          {profile?.leetcode_url && (
            <a href={profile.leetcode_url} target="_blank" rel="noreferrer"
              className="badge badge-purple" style={{ textDecoration: "none" }}>
              LeetCode ↗
            </a>
          )}
        </div>

        {/* Contact info */}
        <div className="card fade-up delay-1" style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase",
            letterSpacing: "0.06em", marginBottom: "16px" }}>
            Contact (shown only to mutual matches)
          </p>
          {profile?.contact_discord && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "10px" }}>
              <span>💬</span>
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Discord:</span>
              <span style={{ fontWeight: 500 }}>{profile.contact_discord}</span>
            </div>
          )}
          {profile?.contact_telegram && (
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <span>✈️</span>
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>Telegram:</span>
              <span style={{ fontWeight: 500 }}>{profile.contact_telegram}</span>
            </div>
          )}
          {!profile?.contact_discord && !profile?.contact_telegram && (
            <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
              No contact info added. Edit profile to add Discord or Telegram.
            </p>
          )}
        </div>

        {/* Edit section */}
        {!editing ? (
          <button className="btn btn-outline btn-full fade-up delay-2" onClick={() => setEditing(true)}>
            Edit Profile
          </button>
        ) : (
          <div className="card fade-up" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3>Edit Profile</h3>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={form.display_name || ""}
                onChange={e => set("display_name", e.target.value)} maxLength={40} />
            </div>
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" rows={3}
                value={form.bio || ""}
                onChange={e => set("bio", e.target.value)}
                maxLength={150} style={{ resize: "none" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Discord Username</label>
              <input className="form-input" value={form.contact_discord || ""}
                onChange={e => set("contact_discord", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Telegram Handle</label>
              <input className="form-input" value={form.contact_telegram || ""}
                onChange={e => set("contact_telegram", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}
                style={{ flex: 1 }}>
                {loading ? "Saving…" : "Save Changes"}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {saved && <div className="toast">✓ Profile updated!</div>}
      </div>
    </div>
  )
}
