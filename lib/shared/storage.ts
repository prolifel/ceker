import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { sha256 } from './hash'

const SCREENSHOTS_DIR = join(process.cwd(), 'public', 'screenshots')

export async function saveScreenshot(base64Data: string, hash: string): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64')
  const filename = `${hash}.png`
  const filepath = join(SCREENSHOTS_DIR, filename)

  try {
    await mkdir(SCREENSHOTS_DIR, { recursive: true })
    await writeFile(filepath, buffer)
    return `/api/screenshots/${filename}`
  } catch (error) {
    console.error('Failed to save screenshot:', error)
    throw error
  }
}
