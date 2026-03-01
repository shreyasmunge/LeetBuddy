export default function Landing({ onStart }) {
  return (
    <div className="page" style={{ background: "var(--bg)", minHeight: "100vh", overflow: "hidden", position: "relative" }}>

      {/* Ambient background blobs */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,106,255,0.12) 0%, transparent 70%)",
          filter: "blur(40px)"
        }} />
        <div style={{
          position: "absolute", bottom: "-20%", right: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,106,176,0.1) 0%, transparent 70%)",
          filter: "blur(40px)"
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Nav */}
        <nav className="nav">
          <span className="nav-logo">AlgoMatch</span>
          <button className="btn btn-outline btn-sm" onClick={onStart}>Sign In</button>
        </nav>

        {/* Hero */}
        <div className="container" style={{ paddingTop: "80px", paddingBottom: "80px", textAlign: "center" }}>
          <div className="fade-up" style={{ marginBottom: "16px" }}>
            <span className="badge badge-purple" style={{ fontSize: "0.8rem" }}>
              ✦ Find Your DSA Partner
            </span>
          </div>

          <h1 className="fade-up delay-1" style={{ marginBottom: "24px" }}>
            Match with your<br />
            <span className="gradient-text">perfect coding</span><br />
            buddy
          </h1>

          <p className="fade-up delay-2" style={{
            color: "var(--muted)", fontSize: "1.1rem", lineHeight: 1.7,
            maxWidth: "360px", margin: "0 auto 40px"
          }}>
            Smart timezone-aware matching for DSA practice partners. No more solo grinding.
          </p>

          <button
            className="btn btn-primary btn-full fade-up delay-3"
            onClick={onStart}
            style={{ maxWidth: "280px", margin: "0 auto", fontSize: "1rem", padding: "16px 32px" }}
          >
            Find My Match ✦
          </button>

          {/* Stats row */}
          <div className="fade-up delay-3" style={{
            display: "flex", gap: "32px", justifyContent: "center",
            marginTop: "64px"
          }}>
            {[
              { n: "2,400+", l: "Active users" },
              { n: "87%", l: "Match success" },
              { n: "40+", l: "Countries" },
            ].map(s => (
              <div key={s.l} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", fontWeight: 900 }}>{s.n}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "2px" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Preview cards */}
          <div style={{ marginTop: "64px", display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { emoji: "🦊", name: "Arjun S.", level: "Advanced", score: "94%" },
              { emoji: "🐺", name: "Sofia K.", level: "Intermediate", score: "88%" },
              { emoji: "🦋", name: "James L.", level: "Advanced", score: "82%" },
            ].map((m, i) => (
              <div key={m.name} className="card fade-up"
                style={{
                  width: "140px", textAlign: "center", padding: "20px 12px",
                  animationDelay: `${0.4 + i * 0.1}s`,
                  transform: i === 1 ? "translateY(-12px)" : "none"
                }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{m.emoji}</div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{m.name}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.75rem", marginBottom: "8px" }}>{m.level}</div>
                <span className="badge badge-purple" style={{ fontSize: "0.7rem" }}>{m.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
