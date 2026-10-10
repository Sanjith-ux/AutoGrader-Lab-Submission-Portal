let requests = [
  {
    id: 'liam-database-request',
    student: 'Liam Fernando',
    studentId: 'STU-2026-047',
    email: 'liam.fernando@labtrack.edu',
    session: 'Query Optimisation Workshop',
    subject: 'Database Systems',
    room: 'Lab 2B',
    time: '14:00 - 16:00',
    absenceDate: '2026-09-26',
    reason: 'Medical appointment',
    explanation: 'I had a scheduled hospital appointment that overlapped with the database laboratory session. I am requesting an excused absence and will complete the missed practical work.',
    submittedDate: '2026-10-02',
    documentName: 'liam-fernando-medical-note.pdf',
    documentType: 'PDF',
    documentSize: '1.2 MB',
    status: 'Pending',
    comment: '',
  },
  {
    id: 'maya-network-request',
    student: 'Maya Chen',
    studentId: 'STU-2026-052',
    email: 'maya.chen@labtrack.edu',
    session: 'Network Equipment Practical',
    subject: 'Network Design',
    room: 'Network Lab',
    time: '13:00 - 15:00',
    absenceDate: '2026-09-28',
    reason: 'Illness',
    explanation: 'I was unwell and unable to attend the practical session. The attached note covers the date of the absence.',
    submittedDate: '2026-10-01',
    documentName: 'maya-chen-doctor-note.jpg',
    documentType: 'JPG',
    documentSize: '860 KB',
    status: 'Pending',
    comment: '',
  },
  {
    id: 'noah-hci-request',
    student: 'Noah Williams',
    studentId: 'STU-2026-021',
    email: 'noah.williams@labtrack.edu',
    session: 'Usability Testing Lab',
    subject: 'Human Computer Interaction',
    room: 'Lab 3A',
    time: '09:00 - 11:00',
    absenceDate: '2026-09-22',
    reason: 'Family emergency',
    explanation: 'A family emergency required me to travel at short notice. I have included the supporting document for your review.',
    submittedDate: '2026-09-24',
    documentName: 'noah-williams-supporting-letter.pdf',
    documentType: 'PDF',
    documentSize: '540 KB',
    status: 'Approved',
    comment: 'Approved. Please arrange a catch-up activity with the lab group.',
  },
  {
    id: 'amara-software-request',
    student: 'Amara Silva',
    studentId: 'STU-2026-034',
    email: 'amara.silva@labtrack.edu',
    session: 'Test Case Design',
    subject: 'Software Engineering',
    room: 'Software Lab',
    time: '10:00 - 12:00',
    absenceDate: '2026-09-29',
    reason: 'Personal commitment',
    explanation: 'I was unable to attend because of a personal commitment. I would like to request consideration for the missed attendance.',
    submittedDate: '2026-09-30',
    documentName: 'amara-silva-request.pdf',
    documentType: 'PDF',
    documentSize: '320 KB',
    status: 'Rejected',
    comment: 'The supporting document does not cover the lab date. Please contact the lecturer if you have further evidence.',
  },
]

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getMedicalRequests() {
  return requests
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateMedicalRequest(id, changes) {
  requests = requests.map((request) => request.id === id ? { ...request, ...changes } : request)
  notify()
}
