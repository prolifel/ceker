import 'dotenv/config'
import express from 'express'
import { CekerBot } from './bot.js'
import { adapter } from './adapter.js'

const PORT = process.env.PORT || 3978
const app = express()

// Parse JSON bodies
app.use(express.json())

// Create the bot
const bot = new CekerBot()

// Bot endpoint
app.post('/api/messages', async (req, res) => {
  try {
    await adapter.process(req, res, async (context) => {
      await bot.run(context)
    })
  } catch (error) {
    console.error('[Server Error]', error)
    res.status(500).send('Server error')
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ceker-teams-bot' })
})

// Start server
app.listen(PORT, () => {
  console.log(`Ceker Teams Bot listening on port ${PORT}`)
  console.log(`Endpoint: http://localhost:${PORT}/api/messages`)
})
