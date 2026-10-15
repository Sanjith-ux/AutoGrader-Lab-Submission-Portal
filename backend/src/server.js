import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/db.js'

const port = Number(process.env.PORT) || 5001

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured. Add it to backend/.env before starting the server.')
}
if (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace-this')) {
  console.warn('Warning: JWT_SECRET is short or still the example value. Use a long random secret.')
}

await connectDatabase()
app.listen(port, () => {
  console.log(`LabTrack API listening on port ${port}`)
})
