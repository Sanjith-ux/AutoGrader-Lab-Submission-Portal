import { useState, useSyncExternalStore } from 'react'
import LecturerSidebar from '../components/LecturerSidebar'
import { getMedicalRequests, subscribe, updateMedicalRequest } from '../data/lecturerMedicalRequests'

const filters = ['All', 'Pending', 'Approved', 'Rejected']

function formatDate(date) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(`${date}T00:00:00`))
}

function RequestStatus({ status }) {
  return <span className={`medical-request-status ${status.toLowerCase()}`}>{status}</span>
}

function LecturerMedicalRequestsPage() {
  const requests = useSyncExternalStore(subscribe, getMedicalRequests)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const selectedRequest = requests.find((request) => request.id === selectedId)
  const visibleRequests = requests.filter((request) => {
    const matchesFilter = filter === 'All' || request.status === filter
    const searchValue = search.trim().toLowerCase()
    const matchesSearch = !searchValue || request.student.toLowerCase().includes(searchValue) || request.studentId.toLowerCase().includes(searchValue)
    return matchesFilter && matchesSearch
  })
  const summary = [
    { label: 'Total requests', value: requests.length, tone: 'green' },
    { label: 'Pending requests', value: requests.filter((request) => request.status === 'Pending').length, tone: 'gold' },
    { label: 'Approved requests', value: requests.filter((request) => request.status === 'Approved').length, tone: 'blue' },
    { label: 'Rejected requests', value: requests.filter((request) => request.status === 'Rejected').length, tone: 'rose' },
  ]

  function reviewRequest(request) {
    setSelectedId(request.id)
    setComment(request.comment)
    setCommentError('')
    setSuccessMessage('')
  }

  function updateStatus(status) {
    if (status === 'Rejected' && !comment.trim()) {
      setCommentError('Add a lecturer comment before rejecting this request.')
      return
    }
    updateMedicalRequest(selectedRequest.id, { status, comment: comment.trim() })
    setCommentError('')
    setSuccessMessage(`${selectedRequest.student}'s request was ${status.toLowerCase()}.`)
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Medical Requests</h1><p className="student-header-copy">Review student absence requests and their supporting documents.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>

        <div className="student-content lecturer-content medical-management-content">
          <section className="medical-summary-grid" aria-label="Medical request summary">{summary.map((item) => <article className="summary-card medical-summary-card" key={item.label}><div className="summary-card-top"><span className={`card-icon ${item.tone}-icon`}>+</span><span className="card-label">{item.label}</span></div><p className="large-stat">{item.value}</p><p className="summary-meta">Across all requests</p></article>)}</section>

          <section className="medical-request-filter-panel" aria-label="Medical request filters"><div className="assignment-filters" aria-label="Medical request status filters">{filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="medical-request-search"><label htmlFor="medical-request-search">Search student</label><input id="medical-request-search" type="search" placeholder="Search by name or student ID" value={search} onChange={(event) => setSearch(event.target.value)} /></div></section>

          <div className="medical-request-management-layout">
            <section className="lecturer-assignment-table-wrap" aria-label={`${filter} medical requests`}>
              {visibleRequests.length === 0 ? <div className="empty-state lecturer-empty"><strong>No medical requests match these filters</strong><p>Try clearing a filter or searching for another student.</p></div> : <div className="lecturer-assignment-table-scroll"><table className="lecturer-assignment-table medical-request-table"><thead><tr><th>Student</th><th>Missed lab session</th><th>Absence date</th><th>Reason</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{visibleRequests.map((request) => <tr className={selectedId === request.id ? 'selected' : ''} key={request.id}><td><strong>{request.student}</strong><small>{request.studentId}</small></td><td>{request.session}<small>{request.subject}</small></td><td>{formatDate(request.absenceDate)}</td><td>{request.reason}</td><td>{formatDate(request.submittedDate)}</td><td><RequestStatus status={request.status} /></td><td><button className="details-button" type="button" onClick={() => reviewRequest(request)}>Review</button></td></tr>)}</tbody></table></div>}
            </section>

            {selectedRequest && <aside className="lecturer-assignment-detail medical-request-detail"><div className="section-heading"><div><p className="eyebrow">Review request</p><h2>{selectedRequest.student}</h2></div><RequestStatus status={selectedRequest.status} /></div><p className="assignment-detail-subject">{selectedRequest.studentId} · {selectedRequest.email}</p><div className="assignment-detail-meta"><span><strong>Missed session</strong>{selectedRequest.session}</span><span><strong>Absence date</strong>{formatDate(selectedRequest.absenceDate)}</span><span><strong>Room and time</strong>{selectedRequest.room} · {selectedRequest.time}</span><span><strong>Submitted</strong>{formatDate(selectedRequest.submittedDate)}</span></div><div className="detail-block"><h4>Student explanation</h4><p>{selectedRequest.explanation}</p></div><div className="detail-block"><h4>Supporting document</h4><div className="medical-document"><span className="file-type">{selectedRequest.documentType}</span><span><strong>{selectedRequest.documentName}</strong><small>{selectedRequest.documentSize}</small></span></div><button className="secondary-action-button view-document-button" type="button">View document <span aria-hidden="true">↗</span></button></div>{selectedRequest.status === 'Pending' && <div className="medical-review-form"><div className="field-group"><label htmlFor="medical-comment">Lecturer comment</label><textarea id="medical-comment" rows="4" value={comment} onChange={(event) => { setComment(event.target.value); setCommentError('') }} placeholder="Add context for the student" aria-invalid={Boolean(commentError)} />{commentError && <p className="field-error">{commentError}</p>}</div><div className="medical-review-actions"><button className="secondary-action-button reject-button" type="button" onClick={() => updateStatus('Rejected')}>Reject</button><button className="primary-action-button" type="button" onClick={() => updateStatus('Approved')}>Approve <span aria-hidden="true">✓</span></button></div></div>}{selectedRequest.status !== 'Pending' && <div className="medical-existing-comment"><h4>Lecturer comment</h4><p>{selectedRequest.comment}</p></div>}{successMessage && <p className="medical-success" role="status">{successMessage}</p>}</aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LecturerMedicalRequestsPage
