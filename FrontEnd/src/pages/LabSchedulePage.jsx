import { useEffect, useState } from 'react'
import StudentSidebar from '../components/StudentSidebar'
import { apiRequest } from '../api/client'

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

function sessionView(session) {
  return {
    ...session,
    id: session._id,
    subject: session.module,
    code: session.module,
    lecturer: session.lecturer?.name || 'LabTrack lecturer',
    room: session.room,
    time: `${session.startTime} - ${session.endTime}`,
    instructions: session.instructions,
    equipment: session.instructions || 'No additional materials listed.',
    safety: session.safetyNotes,
    day: session.date.slice(-2),
    month: new Intl.DateTimeFormat('en', { month: 'short' }).format(new Date(`${session.date}T00:00:00`)).toUpperCase(),
    tone: 'green',
  }
}

function LabSchedulePage() {
  const [sessions, setSessions] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCurrent = true
    apiRequest('/lab-sessions')
      .then(({ sessions: result }) => {
        if (!isCurrent) return
        const nextSessions = result.map(sessionView)
        setSessions(nextSessions)
        setSelectedId(nextSessions[0]?.id || null)
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError.message)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })
    return () => { isCurrent = false }
  }, [])

  const selectedSession = sessions.find((session) => session.id === selectedId) || sessions[0]

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main schedule-main">
        <header className="student-header schedule-header">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Lab Schedule</h1>
            <p className="student-header-copy">View your upcoming physical laboratory sessions.</p>
          </div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content schedule-content">
          {error && <p className="error-banner" role="alert">{error}</p>}
          {isLoading ? <p className="loading-state">Loading lab sessions...</p> : !selectedSession ? <p className="empty-state">No lab sessions are scheduled yet.</p> : (
            <>
              <section className="next-lab-card">
                <div><p className="eyebrow">Next lab</p><h2>{selectedSession.subject}</h2><p>{formatDate(selectedSession.date)} · {selectedSession.time}</p></div>
                <div className="next-lab-location"><span className="card-icon green-icon">◷</span><span>{selectedSession.room}</span></div>
              </section>

              <div className="schedule-toolbar">
                <div><p className="eyebrow">Teaching calendar</p><h2>Scheduled sessions</h2></div>
              </div>

              <div className="schedule-layout">
                <section className="schedule-list" aria-label="Lab sessions">
                  {sessions.length === 0 ? <p className="empty-state">No lab sessions are scheduled yet.</p> : sessions.map((session) => (
                    <button className={`schedule-session ${selectedSession.id === session.id ? 'selected' : ''}`} type="button" key={session.id} onClick={() => setSelectedId(session.id)}>
                      <span className={`session-date ${session.tone}`}><strong>{session.day}</strong><small>{session.month}</small></span>
                      <span className="session-info"><strong>{session.subject}</strong><small>{session.module} · {session.time}</small><small>{session.room}</small></span>
                      <span className={`session-status ${session.status.toLowerCase()}`}>{session.status}</span>
                    </button>
                  ))}
                </section>

                <aside className="lab-details-card">
                  <div className="details-heading"><div><p className="eyebrow">Selected session</p><h2>Lab Details</h2></div><span className={`session-status ${selectedSession.status.toLowerCase()}`}>{selectedSession.status}</span></div>
                  <h3>{selectedSession.title}</h3>
                  <p className="details-meta">{formatDate(selectedSession.date)} · {selectedSession.time}<br />{selectedSession.room}<br />Lecturer: {selectedSession.lecturer}</p>
                  <div className="detail-block"><h4>Session instructions</h4><p>{selectedSession.instructions || 'No additional instructions listed.'}</p></div>
                  <div className="detail-block"><h4>Bring with you</h4><p>{selectedSession.equipment}</p></div>
                  <div className="detail-block safety-note"><h4>Safety note</h4><p>{selectedSession.safety || 'No additional safety notes listed.'}</p></div>
                </aside>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default LabSchedulePage
