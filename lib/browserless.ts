export async function captureScreenshot(url: string): Promise<string | null> {
    const token = process.env.BROWSERLESS_API_TOKEN
    if (!token) {
        console.log('BROWSERLESS_API_TOKEN not set, skipping screenshot')
        return null
    }

    const apiUrl = `https://production-sfo.browserless.io/screenshot?token=${token}`

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                options: {
                    type: 'webp',
                    fullPage: false,
                    omitBackground: false,
                },
            }),
        })

        if (!response.ok) {
            console.error('Screenshot API error:', response.status, response.statusText)
            return null
        }

        const buffer = await response.arrayBuffer()
        return Buffer.from(buffer).toString('base64')
    } catch (error) {
        console.error('Screenshot capture failed:', error)
        return null
    }
}