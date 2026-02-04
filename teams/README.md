# Ceker Teams Bot

Microsoft Teams bot for Ceker - link checker service.

## Commands

- `/analyze <domain>` - Check if a website is legitimate
- `/cti-report <token> <domain>` - Get CTI report for a domain

## Setup

### 1. Install Dependencies

```bash
cd teams
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `MicrosoftAppId` | Microsoft Azure AD App ID |
| `MicrosoftAppPassword` | Microsoft Azure AD App Client Secret |
| `PORT` | Bot server port (default: 3978) |
| `BOT_ENDPOINT_URL` | Public URL of your bot (e.g., https://yourdomain.com/teams) |
| `CHECK_API_URL` | URL to main app's sync endpoint (e.g., http://localhost:3000/api/check-website-sync) |
| `BOT_API_KEY` | Secret key for bot authentication with main app |
| `CTI_API_URL` | External CTI API URL for reports |

### 3. Get Microsoft App Credentials

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **App registrations**
3. Click **New registration**
4. Enter a name (e.g., "Ceker Bot")
5. Select supported account types
6. Click **Register**
7. Copy the **Application (client) ID** as `MicrosoftAppId`
8. Go to **Certificates & secrets**
9. Click **New client secret**
10. Copy the secret value as `MicrosoftAppPassword`

### 4. Create Bot Framework Resource

1. Go to [Azure Portal](https://portal.azure.com/)
2. Search for **Azure Bot**
3. Click **Create**
4. Select your existing app or create a new one
5. Configure the bot with the endpoint URL: `https://your-domain.com/api/messages`
6. Enable **Microsoft Teams** channel
7. Note down the bot's handle/name

### 5. Create Teams App Package (Optional)

For sideloading in Teams:

1. Install [Developer Portal](https://dev.teams.microsoft.com/) app in Teams
2. Create a new app
3. Configure app manifest with your bot details
4. Download the app package
5. Sideload to your Teams organization

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm run start:dist
```

Or directly with ts-node:

```bash
npm start
```

The bot will start on port 3978 (or configured PORT).

## Health Check

```bash
curl http://localhost:3978/health
```

## Docker Deployment

Example Dockerfile for the bot service:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3978

CMD ["npm", "run", "start:dist"]
```

## Main App Integration

The main app needs the `BOT_API_KEY` environment variable set to allow the bot to access the `/api/check-website-sync` endpoint.

Add to main app's `.env`:

```
BOT_API_KEY=your-secret-bot-api-key
```

## Troubleshooting

### Bot not responding in Teams

- Check Azure Bot service is running
- Verify the messaging endpoint URL is correct
- Check `MicrosoftAppId` and `MicrosoftAppPassword` are correct
- Review bot server logs

### "Unauthorized" error from analyze command

- Verify `BOT_API_KEY` matches between bot and main app
- Check main app is running and accessible
- Verify `CHECK_API_URL` is correct

### CTI Report not working

- Verify `CTI_API_URL` is set correctly
- Check token being passed is valid
- Review CTI API documentation for correct format
