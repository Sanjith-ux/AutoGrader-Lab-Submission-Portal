let submissions = [
  {
    id: 'sofia-hci-report',
    student: 'Sofia Perera',
    email: 'sofia.perera@labtrack.edu',
    assignment: 'HCI Observation Report',
    subject: 'Human Computer Interaction',
    submittedAt: '2026-10-18T09:42',
    fileName: 'sofia-perera-hci-report.pdf',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    automaticCheck: 'Passed',
    status: 'Awaiting Review',
    mark: '',
    totalMarks: 100,
    feedback: '',
    checks: { deadline: 'Passed', fileType: 'Passed', requiredFiles: 'Passed', fileSize: 'Passed' },
  },
  {
    id: 'noah-database-results',
    student: 'Noah Williams',
    email: 'noah.williams@labtrack.edu',
    assignment: 'Database Query Results',
    subject: 'Database Systems',
    submittedAt: '2026-10-19T16:18',
    fileName: 'noah-williams-query-results.zip',
    fileType: 'ZIP',
    fileSize: '14.8 MB',
    automaticCheck: 'Warning',
    status: 'Late',
    mark: '',
    totalMarks: 80,
    feedback: '',
    checks: { deadline: 'Warning', fileType: 'Passed', requiredFiles: 'Passed', fileSize: 'Warning' },
  },
  {
    id: 'amara-network-design',
    student: 'Amara Silva',
    email: 'amara.silva@labtrack.edu',
    assignment: 'Network Topology Design',
    subject: 'Network Design',
    submittedAt: '2026-10-17T11:05',
    fileName: 'amara-silva-topology.png',
    fileType: 'PNG',
    fileSize: '1.1 MB',
    automaticCheck: 'Needs Attention',
    status: 'Graded',
    mark: '86',
    totalMarks: 100,
    feedback: 'Strong topology rationale. Add clearer labels to the redundancy path in your next submission.',
    checks: { deadline: 'Passed', fileType: 'Passed', requiredFiles: 'Needs Attention', fileSize: 'Passed' },
  },
  {
    id: 'liam-testing-log',
    student: 'Liam Fernando',
    email: 'liam.fernando@labtrack.edu',
    assignment: 'Software Testing Log',
    subject: 'Software Engineering',
    submittedAt: '2026-09-30T23:59',
    fileName: 'liam-fernando-testing-log.docx',
    fileType: 'DOCX',
    fileSize: '4.2 MB',
    automaticCheck: 'Passed',
    status: 'Graded',
    mark: '54',
    totalMarks: 60,
    feedback: 'Good coverage of the core test cases.',
    checks: { deadline: 'Passed', fileType: 'Passed', requiredFiles: 'Passed', fileSize: 'Passed' },
  },
  {
    id: 'maya-network-design',
    student: 'Maya Chen',
    email: 'maya.chen@labtrack.edu',
    assignment: 'Network Topology Design',
    subject: 'Network Design',
    submittedAt: null,
    fileName: null,
    fileType: null,
    fileSize: null,
    automaticCheck: 'Needs Attention',
    status: 'Missing',
    mark: '',
    totalMarks: 100,
    feedback: '',
    checks: { deadline: 'Needs Attention', fileType: 'Needs Attention', requiredFiles: 'Needs Attention', fileSize: 'Needs Attention' },
  },
]

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getSubmissions() {
  return submissions
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateSubmission(id, changes) {
  submissions = submissions.map((submission) => submission.id === id ? { ...submission, ...changes } : submission)
  notify()
}
