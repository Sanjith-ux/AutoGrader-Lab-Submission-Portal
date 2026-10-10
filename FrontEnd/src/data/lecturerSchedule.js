let sessions = [
  {
    id: 'hci-usability-testing',
    title: 'Usability Testing Lab',
    subject: 'Human Computer Interaction',
    date: '2026-10-13',
    startTime: '09:00',
    endTime: '11:00',
    room: 'Lab 3A',
    instructor: 'Dr. Fernando',
    capacity: 30,
    enrolled: 28,
    materials: 'Bring your observation worksheet and laptop.',
    safetyNotes: 'Keep walkways clear and secure all cables before testing.',
    status: 'Upcoming',
  },
  {
    id: 'database-query-workshop',
    title: 'Query Optimisation Workshop',
    subject: 'Database Systems',
    date: '2026-10-16',
    startTime: '14:00',
    endTime: '16:00',
    room: 'Lab 2B',
    instructor: 'Dr. Fernando',
    capacity: 26,
    enrolled: 24,
    materials: 'Bring the query worksheet and database client installed.',
    safetyNotes: 'Log out of shared workstations at the end of the session.',
    status: 'Upcoming',
  },
  {
    id: 'software-testing-basics',
    title: 'Test Case Design',
    subject: 'Software Engineering',
    date: '2026-09-29',
    startTime: '10:00',
    endTime: '12:00',
    room: 'Software Lab',
    instructor: 'Dr. Fernando',
    capacity: 30,
    enrolled: 25,
    materials: 'Bring your completed requirements checklist.',
    safetyNotes: 'Use only the assigned test environment for practical work.',
    status: 'Completed',
  },
  {
    id: 'network-equipment-practical',
    title: 'Network Equipment Practical',
    subject: 'Network Design',
    date: '2026-09-24',
    startTime: '13:00',
    endTime: '15:00',
    room: 'Network Lab',
    instructor: 'Dr. Fernando',
    capacity: 24,
    enrolled: 21,
    materials: 'Bring your topology diagram and lab notebook.',
    safetyNotes: 'Switch off equipment before changing any cable connections.',
    status: 'Cancelled',
  },
]

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getSessions() {
  return sessions
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function createSession(session) {
  const created = { ...session, id: `session-${Date.now()}`, instructor: 'Dr. Fernando', enrolled: 0 }
  sessions = [created, ...sessions]
  notify()
  return created
}

export function updateSession(id, changes) {
  sessions = sessions.map((session) => session.id === id ? { ...session, ...changes } : session)
  notify()
}

export function deleteSession(id) {
  sessions = sessions.filter((session) => session.id !== id)
  notify()
}
