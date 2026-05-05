import { useEffect, useState } from "react"
import type { ExportJobStatus, ExportSettings, ExportTaskPhoto } from "@/types/domain"
import { getExportJobStatus, startExportJob } from "@/lib/persistence"

const POLL_MS = 700

let currentJobId: string | null = null
let currentStatus: ExportJobStatus | null = null
const listeners = new Set<() => void>()

const notify = (): void => {
  for (const listener of listeners) {
    listener()
  }
}

const refreshStatus = async (): Promise<void> => {
  if (!currentJobId) return
  const next = await getExportJobStatus(currentJobId)
  currentStatus = next
  notify()
}

export const useExportMonitor = () => {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((v) => v + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  useEffect(() => {
    if (!currentJobId || !currentStatus?.running) return
    const id = window.setInterval(() => {
      void refreshStatus()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [currentStatus?.running])

  const start = async (photos: ExportTaskPhoto[], settings: ExportSettings): Promise<void> => {
    currentJobId = await startExportJob(photos, settings)
    await refreshStatus()
  }

  const close = (): void => {
    currentJobId = null
    currentStatus = null
    notify()
  }

  return {
    status: currentStatus,
    isVisible: currentStatus !== null,
    isRunning: currentStatus?.running ?? false,
    isFinished: currentStatus?.finished ?? false,
    start,
    refresh: refreshStatus,
    close,
  }
}
