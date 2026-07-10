import 'dotenv/config'
import { createApp } from './routes.js'

const PORT = Number(process.env.PORT || 3001)
const app = createApp()

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NinjaParent API listening on http://localhost:${PORT}`)
  console.log(`Gmail OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT configured'}`)
  console.log(`Outlook OAuth: ${process.env.MICROSOFT_CLIENT_ID ? 'configured' : 'NOT configured'}`)
})
