import { captureScreenshot } from '@/lib/external/browserless'
import { saveScreenshot } from '@/lib/shared/storage'
import { getScreenshotPathByHash, addHashToGlobalCache, updateScreenshotPath } from '@/lib/repo/safebrowsing-cache'

export async function getOrFetchScreenshot(url: string, hash: string): Promise<string | null> {
  const cachedPath = await getScreenshotPathByHash(hash)
  if (cachedPath) {
    console.log(`[getOrFetchScreenshot][${url}] Found screenshot in cache!`);
    return cachedPath
  }

  const base64Screenshot = await captureScreenshot(url)
  if (!base64Screenshot) {
    return null
  }

  const screenshotPath = await saveScreenshot(base64Screenshot, hash)

  await addHashToGlobalCache(hash)
  await updateScreenshotPath(hash, screenshotPath)

  return screenshotPath
}
