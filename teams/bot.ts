import { ActivityHandler, MessageFactory, TurnContext } from 'botbuilder'
import axios from 'axios'

const CHECK_API_URL = process.env.CHECK_API_URL || 'http://localhost:3000/api/check-website-sync'
const BOT_API_KEY = process.env.BOT_API_KEY || ''
const CTI_API_URL = process.env.CTI_API_URL || ''

type RiskLevel = 'LEGITIMATE' | 'SUSPICIOUS' | 'WARNING'

interface CheckResult {
  riskLevel: RiskLevel
  message: string
  details: string[]
  screenshotPath?: string
}

interface CtiReport {
  domain: string
  token: string
  // CTI report structure will depend on your API
  [key: string]: any
}

export class CekerBot extends ActivityHandler {
  constructor() {
    super()

    // Handle message activities
    this.onMessage(async (context, next) => {
      const text = (context.activity.text || '').trim()

      if (!text) {
        await context.sendActivity("Hello! I'm Ceker Bot. Available commands:\n\n• `/analyze <domain>` - Check if a website is legitimate\n• `/cti-report <token> <domain>` - Get CTI report for a domain")
        return
      }

      await this.handleCommand(context, text)
      await next()
    })

    // Handle members added event
    this.onMembersAdded(async (context) => {
      const membersAdded = context.activity.membersAdded
      if (membersAdded) {
        for (const member of membersAdded) {
          if (member.id !== context.activity.recipient?.id) {
            await context.sendActivity("Hello! I'm Ceker Bot. Available commands:\n\n• `/analyze <domain>` - Check if a website is legitimate\n• `/cti-report <token> <domain>` - Get CTI report for a domain")
          }
        }
      }
    })
  }

  private async handleCommand(context: TurnContext, text: string): Promise<void> {
    const lowerText = text.toLowerCase()

    if (lowerText.startsWith('/analyze ')) {
      await this.handleAnalyze(context, text.substring(9))
    } else if (lowerText.startsWith('/cti-report ')) {
      await this.handleCtiReport(context, text.substring(12))
    } else if (lowerText === '/analyze') {
      await context.sendActivity('Usage: `/analyze <domain>`\nExample: `/analyze example.com`')
    } else if (lowerText === '/cti-report') {
      await context.sendActivity('Usage: `/cti-report <token> <domain>`\nExample: `/cti-report mysecret123 example.com`')
    } else if (lowerText.startsWith('/')) {
      await context.sendActivity('Unknown command. Available commands:\n\n• `/analyze <domain>` - Check if a website is legitimate\n• `/cti-report <token> <domain>` - Get CTI report for a domain')
    } else {
      await context.sendActivity(`Hello! I'm Ceker Bot. Use commands to interact:\n\n• \`/analyze <domain>\` - Check if a website is legitimate\n• \`/cti-report <token> <domain>\` - Get CTI report`)
    }
  }

  private async handleAnalyze(context: TurnContext, domainInput: string): Promise<void> {
    const domain = domainInput.trim()

    if (!domain) {
      await context.sendActivity('Please provide a domain.\nUsage: `/analyze <domain>`')
      return
    }

    // Send typing indicator
    await context.sendActivity({ type: 'typing' })

    try {
      const response = await axios.post(CHECK_API_URL, { url: domain }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BOT_API_KEY
        },
        timeout: 60000 // 60 seconds timeout
      })

      const result: CheckResult = response.data
      await this.sendCheckResult(context, result, domain)
    } catch (error) {
      console.error('[Analyze Error]', error)
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message
        await context.sendActivity(`Failed to analyze domain: ${message}`)
      } else {
        await context.sendActivity('Failed to analyze domain. Please try again later.')
      }
    }
  }

  private async handleCtiReport(context: TurnContext, params: string): Promise<void> {
    const parts = params.trim().split(/\s+/)

    if (parts.length < 2) {
      await context.sendActivity('Please provide both token and domain.\nUsage: `/cti-report <token> <domain>`')
      return
    }

    const [token, domain] = parts

    // Send typing indicator
    await context.sendActivity({ type: 'typing' })

    try {
      // Call external CTI API
      const response = await axios.get(CTI_API_URL, {
        params: { domain, token },
        timeout: 30000
      })

      const report = response.data
      await this.sendCtiReport(context, report, domain)
    } catch (error) {
      console.error('[CTI Report Error]', error)
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.message
        await context.sendActivity(`Failed to get CTI report: ${message}`)
      } else {
        await context.sendActivity('Failed to get CTI report. Please try again later.')
      }
    }
  }

  private async sendCheckResult(context: TurnContext, result: CheckResult, domain: string): Promise<void> {
    const emoji = result.riskLevel === 'LEGITIMATE' ? '✅' : result.riskLevel === 'WARNING' ? '🔴' : '⚠️'
    const color = result.riskLevel === 'LEGITIMATE' ? 'Good' : result.riskLevel === 'WARNING' ? 'Attention' : 'Warning'

    let message = `${emoji} **${domain}**\n\n`
    message += `**Risk Level:** ${result.riskLevel}\n`
    message += `**Verdict:** ${result.message}\n\n`
    message += '**Details:**\n'

    for (const detail of result.details) {
      message += `• ${detail}\n`
    }

    if (result.screenshotPath) {
      const baseUrl = process.env.APP_URL || 'http://localhost:3000'
      message += `\n📸 [View Screenshot](${baseUrl}${result.screenshotPath})`
    }

    await context.sendActivity(message)
  }

  private async sendCtiReport(context: TurnContext, report: any, domain: string): Promise<void> {
    let message = `📊 **CTI Report for ${domain}**\n\n`

    // Format the CTI report - adjust based on your actual CTI API response
    if (report.threat_level) {
      message += `**Threat Level:** ${report.threat_level}\n`
    }
    if (report.score !== undefined) {
      message += `**Score:** ${report.score}\n`
    }
    if (report.last_analyzed) {
      message += `**Last Analyzed:** ${report.last_analyzed}\n`
    }
    if (report.findings && Array.isArray(report.findings)) {
      message += '\n**Findings:**\n'
      for (const finding of report.findings) {
        message += `• ${finding}\n`
      }
    }

    // If the report structure is different, just dump it nicely
    if (!report.threat_level && !report.score) {
      message += '```json\n' + JSON.stringify(report, null, 2) + '\n```'
    }

    await context.sendActivity(message)
  }
}
