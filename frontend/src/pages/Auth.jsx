import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Auth({ onBack }) {
  const [email, setEmail] = useState("")
  const [sent, setSent]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")

  async function handleSend(e) {
    e.preventDefault()
    setLoading(true); setError("")
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="page" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
      background: "radial-gradient(ellipse at 30% 20%, rgba(124,106,255,0.08) 0%, transparent 60%), var(--bg)"
    }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>

        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ marginBottom: "32px" }}>
          ← Back
        </button>

        <div className="card fade-up" style={{ padding: "36px" }}>
          {!sent ? (
            <>
              <h2 style={{ marginBottom: "8px" }}>Welcome back</h2>
              <p style={{ color: "var(--muted)", marginBottom: "28px", fontSize: "0.95rem" }}>
                Enter your email — we'll send a magic link. No password needed.
              </p>

              <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                {error && <p style={{ color: "#ff4c6a", fontSize: "0.85rem" }}>{error}</p>}
                <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send Magic Link ✦"}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "16px" }}>✉️</div>
              <h2 style={{ marginBottom: "8px" }}>Check your inbox</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                We sent a magic link to <strong style={{ color: "var(--text)" }}>{email}</strong>.
                Click it to sign in — no password required.
              </p>
              <button className="btn btn-ghost btn-sm" onClick={() => setSent(false)}
                style={{ marginTop: "24px" }}>
                Try a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
