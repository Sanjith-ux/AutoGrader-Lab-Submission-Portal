import { useState } from 'react'
import StudentSidebar from '../components/StudentSidebar'

const sessions = [
  { id: 1, subject: 'Human Computer Interaction', code: 'HCI 204', date: 'Tue, 01 Oct 2026', day: '01', month: 'OCT', time: '09:00 - 11:00', room: 'Lab 3A · Engineering Building', lecturer: 'Dr. Amina Malik', status: 'Upcoming', tone: 'green', instructions: 'Work in pairs to complete the usability observation exercise. Bring your completed participant profile and be ready to share your findings.', equipment: 'Laptop, notebook, participant profile worksheet', safety: 'Keep walkways clear and follow the lab supervisor’s guidance when moving between observation stations.' },
  { id: 2, subject: 'Database Systems', code: 'CSC 218', date: 'Mon, 07 Oct 2026', day: '07', month: 'OCT', time: '14:00 - 16:00', room: 'Lab 2B · Science Block', lecturer: 'Prof. Daniel Perera', status: 'Upcoming', tone: 'blue', instructions: 'Build and test the indexing examples from this week’s worksheet, then compare query performance using the provided dataset.', equipment: 'Laptop, database worksheet, USB drive', safety: 'Save your work regularly and use only the provided test database during the practical.' },
  { id: 3, subject: 'Network Design', code: 'NET 210', date: 'Thu, 10 Oct 2026', day: '10', month: 'OCT', time: '10:00 - 12:00', room: 'Network Lab · Technology Centre', lecturer: 'J. Roberts', status: 'Upcoming', tone: 'gold', instructions: 'Configure the sample network topology and document the addressing plan before the final walkthrough.', equipment: 'Laptop, network design worksheet', safety: 'Do not disconnect or rearrange physical equipment without asking the lab technician.' },
]

function LabSchedulePage() {
  const [selectedSession, setSelectedSession] = useState(sessions[0])

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
          <section className="next-lab-card">
            <div><p className="eyebrow">Next lab</p><h2>{selectedSession.subject}</h2><p>{selectedSession.date} · {selectedSession.time}</p></div>
            <div className="next-lab-location"><span className="card-icon green-icon">◷</span><span>{selectedSession.room}</span></div>
          </section>

          <div className="schedule-toolbar">
            <div><p className="eyebrow">October 2026</p><h2>Upcoming sessions</h2></div>
            <label className="month-selector">View month <select defaultValue="october"><option value="october">October 2026</option><option value="november">November 2026</option></select></label>
          </div>

          <div className="schedule-layout">
            <section className="schedule-list" aria-label="Upcoming lab sessions">
              {sessions.length === 0 ? <p className="empty-state">No future lab sessions are scheduled.</p> : sessions.map((session) => (
                <button className={`schedule-session ${selectedSession.id === session.id ? 'selected' : ''}`} type="button" key={session.id} onClick={() => setSelectedSession(session)}>
                  <span className={`session-date ${session.tone}`}><strong>{session.day}</strong><small>{session.month}</small></span>
                  <span className="session-info"><strong>{session.subject}</strong><small>{session.code} · {session.time}</small><small>{session.room}</small></span>
                  <span className={`session-status ${session.status.toLowerCase()}`}>{session.status}</span>
                </button>
              ))}
            </section>

            <aside className="lab-details-card">
              <div className="details-heading"><div><p className="eyebrow">Selected session</p><h2>Lab Details</h2></div><span className={`session-status ${selectedSession.status.toLowerCase()}`}>{selectedSession.status}</span></div>
              <h3>{selectedSession.subject}</h3>
              <p className="details-meta">{selectedSession.date} · {selectedSession.time}<br />{selectedSession.room}<br />Lecturer: {selectedSession.lecturer}</p>
              <div className="detail-block"><h4>Session instructions</h4><p>{selectedSession.instructions}</p></div>
              <div className="detail-block"><h4>Bring with you</h4><p>{selectedSession.equipment}</p></div>
              <div className="detail-block safety-note"><h4>Safety note</h4><p>{selectedSession.safety}</p></div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default LabSchedulePage