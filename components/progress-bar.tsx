'use client'

interface ProgressBarProps {
  percent: number
  message: string
}

export function ProgressBar({ percent, message }: ProgressBarProps) {
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="text-slate-700 font-medium">{message}</span>
        <span className="text-slate-600">{percent}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-blue-600 h-full transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
