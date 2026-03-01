import { useState } from "react"
import { supabase } from "../lib/supabase"

const EMOJIS = ["🦊","🐺","🦋","🐉","🦁","🐯","🦄","🐻","🦝","🐸","🦅","🐙"]

export default function ProfileSetup({ user, onDone }) {
  const [form, setForm] = useState({
    username: "", display_name: "", bio: "",
    leetcode_url: "", contact_discord: "",
    contact_telegram: "", avatar_emoji: "🦊"
  })
  const [lcStatus, setLcStatus] = useState("idle") // idle | checking | valid | invalid
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function validateLeetCode(url) {
    const match = url.match(/leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)\/?$/)
    if (!match) { setLcStatus("invalid"); return }
    setLcStatus("checking")
    const username = match[1]
    try {
      const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${username}`)
      const data = await res.json()
      if (data.status === "success") setLcStatus("valid")
      else setLcStatus("invalid")
    } catch {
      setLcStatus("valid") // API down — accept anyway
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.username.trim()) return setError("Username is required")
    if (lcStatus === "invalid") return setError("Please enter a valid LeetCode profile URL")
    setLoading(true); setError("")
    const { data, error: err } = await supabase.from("users").insert({
      id: user.id,
      email: user.email,
      username: form.username.trim(),
      display_name: form.display_name.trim() || form.username.trim(),
      bio: form.bio.trim(),
      leetcode_url: form.leetcode_url.trim(),
      contact_discord: form.contact_discord.trim(),
      contact_telegram: form.contact_telegram.trim(),
      avatar_emoji: form.avatar_emoji,
      questionnaire_done: false
    }).select().single()
    setLoading(false)
    if (err) setError(err.message)
    else onDone(data)
  }

  const lcBorder = lcStatus === "valid" ? "var(--green)" : lcStatus === "invalid" ? "#ff4c6a" : "var(--border)"

  return (
    <div className="page" style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 70% 0%, rgba(255,106,176,0.07) 0%, transparent 50%), var(--bg)"
    }}>
      <nav className="nav">
        <span className="nav-logo">AlgoMatch</span>
        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Step 1 of 2</span>
      </nav>

      <div className="container" style={{ paddingTop: "40px", paddingBottom: "60px" }}>
        <h2 className="fade-up" style={{ marginBottom: "6px" }}>Build your profile</h2>
        <p className="fade-up delay-1" style={{ color: "var(--muted)", marginBottom: "32px", fontSize: "0.95rem" }}>
          This is how other coders will see you.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Avatar picker */}
          <div className="form-group fade-up delay-1">
            <label className="form-label">Pick your avatar</label>
            <div className="chips">
              {EMOJIS.map(em => (
                <button key={em} type="button"
                  className={`chip ${form.avatar_emoji === em ? "active" : ""}`}
                  style={{ fontSize: "1.4rem", padding: "8px 12px" }}
                  onClick={() => set("avatar_emoji", em)}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className="form-group fade-up delay-1">
            <label className="form-label">Username *</label>
            <input className="form-input" placeholder="e.g. arjun_codes"
              value={form.username}
              onChange={e => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              maxLength={30} required />
            <span style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
              Lowercase, numbers, underscores only
            </span>
          </div>

          {/* Display name */}
          <div className="form-group fade-up delay-1">
            <label className="form-label">Display Name</label>
            <input className="form-input" placeholder="e.g. Arjun Sharma"
              value={form.display_name}
              onChange={e => set("display_name", e.target.value)}
              maxLength={40} />
          </div>

          {/* Bio */}
          <div className="form-group fade-up delay-2">
            <label className="form-label">Short Bio</label>
            <textarea className="form-textarea" rows={3}
              placeholder="e.g. SWE at Google intern, grinding Blind 75. Love graphs and DP."
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
              maxLength={150}
              style={{ resize: "none" }} />
            <span style={{ color: "var(--muted)", fontSize: "0.78rem", textAlign: "right" }}>
              {form.bio.length}/150
            </span>
          </div>

          {/* LeetCode URL */}
          <div className="form-group fade-up delay-2">
            <label className="form-label">LeetCode Profile URL *</label>
            <div style={{ position: "relative" }}>
              <input className="form-input"
                placeholder="https://leetcode.com/u/yourusername"
                value={form.leetcode_url}
                style={{ borderColor: lcBorder, paddingRight: "40px" }}
                onChange={e => { set("leetcode_url", e.target.value); setLcStatus("idle") }}
                onBlur={() => form.leetcode_url && validateLeetCode(form.leetcode_url)}
              />
              <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "1rem" }}>
                {lcStatus === "checking" && "⏳"}
                {lcStatus === "valid"    && "✅"}
                {lcStatus === "invalid"  && "❌"}
              </span>
            </div>
            {lcStatus === "invalid" && (
              <span style={{ color: "#ff4c6a", fontSize: "0.8rem" }}>
                Couldn't find that LeetCode profile. Format: leetcode.com/u/username
              </span>
            )}
            {lcStatus === "valid" && (
              <span style={{ color: "var(--green)", fontSize: "0.8rem" }}>✓ Profile verified!</span>
            )}
          </div>

          <hr className="divider" />

          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            Contact details are only shown to mutual matches.
          </p>

          {/* Discord */}
          <div className="form-group fade-up delay-3">
            <label className="form-label">Discord Username</label>
            <input className="form-input" placeholder="e.g. arjun#1234 or arjun_dev"
              value={form.contact_discord}
              onChange={e => set("contact_discord", e.target.value)} />
          </div>

          {/* Telegram */}
          <div className="form-group fade-up delay-3">
            <label className="form-label">Telegram Handle</label>
            <input className="form-input" placeholder="e.g. @arjundev"
              value={form.contact_telegram}
              onChange={e => set("contact_telegram", e.target.value)} />
          </div>

          {error && (
            <div style={{ background: "rgba(255,76,106,0.1)", border: "1px solid rgba(255,76,106,0.3)",
              borderRadius: "10px", padding: "12px 16px", color: "#ff4c6a", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-full" type="submit" disabled={loading}
            style={{ marginTop: "8px", padding: "16px" }}>
            {loading ? "Saving…" : "Continue to Questionnaire →"}
          </button>
        </form>
      </div>
    </div>
  )
}
