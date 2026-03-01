import { useState, useEffect } from "react"
import { supabase } from "./lib/supabase"
import Landing from "./pages/Landing"
import Auth from "./pages/Auth"
import ProfileSetup from "./pages/ProfileSetup"
import Questionnaire from "./pages/Questionnaire"
import Matches from "./pages/Matches"
import Profile from "./pages/Profile"

export default function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState("landing")

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkProfile(session.user.id)
      else setLoading(false)
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) checkProfile(session.user.id)
      else { setLoading(false); setPage("landing") }
    })
  }, [])

  async function checkProfile(userId) {
    const { data } = await supabase.from("users").select("*").eq("id", userId).single()
    setProfile(data)
    setLoading(false)
    if (!data) setPage("profile-setup")
    else if (!data.questionnaire_done) setPage("questionnaire")
    else setPage("matches")
  }

  if (loading) return (
    <div className="loading-screen">
      <div className="loader-ring" />
    </div>
  )

  if (!session) {
    if (page === "landing") return <Landing onStart={() => setPage("auth")} />
    if (page === "auth") return <Auth onBack={() => setPage("landing")} />
  }

  if (page === "profile-setup") return (
    <ProfileSetup user={session.user} onDone={(p) => { setProfile(p); setPage("questionnaire") }} />
  )
  if (page === "questionnaire") return (
    <Questionnaire user={session.user} onDone={() => setPage("matches")} />
  )
  if (page === "matches") return (
    <Matches user={session.user} profile={profile} onProfile={() => setPage("my-profile")} />
  )
  if (page === "my-profile") return (
    <Profile user={session.user} profile={profile} onBack={() => setPage("matches")} />
  )
}
