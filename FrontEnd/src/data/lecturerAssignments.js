let assignments = [
  {
    id: 'hci-observation-report',
    title: 'HCI Observation Report',
    subject: 'Human Computer Interaction',
    description: 'Document your observation session and connect your findings to usability principles.',
    deadline: '2026-10-18T23:59',
    totalMarks: '100',
    submissionRequirements: 'Submit a structured report with observation notes, findings, and recommendations.',
    allowedFileTypes: ['PDF', 'DOCX'],
    requiredFiles: 'Observation report',
    maxFileSize: '10',
    allowLateSubmissions: true,
    status: 'Published',
    submissions: 18,
  },
  {
    id: 'database-query-results',
    title: 'Database Query Results',
    subject: 'Database Systems',
    description: 'Compare the performance of the supplied queries and explain your indexing decisions.',
    deadline: '2026-10-22T23:59',
    totalMarks: '80',
    submissionRequirements: 'Include the query output, a short comparison, and supporting screenshots.',
    allowedFileTypes: ['PDF', 'DOCX', 'ZIP'],
    requiredFiles: 'Query results and explanation',
    maxFileSize: '20',
    allowLateSubmissions: false,
    status: 'Published',
    submissions: 12,
  },
  {
    id: 'network-topology-design',
    title: 'Network Topology Design',
    subject: 'Network Design',
    description: 'Design and justify a secure topology for the given laboratory scenario.',
    deadline: '2026-10-28T23:59',
    totalMarks: '100',
    submissionRequirements: 'Upload the topology diagram and a written explanation of the design.',
    allowedFileTypes: ['PDF', 'PNG'],
    requiredFiles: 'Topology diagram and explanation',
    maxFileSize: '15',
    allowLateSubmissions: true,
    status: 'Draft',
    submissions: 0,
  },
  {
    id: 'software-testing-log',
    title: 'Software Testing Log',
    subject: 'Software Engineering',
    description: 'Record test cases, outcomes, and the improvements made during the lab.',
    deadline: '2026-09-30T23:59',
    totalMarks: '60',
    submissionRequirements: 'Provide a completed test log with evidence for each test case.',
    allowedFileTypes: ['PDF', 'DOCX', 'JPG', 'PNG'],
    requiredFiles: 'Testing log',
    maxFileSize: '10',
    allowLateSubmissions: false,
    status: 'Closed',
    submissions: 25,
  },
]

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getAssignments() {
  return assignments
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function createAssignment(assignment) {
  const created = { ...assignment, id: `assignment-${Date.now()}`, submissions: 0 }
  assignments = [created, ...assignments]
  notify()
  return created
}

export function updateAssignment(id, changes) {
  assignments = assignments.map((assignment) => assignment.id === id ? { ...assignment, ...changes } : assignment)
  notify()
}

export function deleteAssignment(id) {
  assignments = assignments.filter((assignment) => assignment.id !== id)
  notify()
}
