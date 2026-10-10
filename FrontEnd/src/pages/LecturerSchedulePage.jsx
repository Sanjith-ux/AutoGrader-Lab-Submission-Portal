import { useState, useSyncExternalStore } from 'react'
import LecturerSidebar from '../components/LecturerSidebar'
import { createSession, deleteSession, getSessions, subscribe, updateSession } from '../data/lecturerSchedule'

const filters = ['All', 'Upcoming', 'Completed', 'Cancelled']
const emptyForm = {
  title: '',
  subject: '',
  date: '',
  startTime: '',
  endTime: '',
  room: '',
  capacity: '',
  materials: '',
  safetyNotes: '',
  status: 'Upcoming',
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

function SessionStatus({ status }) {
  return <span className={`schedule-status ${status.toLowerCase()}`}>{status}</span>
}

function LecturerSchedulePage() {
  const sessions = useSyncExternalStore(subscribe, getSessions)
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const visibleSessions = sessions.filter((session) => filter === 'All' || session.status === filter)
  const selectedSession = sessions.find((session) => session.id === selectedId)
  const editingSession = sessions.find((session) => session.id === editingId)

  function openCreate() {
    setEditingId('new')
    setForm(emptyForm)
    setErrors({})
  }

  function openEdit(session) {
    setEditingId(session.id)
    setForm({ ...session, capacity: String(session.capacity) })
    setErrors({})
  }

  function closeForm() {
    setEditingId(null)
    setErrors({})
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  function validate() {
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Enter a lab title.'
    if (!form.subject.trim()) nextErrors.subject = 'Enter the subject or module.'
    if (!form.date) nextErrors.date = 'Choose a session date.'
    if (!form.startTime) nextErrors.startTime = 'Choose a start time.'
    if (!form.endTime) nextErrors.endTime = 'Choose an end time.'
    if (form.startTime && form.endTime && form.endTime <= form.startTime) nextErrors.endTime = 'End time must be later than start time.'
    if (!form.room.trim()) nextErrors.room = 'Enter a room or location.'
    if (!form.capacity || Number(form.capacity) <= 0) nextErrors.capacity = 'Enter a capacity greater than zero.'
    return nextErrors
  }

  function saveSession(event) {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const session = { ...form, capacity: Number(form.capacity) }
    if (editingId === 'new') createSession(session)
    else updateSession(editingId, session)
    closeForm()
  }

  function handleDelete(session) {
    const action = session.status === 'Upcoming' ? 'cancel' : 'delete'
    const message = action === 'cancel'
      ? `Cancel "${session.title}"? Students will see this session as cancelled.`
      : `Delete "${session.title}"? This action cannot be undone.`
    if (!window.confirm(message)) return
    if (action === 'cancel') updateSession(session.id, { status: 'Cancelled' })
    else deleteSession(session.id)
    if (selectedId === session.id) setSelectedId(null)
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Lab Schedule Management</h1><p className="student-header-copy">Plan and manage physical laboratory sessions for your students.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>

        <div className="student-content lecturer-content">
          <div className="assignment-toolbar lecturer-assignment-toolbar schedule-toolbar">
            <div><p className="eyebrow">Teaching calendar</p><h2>Lab sessions</h2></div>
            <div className="lecturer-assignment-actions"><div className="assignment-filters" aria-label="Lab session status filters">{filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="primary-action-button" type="button" onClick={openCreate}>Create Lab Session <span aria-hidden="true">+</span></button></div>
          </div>

          <div className="schedule-layout">
            <section className="lecturer-assignment-table-wrap" aria-label={`${filter} lab sessions`}>
              {visibleSessions.length === 0 ? <div className="empty-state lecturer-empty"><strong>No lab sessions found</strong><p>Try another filter or create a new session.</p><button className="primary-action-button" type="button" onClick={openCreate}>Create Lab Session <span aria-hidden="true">+</span></button></div> : <div className="lecturer-assignment-table-scroll"><table className="lecturer-assignment-table schedule-table"><thead><tr><th>Lab session</th><th>Date &amp; time</th><th>Room</th><th>Instructor</th><th>Students</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visibleSessions.map((session) => <tr className={selectedId === session.id ? 'selected' : ''} key={session.id}><td><strong>{session.title}</strong><small>{session.subject}</small></td><td>{formatDate(session.date)}<small>{session.startTime} - {session.endTime}</small></td><td>{session.room}</td><td>{session.instructor}</td><td>{session.enrolled} / {session.capacity}</td><td><SessionStatus status={session.status} /></td><td><div className="table-actions"><button className="details-button" type="button" onClick={() => setSelectedId(session.id)}>View</button><button className="details-button" type="button" onClick={() => openEdit(session)}>Edit</button><button className="delete-button" type="button" onClick={() => handleDelete(session)}>{session.status === 'Upcoming' ? 'Cancel' : 'Delete'}</button></div></td></tr>)}</tbody></table></div>}
            </section>

            {selectedSession && !editingSession && <aside className="lecturer-assignment-detail schedule-detail"><div className="section-heading"><div><p className="eyebrow">Session overview</p><h2>{selectedSession.title}</h2></div><SessionStatus status={selectedSession.status} /></div><p className="assignment-detail-subject">{selectedSession.subject}</p><div className="assignment-detail-meta"><span><strong>Date</strong>{formatDate(selectedSession.date)}</span><span><strong>Time</strong>{selectedSession.startTime} - {selectedSession.endTime}</span><span><strong>Room</strong>{selectedSession.room}</span><span><strong>Students</strong>{selectedSession.enrolled} enrolled of {selectedSession.capacity}</span></div><div className="detail-block"><h4>Instructions and materials</h4><p>{selectedSession.materials || 'No additional materials listed.'}</p></div><div className="detail-block safety-note"><h4>Safety notes</h4><p>{selectedSession.safetyNotes || 'No additional safety notes listed.'}</p></div><button className="primary-action-button detail-edit-button" type="button" onClick={() => openEdit(selectedSession)}>Edit session <span aria-hidden="true">→</span></button></aside>}

            {editingId && <form className="lecturer-assignment-detail schedule-form" onSubmit={saveSession} noValidate><div className="section-heading"><div><p className="eyebrow">{editingId === 'new' ? 'New session' : 'Update session'}</p><h2>{editingId === 'new' ? 'Create lab session' : 'Edit lab session'}</h2></div><button className="close-button" type="button" onClick={closeForm} aria-label="Close form">×</button></div><div className="schedule-form-fields"><div className="field-group"><label htmlFor="title">Lab title</label><input id="title" name="title" value={form.title} onChange={updateField} aria-invalid={Boolean(errors.title)} />{errors.title && <p className="field-error">{errors.title}</p>}</div><div className="field-group"><label htmlFor="subject">Subject/module</label><input id="subject" name="subject" value={form.subject} onChange={updateField} aria-invalid={Boolean(errors.subject)} />{errors.subject && <p className="field-error">{errors.subject}</p>}</div><div className="schedule-form-grid"><div className="field-group"><label htmlFor="date">Date</label><input id="date" name="date" type="date" value={form.date} onChange={updateField} aria-invalid={Boolean(errors.date)} />{errors.date && <p className="field-error">{errors.date}</p>}</div><div className="field-group"><label htmlFor="room">Room/location</label><input id="room" name="room" value={form.room} onChange={updateField} aria-invalid={Boolean(errors.room)} />{errors.room && <p className="field-error">{errors.room}</p>}</div><div className="field-group"><label htmlFor="startTime">Start time</label><input id="startTime" name="startTime" type="time" value={form.startTime} onChange={updateField} aria-invalid={Boolean(errors.startTime)} />{errors.startTime && <p className="field-error">{errors.startTime}</p>}</div><div className="field-group"><label htmlFor="endTime">End time</label><input id="endTime" name="endTime" type="time" value={form.endTime} onChange={updateField} aria-invalid={Boolean(errors.endTime)} />{errors.endTime && <p className="field-error">{errors.endTime}</p>}</div></div><div className="field-group"><label htmlFor="capacity">Student capacity</label><input id="capacity" name="capacity" type="number" min="1" value={form.capacity} onChange={updateField} aria-invalid={Boolean(errors.capacity)} />{errors.capacity && <p className="field-error">{errors.capacity}</p>}</div><div className="field-group"><label htmlFor="materials">Instructions/materials to bring</label><textarea id="materials" name="materials" rows="3" value={form.materials} onChange={updateField} /></div><div className="field-group"><label htmlFor="safetyNotes">Safety notes</label><textarea id="safetyNotes" name="safetyNotes" rows="3" value={form.safetyNotes} onChange={updateField} /></div><div className="field-group"><label htmlFor="status">Status</label><select id="status" name="status" value={form.status} onChange={updateField}><option>Upcoming</option><option>Completed</option><option>Cancelled</option></select></div></div><div className="form-actions schedule-form-actions"><button className="secondary-action-button" type="button" onClick={closeForm}>Cancel</button><button className="primary-action-button" type="submit">{editingId === 'new' ? 'Create Session' : 'Save Changes'} <span aria-hidden="true">→</span></button></div></form>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LecturerSchedulePage
