import { CloudAdapter, ConfigurationServiceClientCredentialFactory, ConfigurationBotFrameworkAuthentication } from 'botbuilder'

console.log('[Bot Auth] MicrosoftAppId:', process.env.MicrosoftAppId ? 'Loaded' : 'MISSING')
console.log('[Bot Auth] MicrosoftAppPassword:', process.env.MicrosoftAppPassword ? 'Loaded' : 'MISSING')

// Create credential factory
const credentialFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MicrosoftAppId,
  MicrosoftAppPassword: process.env.MicrosoftAppPassword
})

// Create authentication with credential factory
const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(credentialFactory)

// Create the CloudAdapter
export const adapter = new CloudAdapter(botFrameworkAuthentication)

// Log adapter state
console.log('[Bot] CloudAdapter created successfully')

// Handle errors
adapter.onTurnError = async (context, error) => {
  console.error('[Bot Error]', error)
  await context.sendActivity('The bot encountered an error or bug.')
  await context.sendActivity('To continue to run this bot, please fix the bot source code.')
}
