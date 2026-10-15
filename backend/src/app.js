import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.js'
import labSessionRoutes from './routes/labSessions.js'
import assignmentRoutes from './routes/assignments.js'
import { errorHandler, notFound } from './middleware/errorHandler.js'
import { getAllowedOrigins, securityHeaders } from './middleware/security.js'

const app = express()

app.disable('x-powered-by')
app.use(securityHeaders)
app.use(cors({ origin: getAllowedOrigins() }))
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/lab-sessions', labSessionRoutes)
app.use('/api/assignments', assignmentRoutes)

app.use('/api', notFound)
app.use(errorHandler)

export default app
