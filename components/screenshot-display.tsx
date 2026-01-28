'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface ScreenshotDisplayProps {
  screenshot: string
  alt?: string
}

export function ScreenshotDisplay({ screenshot, alt = 'Website screenshot' }: ScreenshotDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const isBase64 = !screenshot.startsWith('/')
  const imageSrc = isBase64 ? `data:image/png;base64,${screenshot}` : screenshot

  return (
    <>
      {/* Inline thumbnail with click handler */}
      <div
        onClick={() => setIsOpen(true)}
        className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-white cursor-pointer group hover:shadow-lg transition-shadow"
      >
        {!imageLoaded && (
          <div className="flex items-center justify-center h-64 bg-slate-100">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-auto transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
        {/* Hover overlay to indicate clickability */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
            Click to zoom
          </span>
        </div>
      </div>

      {/* Zoom modal dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl w-full p-0 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Website Screenshot - Full Size</DialogTitle>
          <div className="relative w-full">
            <img
              src={imageSrc}
              alt={alt}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
