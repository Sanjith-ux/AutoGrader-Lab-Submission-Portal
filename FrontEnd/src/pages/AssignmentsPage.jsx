import { useState } from 'react'
import { Link } from 'react-router-dom'
import StudentSidebar from '../components/StudentSidebar'
import { assignments, getAssignmentStatus } from '../data/assignments'

const filters = ['All', 'Pending', 'Submitted', 'Overdue']

function matchesFilter(assignment, filter) {
  const status = getAssignmentStatus(assignment.id)
  if (filter === 'Pending') return status === 'Not submitted'
  if (filter === 'Submitted') return status === 'Submitted' || status === 'Graded'
  if (filter === 'Overdue') return status === 'Late'
  return true
}

function AssignmentsPage() {
  const [filter, setFilter] = useState('All')
  const visibleAssignments = assignments.filter((assignment) => matchesFilter(assignment, filter))

  return (
    <main className="student-dashboard">
      <StudentSidebar />
      <section className="student-main assignments-main">
        <header className="student-header assignments-header">
          <div>
            <p className="eyebrow">Student workspace</p>
            <h1>Assignments</h1>
            <p className="student-header-copy">Keep track of your lab work, requirements, and submission deadlines.</p>
          </div>
          <div className="student-avatar" aria-label="Student profile">S</div>
        </header>

        <div className="student-content assignments-content">
          <div className="assignment-toolbar">
            <div><p className="eyebrow">Your coursework</p><h2>All assignments</h2></div>
            <div className="assignment-filters" aria-label="Assignment filters">
              {filters.map((item) => <button className={filter === item ? 'filter-button active' : 'filter-button'} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}
            </div>
          </div>

          <section className="assignment-list" aria-label={`${filter} assignments`}>
            {visibleAssignments.length === 0 ? <p className="empty-state">No assignments match this filter.</p> : visibleAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment.id)
              return (
                <article className="assignment-card" key={assignment.id}>
                  <div className="assignment-card-icon">□</div>
                  <div className="assignment-card-body">
                    <div className="assignment-card-heading"><div><p className="assignment-subject">{assignment.subject}</p><h3>{assignment.title}</h3></div><span className={`assignment-status ${status.toLowerCase().replace(' ', '-')}`}>{status}</span></div>
                    <div className="assignment-meta"><span><strong>Due</strong> {assignment.dueDate} · 23:59</span><span><strong>Files</strong> {assignment.requiredFiles.join(', ')}</span><span><strong>Marks</strong> {assignment.marks}</span></div>
                    <Link className="assignment-link" to={`/student/assignments/${assignment.id}`}>View assignment <span aria-hidden="true">→</span></Link>
                  </div>
                </article>
              )
            })}
          </section>
        </div>
      </section>
    </main>
  )
}

export default AssignmentsPage