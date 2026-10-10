import 'dotenv/config'
import app from './app.js'
import { connectDatabase } from './config/db.js'

const port = Number(process.env.PORT) || 5000

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured. Add it to backend/.env before starting the server.')
}

await connectDatabase()
app.listen(port, () => {
  console.log(`LabTrack API listening on port ${port}`)
})
