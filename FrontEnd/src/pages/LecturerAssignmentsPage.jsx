import { useSyncExternalStore, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LecturerSidebar from '../components/LecturerSidebar'
import { deleteAssignment, getAssignments, subscribe } from '../data/lecturerAssignments'

const filters = ['All', 'Draft', 'Published', 'Closed']

function formatDeadline(deadline) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(deadline))
}

function AssignmentStatus({ status }) {
  return <span className={`lecturer-assignment-status ${status.toLowerCase()}`}>{status}</span>
}

function LecturerAssignmentsPage() {
  const navigate = useNavigate()
  const assignments = useSyncExternalStore(subscribe, getAssignments)
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const visibleAssignments = assignments.filter((assignment) => filter === 'All' || assignment.status === filter)
  const selectedAssignment = assignments.find((assignment) => assignment.id === selectedId)

  function handleDelete(assignment) {
    if (window.confirm(`Delete "${assignment.title}"? This action cannot be undone.`)) {
      deleteAssignment(assignment.id)
      if (selectedId === assignment.id) setSelectedId(null)
    }
  }

  return (
    <main className="student-dashboard lecturer-dashboard">
      <LecturerSidebar />
      <section className="student-main">
        <header className="student-header assignments-header">
          <div><p className="eyebrow">Lecturer Workspace</p><h1>Manage Assignments</h1><p className="student-header-copy">Create, publish, and track laboratory assignments for your students.</p></div>
          <div className="student-avatar" aria-label="Lecturer profile">DF</div>
        </header>
        <div className="student-content lecturer-content">
          <div className="assignment-toolbar lecturer-assignment-toolbar">
            <div><p className="eyebrow">Coursework</p><h2>All assignments</h2></div>
            <div className="lecturer-assignment-actions"><div className="assignment-filters" aria-label="Assignment status filters">{filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className="primary-action-button" type="button" onClick={() => navigate('/lecturer/assignments/create')}>Create Assignment <span aria-hidden="true">+</span></button></div>
          </div>

          <div className="lecturer-assignment-layout">
            <section className="lecturer-assignment-table-wrap" aria-label={`${filter} assignments`}>
              {visibleAssignments.length === 0 ? <div className="empty-state lecturer-empty"><strong>No assignments found</strong><p>Create an assignment to start building your coursework list.</p><button className="primary-action-button" type="button" onClick={() => navigate('/lecturer/assignments/create')}>Create Assignment <span aria-hidden="true">+</span></button></div> : <div className="lecturer-assignment-table-scroll"><table className="lecturer-assignment-table"><thead><tr><th>Assignment</th><th>Deadline</th><th>Status</th><th>Submissions</th><th>Actions</th></tr></thead><tbody>{visibleAssignments.map((assignment) => <tr className={selectedId === assignment.id ? 'selected' : ''} key={assignment.id}><td><strong>{assignment.title}</strong><small>{assignment.subject}</small></td><td>{formatDeadline(assignment.deadline)}</td><td><AssignmentStatus status={assignment.status} /></td><td>{assignment.submissions}</td><td><div className="table-actions"><button className="details-button" type="button" onClick={() => setSelectedId(assignment.id)}>View</button><button className="details-button" type="button" onClick={() => navigate(`/lecturer/assignments/${assignment.id}/edit`)}>Edit</button><button className="delete-button" type="button" onClick={() => handleDelete(assignment)}>Delete</button></div></td></tr>)}</tbody></table></div>}
            </section>

            {selectedAssignment && <aside className="lecturer-assignment-detail"><div className="section-heading"><div><p className="eyebrow">Assignment overview</p><h2>{selectedAssignment.title}</h2></div><AssignmentStatus status={selectedAssignment.status} /></div><p className="assignment-detail-subject">{selectedAssignment.subject}</p><div className="assignment-detail-meta"><span><strong>Deadline</strong>{formatDeadline(selectedAssignment.deadline)}</span><span><strong>Total marks</strong>{selectedAssignment.totalMarks}</span><span><strong>Submissions</strong>{selectedAssignment.submissions}</span></div><div className="detail-block"><h4>Instructions</h4><p>{selectedAssignment.description}</p></div><div className="detail-block"><h4>Submission requirements</h4><p>{selectedAssignment.submissionRequirements}</p></div><button className="primary-action-button detail-edit-button" type="button" onClick={() => navigate(`/lecturer/assignments/${selectedAssignment.id}/edit`)}>Edit assignment <span aria-hidden="true">→</span></button></aside>}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LecturerAssignmentsPage
