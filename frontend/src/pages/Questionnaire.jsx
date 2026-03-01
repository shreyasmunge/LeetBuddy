import { useState } from "react"
import { supabase } from "../lib/supabase"

const TIMEZONES = [
  { label: "IST — India (UTC+5:30)",                value: "Asia/Kolkata",                 offset: 330  },
  { label: "PKT — Pakistan (UTC+5:00)",             value: "Asia/Karachi",                 offset: 300  },
  { label: "NPT — Nepal (UTC+5:45)",                value: "Asia/Kathmandu",               offset: 345  },
  { label: "BST — Bangladesh (UTC+6:00)",           value: "Asia/Dhaka",                   offset: 360  },
  { label: "EST — New York / Toronto (UTC-5)",      value: "America/New_York",             offset: -300 },
  { label: "CST — Chicago (UTC-6)",                 value: "America/Chicago",              offset: -360 },
  { label: "MST — Denver (UTC-7)",                  value: "America/Denver",               offset: -420 },
  { label: "PST — Los Angeles (UTC-8)",             value: "America/Los_Angeles",          offset: -480 },
  { label: "GMT — London (UTC+0)",                  value: "Europe/London",                offset: 0    },
  { label: "CET — Berlin / Paris (UTC+1)",          value: "Europe/Berlin",                offset: 60   },
  { label: "EET — Cairo / Athens (UTC+2)",          value: "Europe/Athens",                offset: 120  },
  { label: "MSK — Moscow (UTC+3)",                  value: "Europe/Moscow",                offset: 180  },
  { label: "GST — Dubai (UTC+4)",                   value: "Asia/Dubai",                   offset: 240  },
  { label: "ICT — Bangkok (UTC+7)",                 value: "Asia/Bangkok",                 offset: 420  },
  { label: "SGT — Singapore / KL (UTC+8)",          value: "Asia/Singapore",               offset: 480  },
  { label: "CST — China (UTC+8)",                   value: "Asia/Shanghai",                offset: 480  },
  { label: "JST — Japan / Korea (UTC+9)",           value: "Asia/Tokyo",                   offset: 540  },
  { label: "AEST — Sydney (UTC+10)",                value: "Australia/Sydney",             offset: 600  },
  { label: "NZST — New Zealand (UTC+12)",           value: "Pacific/Auckland",             offset: 720  },
  { label: "BRT — Brazil (UTC-3)",                  value: "America/Sao_Paulo",            offset: -180 },
]

const HOURS   = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"))
const MINUTES = ["00", "30"]
const DAYS    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

const QUESTIONS = [
  {
    key: "platform",
    label: "Which platform do you primarily use?",
    icon: "💻",
    options: [
      { value: "leetcode",   label: "LeetCode" },
      { value: "codeforces", label: "Codeforces" },
      { value: "both",       label: "Both" },
    ]
  },
  {
    key: "level",
    label: "What's your current DSA level?",
    icon: "📊",
    options: [
      { value: "beginner",     label: "Beginner — Just starting out" },
      { value: "intermediate", label: "Intermediate — Solving Mediums" },
      { value: "advanced",     label: "Advanced — Crushing Hards" },
      { value: "expert",       label: "Expert — Competitive Programmer" },
    ]
  },
  {
    key: "difficulty",
    label: "Preferred problem difficulty",
    icon: "🎯",
    options: [
      { value: "easy",       label: "Easy — Building foundations" },
      { value: "easy_med",   label: "Easy + Medium mix" },
      { value: "medium",     label: "Medium — My sweet spot" },
      { value: "med_hard",   label: "Medium + Hard mix" },
      { value: "hard",       label: "Hard — No mercy" },
    ]
  },
  {
    key: "language",
    label: "Preferred coding language",
    icon: "🔤",
    options: [
      { value: "python",     label: "Python 🐍" },
      { value: "java",       label: "Java ☕" },
      { value: "cpp",        label: "C++ ⚡" },
      { value: "javascript", label: "JavaScript 🌐" },
      { value: "golang",     label: "Go 🐹" },
      { value: "any",        label: "Language agnostic 🤝" },
    ]
  },
  {
    key: "practice_style",
    label: "How do you like to practice together?",
    icon: "🤝",
    options: [
      { value: "solve_discuss", label: "Solve individually, then discuss" },
      { value: "live_pair",     label: "Live pair programming" },
      { value: "compete",       label: "Compete — see who solves faster" },
      { value: "teach",         label: "Teach each other concepts" },
      { value: "mock",          label: "Mock interview style" },
    ]
  },
  {
    key: "goal",
    label: "Your primary goal",
    icon: "🏆",
    options: [
      { value: "faang",      label: "FAANG / Big Tech interviews" },
      { value: "startup",    label: "Startup / general SWE roles" },
      { value: "competitive", label: "Competitive programming" },
      { value: "learning",   label: "Pure learning & improvement" },
    ]
  },
]

