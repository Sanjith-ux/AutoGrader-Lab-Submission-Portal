export const assignments = [
  {
    id: 'hci-lab-report',
    title: 'Usability Observation Lab Report',
    subject: 'Human Computer Interaction',
    dueDate: '05 Oct 2026',
    dueDateTime: '2026-10-05T23:59:00',
    marks: 20,
    requiredFiles: ['PDF report'],
    requiredExtensions: ['pdf'],
    status: 'Not submitted',
    instructions: 'Document your observation findings, identify three usability issues, and support each recommendation with evidence from your session notes.',
  },
  {
    id: 'network-diagram',
    title: 'Network Topology Diagram',
    subject: 'Network Design',
    dueDate: '28 Sep 2026',
    dueDateTime: '2026-09-28T23:59:00',
    marks: 15,
    requiredFiles: ['PNG or JPG diagram', 'PDF explanation'],
    requiredExtensions: ['png', 'jpg', 'jpeg', 'pdf'],
    status: 'Late',
    instructions: 'Submit a labelled topology diagram and a short explanation of the addressing plan, routing choices, and expected points of failure.',
  },
  {
    id: 'database-results',
    title: 'Database Query Result Sheet',
    subject: 'Database Systems',
    dueDate: '12 Oct 2026',
    dueDateTime: '2026-10-12T23:59:00',
    marks: 25,
    requiredFiles: ['DOCX result sheet', 'ZIP supporting files'],
    requiredExtensions: ['docx', 'zip'],
    status: 'Not submitted',
    instructions: 'Complete the query exercises and explain the performance difference between the indexed and unindexed versions using the supplied dataset.',
  },
  {
    id: 'programming-reflection',
    title: 'Programming Lab Reflection',
    subject: 'Software Engineering',
    dueDate: '22 Sep 2026',
    dueDateTime: '2026-09-22T23:59:00',
    marks: 10,
    requiredFiles: ['PDF reflection'],
    requiredExtensions: ['pdf'],
    status: 'Graded',
    instructions: 'Reflect on your implementation choices, testing process, and one improvement you would make in a second iteration.',
  },
]

const assignmentStatuses = new Map(assignments.map((assignment) => [assignment.id, assignment.status]))

export function getAssignmentStatus(assignmentId) {
  return assignmentStatuses.get(assignmentId)
}

export function setAssignmentStatus(assignmentId, status) {
  assignmentStatuses.set(assignmentId, status)
}