import { useState, useSyncExternalStore } from 'react'
import LecturerSidebar from '../components/LecturerSidebar'
import { getAttendanceSessions, subscribe, updateAttendance } from '../data/lecturerAttendance'

const statuses = ['Present', 'Absent', 'Late', 'Excused']

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

function AttendanceStatus({ status }) {
  return <span className={`attendance-status ${status.toLowerCase()}`}>{status}</span>
}

function LecturerAttendancePage() {
  const sessions = useSyncExternalStore(subscribe, getAttendanceSessions)
  const [sessionId, setSessionId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [draftStudents, setDraftStudents] = useState([])
  const [saveError, setSaveError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const selectedSession = sessions.find((session) => session.id === sessionId)
  const recordedSessions = sessions.filter((session) => session.recorded)
  const counts = statuses.reduce((summary, status) => ({ ...summary, [status]: draftStudents.filter((student) => student.status === status).length }), {})

  function loadSession(id) {
    const session = sessions.find((item) => item.id === id)
    setSessionId(id)
    setSelectedDate(session?.date || '')
    setDraftStudents(session ? session.students.map((student) => ({ ...student })) : [])
    setSaveError('')
    setSuccessMessage('')
  }

  function changeDate(date) {
    const session = sessions.find((item) => item.date === date)
    if (session) loadSession(session.id)
    else {
      setSelectedDate(date)
      setSessionId('')
      setDraftStudents([])
    }
  }

  function updateStudent(studentId, field, value) {
    setDraftStudents((current) => current.map((student) => student.id === studentId ? { ...student, [field]: value } : student))
    setSuccessMessage('')
  }

  function markAllPresent() {
    setDraftStudents((current) => current.map((student) => ({ ...student, status: 'Present' })))
    setSuccessMessage('')
  }

  function saveAttendance(event) {
    event.preventDefault()
    if (!selectedSession) {
      setSaveError('Select a lab session before saving attendance.')
      return
    }
    setSaveError('')
    updateAttendance(selectedSession.id, draftStudents)
    setSuccessMessage(`Attendance saved for ${selectedSession.title}.`)
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Attendance Management</h1><p className="student-header-copy">Record and update attendance for your physical laboratory sessions.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>

        <div className="student-content lecturer-content attendance-content">
          <section className="attendance-selector-panel"><div className="attendance-selector-field"><label htmlFor="attendance-session">Lab session</label><select id="attendance-session" value={sessionId} onChange={(event) => loadSession(event.target.value)}><option value="">Select a lab session</option>{sessions.map((session) => <option value={session.id} key={session.id}>{session.title} · {formatDate(session.date)}</option>)}</select></div><div className="attendance-selector-field"><label htmlFor="attendance-date">Date</label><select id="attendance-date" value={selectedDate} onChange={(event) => changeDate(event.target.value)}><option value="">Select a date</option>{sessions.map((session) => <option value={session.date} key={session.id}>{formatDate(session.date)}</option>)}</select></div></section>

          {selectedSession && <section className="attendance-session-details"><div><p className="eyebrow">Selected session</p><h2>{selectedSession.title}</h2><p>{selectedSession.subject}</p></div><div className="attendance-meta"><span><strong>Room</strong>{selectedSession.room}</span><span><strong>Time</strong>{selectedSession.time}</span><span><strong>Lecturer</strong>{selectedSession.lecturer}</span><span><strong>Enrolled students</strong>{selectedSession.students.length}</span></div></section>}

          <section className="attendance-toolbar"><div><p className="eyebrow">Session register</p><h2>{selectedSession ? 'Student attendance' : 'Choose a session to begin'}</h2></div><div className="attendance-actions"><button className="secondary-action-button" type="button" onClick={markAllPresent} disabled={!selectedSession || draftStudents.length === 0}>Mark All Present</button><button className="primary-action-button" type="button" onClick={saveAttendance}>Save Attendance <span aria-hidden="true">→</span></button></div></section>
          {saveError && <p className="attendance-form-error" role="alert">{saveError}</p>}
          {successMessage && <p className="attendance-success" role="status">{successMessage}</p>}

          <section className="attendance-register-panel" aria-label="Student attendance register">
            {!selectedSession ? <div className="empty-state lecturer-empty"><strong>Select a lab session</strong><p>Choose a session and date to load the student register.</p></div> : draftStudents.length === 0 ? <div className="empty-state lecturer-empty"><strong>No enrolled students</strong><p>This lab session has no enrolled students to record.</p></div> : <><div className="attendance-summary">{statuses.map((status) => <div className="attendance-summary-item" key={status}><AttendanceStatus status={status} /><strong>{counts[status]}</strong></div>)}</div><div className="lecturer-assignment-table-scroll"><table className="lecturer-assignment-table attendance-table"><thead><tr><th>Student</th><th>Student ID</th><th>Attendance status</th><th>Lecturer note</th></tr></thead><tbody>{draftStudents.map((student) => <tr key={student.id}><td><strong>{student.name}</strong></td><td>{student.id}</td><td><select className="attendance-status-select" aria-label={`Attendance status for ${student.name}`} value={student.status} onChange={(event) => updateStudent(student.id, 'status', event.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td><input className="attendance-note-input" aria-label={`Note for ${student.name}`} value={student.note} onChange={(event) => updateStudent(student.id, 'note', event.target.value)} placeholder="Optional note" /></td></tr>)}</tbody></table></div></>}
          </section>

          <section className="recorded-attendance-section"><div className="section-heading"><div><p className="eyebrow">Attendance history</p><h2>Previously recorded sessions</h2></div></div>{recordedSessions.length === 0 ? <div className="empty-state"><strong>No saved attendance records</strong><p>Saved registers will appear here.</p></div> : <div className="recorded-attendance-list">{recordedSessions.map((session) => <article className="recorded-attendance-item" key={session.id}><div><strong>{session.title}</strong><p>{session.subject} · {formatDate(session.date)} · {session.students.length} students</p></div><button className="details-button" type="button" onClick={() => loadSession(session.id)}>View / Edit</button></article>)}</div>}</section>
        </div>
      </section>
    </main>
  )
}

export default LecturerAttendancePage
