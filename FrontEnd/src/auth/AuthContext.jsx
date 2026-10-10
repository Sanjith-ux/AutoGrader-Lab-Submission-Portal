import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './context.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'
const TOKEN_KEY = 'labtrack_token'
const USER_KEY = 'labtrack_user'

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.errors?.join(' ') || data.message || 'The request could not be completed.'
    throw new Error(message)
  }
  return data
}

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    })
  } catch {
    throw new Error('Unable to connect to LabTrack. Check that the backend is running.')
  }
  return parseResponse(response)
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(USER_KEY)
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let isCurrent = true
    request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(({ user: currentUser }) => {
        if (!isCurrent) return
        setUser(currentUser)
        localStorage.setItem(USER_KEY, JSON.stringify(currentUser))
      })
      .catch(() => {
        if (!isCurrent) return
        clearSession()
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [token])

  async function login(credentials) {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
    saveSession(result.token, result.user)
    setToken(result.token)
    setUser(result.user)
    return result.user
  }

  async function register(details) {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(details),
    })
  }

  function logout() {
    clearSession()
    setToken(null)
    setUser(null)
  }

  const value = useMemo(() => ({ token, user, isLoading, login, register, logout }), [token, user, isLoading])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