const TOPICS = [
  "Arrays", "Strings", "Linked Lists", "Trees", "Graphs",
  "Dynamic Programming", "Recursion", "Backtracking", "Binary Search",
  "Sorting", "Heaps / Priority Queue", "Stack & Queue",
  "Hash Maps", "Two Pointers", "Sliding Window", "Math / Bit Manipulation"
]

function toUTCMinutes(hour12, minute, ampm, offsetMin) {
  let h24 = ampm === "PM" ? (parseInt(hour12) === 12 ? 12 : parseInt(hour12) + 12)
                           : (parseInt(hour12) === 12 ? 0  : parseInt(hour12))
  const localMinutes = h24 * 60 + parseInt(minute)
  return ((localMinutes - offsetMin) % 1440 + 1440) % 1440 // wrap around midnight
}

export default function Questionnaire({ user, onDone }) {
  const [step, setStep]       = useState(0) // 0 = questions (Q), TOTAL_Q = topics, TOTAL_Q+1 = schedule
  const [answers, setAnswers] = useState({})
  const [topics, setTopics]   = useState([])
  const [tz, setTz]           = useState("")
  const [tzSearch, setTzSearch] = useState("")
  const [hour, setHour]       = useState("09")
  const [minute, setMinute]   = useState("00")
  const [ampm, setAmpm]       = useState("PM")
  const [duration, setDuration] = useState(60)
  const [days, setDays]       = useState([])
  const [loading, setLoading] = useState(false)

  const TOTAL_Q = QUESTIONS.length
  const totalSteps = TOTAL_Q + 2 // questions + topics + schedule
  const progress = ((step) / totalSteps) * 100

  const filteredTZ = TIMEZONES.filter(t =>
    t.label.toLowerCase().includes(tzSearch.toLowerCase())
  )

  const selectedTZ = TIMEZONES.find(t => t.value === tz)

  function utcPreview() {
    if (!selectedTZ) return "—"
    const utcMin = toUTCMinutes(hour, minute, ampm, selectedTZ.offset)
    const h = Math.floor(utcMin / 60).toString().padStart(2,"0")
    const m = (utcMin % 60).toString().padStart(2,"0")
    return `${h}:${m} UTC`
  }

  async function handleFinish() {
    if (!tz) return alert("Please select your timezone")
    if (days.length === 0) return alert("Please select at least one practice day")
    setLoading(true)

    const selectedTZObj = TIMEZONES.find(t => t.value === tz)
    const h24 = ampm === "PM" ? (parseInt(hour) === 12 ? 12 : parseInt(hour) + 12)
                               : (parseInt(hour) === 12 ? 0  : parseInt(hour))
    const utcStart = toUTCMinutes(hour, minute, ampm, selectedTZObj.offset)
    const utcEnd   = (utcStart + duration) % 1440

    await supabase.from("questionnaire").insert({
      user_id: user.id,
      platform:        answers.platform,
      level:           answers.level,
      difficulty:      answers.difficulty,
      language:        answers.language,
      practice_style:  answers.practice_style,
      goal:            answers.goal,
      topics:          topics,
      timezone:        tz,
      local_hour:      h24,
      local_minute:    parseInt(minute),
      utc_start_min:   utcStart,
      utc_end_min:     utcEnd,
      duration_minutes: duration,
      practice_days:   days,
    })

    await supabase.from("users").update({ questionnaire_done: true }).eq("id", user.id)
    setLoading(false)
    onDone()
  }

  // ─── Step: Question ───
  if (step < TOTAL_Q) {
    const q = QUESTIONS[step]
    return (
      <div className="page" style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, rgba(124,106,255,0.07) 0%, transparent 50%), var(--bg)"
      }}>
        <nav className="nav">
          <span className="nav-logo">AlgoMatch</span>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            {step + 1} / {totalSteps}
          </span>
        </nav>

        <div className="container" style={{ paddingTop: "48px" }}>
          <div className="progress-bar" style={{ marginBottom: "48px" }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="fade-up">
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{q.icon}</div>
            <h2 style={{ marginBottom: "32px", lineHeight: 1.3 }}>{q.label}</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {q.options.map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { setAnswers(a => ({ ...a, [q.key]: opt.value })); setStep(s => s + 1) }}
                  style={{
                    background: answers[q.key] === opt.value
                      ? "linear-gradient(135deg, rgba(124,106,255,0.2), rgba(255,106,176,0.15))"
                      : "var(--card)",
                    border: answers[q.key] === opt.value
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                    borderRadius: "12px", padding: "16px 20px",
                    color: "var(--text)", textAlign: "left",
                    cursor: "pointer", transition: "all 0.2s",
                    fontSize: "0.95rem", fontFamily: "'DM Sans', sans-serif"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
                  onMouseLeave={e => {
                    if (answers[q.key] !== opt.value)
                      e.currentTarget.style.borderColor = "var(--border)"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {step > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}
              style={{ marginTop: "32px" }}>
              ← Back
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── Step: Topics ───
  if (step === TOTAL_Q) {
    return (
      <div className="page" style={{
        minHeight: "100vh",
        background: "var(--bg)"
      }}>
        <nav className="nav">
          <span className="nav-logo">AlgoMatch</span>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{step + 1} / {totalSteps}</span>
        </nav>
        <div className="container" style={{ paddingTop: "48px" }}>
          <div className="progress-bar" style={{ marginBottom: "48px" }}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="fade-up">
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>📚</div>
            <h2 style={{ marginBottom: "8px" }}>Favourite topics</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "28px" }}>
              Select all that apply. We match by topic overlap.
            </p>

            <div className="chips" style={{ marginBottom: "32px" }}>
              {TOPICS.map(t => (
                <button key={t} type="button"
                  className={`chip ${topics.includes(t) ? "active" : ""}`}
                  onClick={() => setTopics(prev =>
                    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                  )}>
                  {t}
                </button>
              ))}
            </div>

            <button className="btn btn-primary btn-full"
              onClick={() => setStep(s => s + 1)}
              disabled={topics.length === 0}>
              Continue → ({topics.length} selected)
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}
              style={{ marginTop: "12px", width: "100%" }}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Step: Schedule ───
  return (
    <div className="page" style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 80% 100%, rgba(255,106,176,0.07) 0%, transparent 50%), var(--bg)"
    }}>
      <nav className="nav">
        <span className="nav-logo">AlgoMatch</span>
        <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{step + 1} / {totalSteps}</span>
      </nav>
      <div className="container" style={{ paddingTop: "48px", paddingBottom: "60px" }}>
        <div className="progress-bar" style={{ marginBottom: "48px" }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="fade-up">
          <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>🌍</div>
          <h2 style={{ marginBottom: "8px" }}>Your practice schedule</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "32px" }}>
            We convert everything to UTC to find real-time overlaps across timezones.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Timezone search */}
            <div className="form-group">
              <label className="form-label">Your Timezone *</label>
              <input className="form-input" placeholder="Type to search e.g. india, london, new york…"
                value={tzSearch}
                onChange={e => setTzSearch(e.target.value)} />
              <select className="form-select" size={4} value={tz}
                onChange={e => setTz(e.target.value)}>
                <option value="" disabled>— select timezone —</option>
                {filteredTZ.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {tz && <span style={{ color: "var(--green)", fontSize: "0.82rem" }}>
                ✓ {selectedTZ?.label}
              </span>}
            </div>

            {/* Time picker */}
            <div className="form-group">
              <label className="form-label">Practice time (your local time) *</label>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <select className="form-select" value={hour} onChange={e => setHour(e.target.value)}
                  style={{ width: "80px" }}>
                  {HOURS.map(h => <option key={h}>{h}</option>)}
                </select>
                <span style={{ color: "var(--muted)", fontSize: "1.2rem", fontWeight: 700 }}>:</span>
                <select className="form-select" value={minute} onChange={e => setMinute(e.target.value)}
                  style={{ width: "80px" }}>
                  {MINUTES.map(m => <option key={m}>{m}</option>)}
                </select>
                <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: "10px", overflow: "hidden" }}>
                  {["AM","PM"].map(p => (
                    <button key={p} type="button" onClick={() => setAmpm(p)}
                      style={{
                        padding: "11px 18px",
                        background: ampm === p ? "linear-gradient(135deg, var(--accent), var(--accent2))" : "var(--bg3)",
                        color: ampm === p ? "white" : "var(--muted)",
                        border: "none", cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <span style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
                🌐 UTC equivalent: <strong style={{ color: "var(--accent)" }}>{utcPreview()}</strong>
              </span>
            </div>

            {/* Duration */}
            <div className="form-group">
              <label className="form-label">Session length</label>
              <div className="chips">
                {[{l:"30m",v:30},{l:"1h",v:60},{l:"1.5h",v:90},{l:"2h+",v:120}].map(d => (
                  <button key={d.v} type="button"
                    className={`chip ${duration === d.v ? "active" : ""}`}
                    onClick={() => setDuration(d.v)}>{d.l}</button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="form-group">
              <label className="form-label">Practice days *</label>
              <div className="chips">
                {DAYS.map(d => (
                  <button key={d} type="button"
                    className={`chip ${days.includes(d) ? "active" : ""}`}
                    onClick={() => setDays(prev =>
                      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
                    )}>{d}</button>
                ))}
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-full"
            onClick={handleFinish} disabled={loading}
            style={{ marginTop: "32px", padding: "16px" }}>
            {loading ? "Saving…" : "Find My Matches ✦"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setStep(s => s - 1)}
            style={{ marginTop: "12px", width: "100%" }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
