import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ message: 'An unexpected server error occurred.' })
})

export default app
