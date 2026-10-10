import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.js'
import labSessionRoutes from './routes/labSessions.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/lab-sessions', labSessionRoutes)

app.use((error, req, res, next) => {
  console.error(error)
  if (error.name === 'ValidationError') {
    res.status(400).json({ message: 'Validation failed.', errors: Object.values(error.errors).map((item) => item.message) })
    return
  }
  res.status(error.status || 500).json({ message: error.status ? error.message : 'An unexpected server error occurred.', ...(error.details ? { errors: error.details } : {}) })
})

export default app
