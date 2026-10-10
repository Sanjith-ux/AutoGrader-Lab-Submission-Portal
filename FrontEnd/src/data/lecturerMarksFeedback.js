let records = [
  {
    id: 'sofia-hci-report',
    student: 'Sofia Perera',
    studentId: 'STU-2026-014',
    assignment: 'HCI Observation Report',
    subject: 'Human Computer Interaction',
    submittedDate: '2026-10-18',
    mark: '',
    totalMarks: 100,
    status: 'Awaiting Review',
    feedbackStatus: 'Not started',
    feedback: '',
    strengths: '',
    improvements: '',
    checks: { deadline: 'Passed', fileType: 'Passed', requiredFiles: 'Passed', fileSize: 'Passed' },
  },
  {
    id: 'noah-database-results',
    student: 'Noah Williams',
    studentId: 'STU-2026-021',
    assignment: 'Database Query Results',
    subject: 'Database Systems',
    submittedDate: '2026-10-19',
    mark: '',
    totalMarks: 80,
    status: 'Draft Feedback',
    feedbackStatus: 'Draft saved',
    feedback: 'The query comparison is heading in the right direction.',
    strengths: 'Good use of indexes in the second query.',
    improvements: '',
    checks: { deadline: 'Warning', fileType: 'Passed', requiredFiles: 'Passed', fileSize: 'Warning' },
  },
  {
    id: 'amara-network-design',
    student: 'Amara Silva',
    studentId: 'STU-2026-034',
    assignment: 'Network Topology Design',
    subject: 'Network Design',
    submittedDate: '2026-10-17',
    mark: 86,
    totalMarks: 100,
    status: 'Graded',
    feedbackStatus: 'Published',
    feedback: 'Strong topology rationale and a clear explanation of the security choices.',
    strengths: 'Well-structured design and thoughtful redundancy decisions.',
    improvements: 'Add clearer labels to the redundancy path in your next submission.',
    checks: { deadline: 'Passed', fileType: 'Passed', requiredFiles: 'Needs Attention', fileSize: 'Passed' },
  },
  {
    id: 'liam-testing-log',
    student: 'Liam Fernando',
    studentId: 'STU-2026-047',
    assignment: 'Software Testing Log',
    subject: 'Software Engineering',
    submittedDate: '2026-09-30',
    mark: 54,
    totalMarks: 60,
    status: 'Graded',
    feedbackStatus: 'Published',
    feedback: 'Good coverage of the core test cases.',
    strengths: 'Consistent evidence and clear test outcomes.',
    improvements: 'Include more negative-path tests in the next iteration.',
    checks: { deadline: 'Passed', fileType: 'Passed', requiredFiles: 'Passed', fileSize: 'Passed' },
  },
  {
    id: 'maya-network-design',
    student: 'Maya Chen',
    studentId: 'STU-2026-052',
    assignment: 'Network Topology Design',
    subject: 'Network Design',
    submittedDate: null,
    mark: '',
    totalMarks: 100,
    status: 'Awaiting Review',
    feedbackStatus: 'Not started',
    feedback: '',
    strengths: '',
    improvements: '',
    checks: { deadline: 'Needs Attention', fileType: 'Needs Attention', requiredFiles: 'Needs Attention', fileSize: 'Needs Attention' },
  },
]

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getMarksFeedbackRecords() {
  return records
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateMarksFeedbackRecord(id, changes) {
  records = records.map((record) => record.id === id ? { ...record, ...changes } : record)
  notify()
}
