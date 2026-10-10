let sessions = [
  {
    id: 'hci-usability-testing',
    title: 'Usability Testing Lab',
    subject: 'Human Computer Interaction',
    date: '2026-10-13',
    room: 'Lab 3A',
    time: '09:00 - 11:00',
    lecturer: 'Dr. Fernando',
    students: [
      { id: 'STU-2026-014', name: 'Sofia Perera', status: 'Present', note: '' },
      { id: 'STU-2026-021', name: 'Noah Williams', status: 'Late', note: 'Arrived 15 minutes after the start.' },
      { id: 'STU-2026-034', name: 'Amara Silva', status: 'Present', note: '' },
      { id: 'STU-2026-047', name: 'Liam Fernando', status: 'Excused', note: 'Medical request approved.' },
      { id: 'STU-2026-052', name: 'Maya Chen', status: 'Absent', note: '' },
    ],
    recorded: false,
  },
  {
    id: 'database-query-workshop',
    title: 'Query Optimisation Workshop',
    subject: 'Database Systems',
    date: '2026-10-16',
    room: 'Lab 2B',
    time: '14:00 - 16:00',
    lecturer: 'Dr. Fernando',
    students: [
      { id: 'STU-2026-008', name: 'Ethan Jayasuriya', status: 'Present', note: '' },
      { id: 'STU-2026-019', name: 'Aisha Rahman', status: 'Present', note: '' },
      { id: 'STU-2026-026', name: 'Daniel Perera', status: 'Present', note: '' },
      { id: 'STU-2026-039', name: 'Priya Nair', status: 'Present', note: '' },
    ],
    recorded: false,
  },
  {
    id: 'software-testing-basics',
    title: 'Test Case Design',
    subject: 'Software Engineering',
    date: '2026-09-29',
    room: 'Software Lab',
    time: '10:00 - 12:00',
    lecturer: 'Dr. Fernando',
    students: [
      { id: 'STU-2026-011', name: 'Sofia Perera', status: 'Present', note: '' },
      { id: 'STU-2026-018', name: 'Noah Williams', status: 'Present', note: '' },
      { id: 'STU-2026-031', name: 'Amara Silva', status: 'Absent', note: 'No notice received.' },
    ],
    recorded: true,
  },
  {
    id: 'network-lab-orientation',
    title: 'Network Lab Orientation',
    subject: 'Network Design',
    date: '2026-10-21',
    room: 'Network Lab',
    time: '10:00 - 12:00',
    lecturer: 'Dr. Fernando',
    students: [],
    recorded: false,
  },
]

const listeners = new Set()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getAttendanceSessions() {
  return sessions
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function updateAttendance(id, students) {
  sessions = sessions.map((session) => session.id === id ? { ...session, students, recorded: true } : session)
  notify()
}
