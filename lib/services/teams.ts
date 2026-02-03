type RiskLevel = 'LEGITIMATE' | 'SUSPICIOUS' | 'WARNING'

interface CheckResult {
  riskLevel: RiskLevel
  message: string
  details: string[]
  screenshotPath?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'

export async function sendTeamsNotification(result: CheckResult, url: string): Promise<void> {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL

  if (!webhookUrl) {
    console.log('Teams webhook URL not configured, skipping notification')
    return
  }

  const statusColor = result.riskLevel === 'LEGITIMATE' ? 'Good' : result.riskLevel === 'WARNING' ? 'Attention' : 'Warning'
  const statusText = result.riskLevel

  const card = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        contentUrl: null,
        content: {
          type: 'AdaptiveCard',
          body: [
            {
              type: 'TextBlock',
              text: 'Website Check Complete',
              weight: 'Bolder',
              size: 'Large'
            },
            {
              type: 'TextBlock',
              text: `URL: ${url}`,
              wrap: true
            },
            {
              type: 'TextBlock',
              text: `Status: ${statusText}`,
              color: statusColor,
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: `Verdict: ${result.message}`,
              wrap: true
            },
            ...(result.screenshotPath ? [
              {
                type: 'Image',
                url: `${BASE_URL}${result.screenshotPath}`,
                size: 'Large'
              }
            ] : []),
            {
              type: 'TextBlock',
              text: 'Details:',
              weight: 'Bolder',
              size: 'Medium'
            },
            {
              type: 'TextBlock',
              text: result.details.join('\n\n'),
              wrap: true
            }
          ],
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.4'
        }
      }
    ]
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(card)
    })

    if (!response.ok) {
      console.error('Teams webhook returned error:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Failed to send Teams notification:', error)
  }
}
