import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'

const filters = ['All', 'Pending', 'Approved', 'Rejected']
const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'docx']
const missedSessions = [
  { id: 'network-design-28-sep', title: 'Network Design', date: 'Sat, 28 Sep 2026', room: 'Network Lab' },
  { id: 'database-systems-19-sep', title: 'Database Systems', date: 'Thu, 19 Sep 2026', room: 'Lab 2B' },
]

const initialRequests = [
  { id: 1, session: 'Database Systems', date: '20 Sep 2026', reason: 'Illness', status: 'Approved', comment: 'Medical certificate reviewed and absence excused.' },
  { id: 2, session: 'Network Design', date: '13 Sep 2026', reason: 'Family emergency', status: 'Pending', comment: 'Awaiting lecturer review.' },
  { id: 3, session: 'Human Computer Interaction', date: '05 Sep 2026', reason: 'Injury', status: 'Rejected', comment: 'Please provide supporting documentation for this request.' },
]

function getExtension(fileName) {
  return fileName.split('.').pop().toLowerCase()
}

function MedicalRequestsPage() {
  const [showForm, setShowForm] = useState(true)
  const [filter, setFilter] = useState('All')
  const [requests, setRequests] = useState(initialRequests)
  const [form, setForm] = useState({ session: '', date: '', reason: '', explanation: '', file: null })
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  const visibleRequests = requests.filter((request) => filter === 'All' || request.status === filter)

  function updateField(event) {
    const { name, value, files } = event.target
    setForm((current) => ({ ...current, [name]: name === 'file' ? files[0] || null : value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setSuccessMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = {}
    if (!form.session) nextErrors.session = 'Select the missed lab session.'
    if (!form.date) nextErrors.date = 'Enter the absence date.'
    if (!form.reason) nextErrors.reason = 'Select a reason for the absence.'
    if (!form.file) nextErrors.file = 'Upload a medical certificate or supporting document.'
    else if (!allowedExtensions.includes(getExtension(form.file.name))) nextErrors.file = 'Use a PDF, JPG, JPEG, PNG, or DOCX document.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setSuccessMessage('')
      return
    }

    const selectedSession = missedSessions.find((session) => session.id === form.session)
    const newRequest = { id: Date.now(), session: selectedSession.title, date: '03 Oct 2026', reason: form.reason, status: 'Pending', comment: 'Submitted this session and awaiting lecturer review.' }
    setRequests((current) => [newRequest, ...current])
    setForm({ session: '', date: '', reason: '', explanation: '', file: null })
    setErrors({})
    setSuccessMessage('Medical request submitted successfully. It has been added to your request history.')
  }

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main medical-requests-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Student workspace</p><h1>Medical Requests</h1><p className="student-header-copy">Request an excused absence when you miss a physical laboratory session.</p></div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content medical-requests-content">
          <div className="medical-request-intro"><div><p className="eyebrow">Missed a lab?</p><h2>Explain your absence</h2><p>Submit a medical request with supporting documentation so your lecturer can review the missed physical lab session.</p></div><button className="submit-button medical-toggle" type="button" onClick={() => setShowForm(true)}>Submit Medical Request <span aria-hidden="true">→</span></button></div>

          {showForm && <section className="medical-request-form-panel"><div className="section-heading"><div><p className="eyebrow">New request</p><h2>Submit Medical Request</h2></div></div><form className="medical-request-form" onSubmit={handleSubmit} noValidate>
            <div className="medical-form-grid"><div className="field-group"><label htmlFor="missed-session">Select missed lab session</label><select id="missed-session" name="session" value={form.session} onChange={updateField} aria-invalid={Boolean(errors.session)}><option value="">Choose a session</option>{missedSessions.map((session) => <option value={session.id} key={session.id}>{session.title} · {session.date}</option>)}</select>{errors.session && <p className="field-error">{errors.session}</p>}</div><div className="field-group"><label htmlFor="absence-date">Absence date</label><input id="absence-date" name="date" type="date" value={form.date} onChange={updateField} aria-invalid={Boolean(errors.date)} />{errors.date && <p className="field-error">{errors.date}</p>}</div><div className="field-group"><label htmlFor="absence-reason">Reason for absence</label><select id="absence-reason" name="reason" value={form.reason} onChange={updateField} aria-invalid={Boolean(errors.reason)}><option value="">Choose a reason</option><option>Illness</option><option>Injury</option><option>Family emergency</option><option>Other</option></select>{errors.reason && <p className="field-error">{errors.reason}</p>}</div><div className="field-group"><label htmlFor="supporting-document">Medical certificate or supporting document</label><input id="supporting-document" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" onChange={updateField} aria-invalid={Boolean(errors.file)} />{errors.file && <p className="field-error">{errors.file}</p>}</div></div><div className="field-group"><label htmlFor="absence-explanation">Optional explanation</label><textarea id="absence-explanation" name="explanation" value={form.explanation} onChange={updateField} placeholder="Add any context that may help your lecturer review this request." rows="4" /></div>{successMessage && <p className="submission-success" role="status">{successMessage}</p>}<button className="submit-button" type="submit">Submit request <span aria-hidden="true">→</span></button></form></section>}

          <div className="medical-history-toolbar"><div><p className="eyebrow">Request history</p><h2>Your medical requests</h2></div><div className="assignment-filters" aria-label="Medical request filters">{filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
          <section className="medical-history-table-wrap" aria-label={`${filter} medical requests`}>{visibleRequests.length === 0 ? <div className="empty-state medical-empty"><strong>No medical requests</strong><p>Requests you submit for missed lab sessions will appear here.</p><Link className="assignment-link" to="/student/attendance">View attendance <span aria-hidden="true">→</span></Link></div> : <div className="medical-history-table-scroll"><table className="medical-history-table"><thead><tr><th>Missed lab session</th><th>Date submitted</th><th>Reason</th><th>Status</th><th>Lecturer comment</th></tr></thead><tbody>{visibleRequests.map((request) => <tr key={request.id}><td><strong>{request.session}</strong></td><td>{request.date}</td><td>{request.reason}</td><td><span className={`medical-status ${request.status.toLowerCase()}`}>{request.status}</span></td><td>{request.comment}</td></tr>)}</tbody></table></div>}</section>
        </div>
      </section>
    </main>
  )
}

export default MedicalRequestsPage
