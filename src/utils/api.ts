import type { BackendMetadata } from "./types"

export const getBackendUrl = () => {
  return window.location.origin
}

export const fetchVideoMetadata = async (youtubeId: string): Promise<BackendMetadata> => {
  const response = await fetch(`${getBackendUrl()}/api/get-metadata`, {
    method: "GET",
    headers: {
      youtubeid: youtubeId,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown Server Error" }))
    throw new Error(errorData.error || `Server-Error: ${response.status}`)
  }

  const data = await response.json()

  if (!data?.success || !data?.metadata) {
    throw new Error("Metadata response was incomplete")
  }

  return data.metadata as BackendMetadata
}


export type DownloadStatus = {
  status: "queued" | "starting" | "downloading" | "converting" | "completed" | "failed"
  progress: number
  message: string
  downloadUrl?: string
  error?: string
}

export const downloadMediaFile = async (
  youtubeId: string,
  videoId: string,
  audioId: string,
  onStatus: (status: DownloadStatus) => void,
) => {
  const response = await fetch(`${getBackendUrl()}/api/downloads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      youtubeId,
      videoId,
      audioId,
    }),
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.success || typeof data.jobId !== "string") {
    throw new Error(data?.error || `Server-Error: ${response.status}`)
  }

  const eventSource = new EventSource(
    `${getBackendUrl()}/api/downloads/${encodeURIComponent(data.jobId)}/events`,
  )

  return new Promise<void>((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      eventSource.close()
    }

    eventSource.addEventListener("status", (event) => {
      let status: DownloadStatus

      try {
        status = JSON.parse(event.data) as DownloadStatus
      } catch {
        cleanup()
        reject(new Error("Ungültige Statusantwort vom Server"))
        return
      }

      onStatus(status)

      if (status.status === "completed" && status.downloadUrl) {
        settled = true
        cleanup()
        window.location.href = `${getBackendUrl()}${status.downloadUrl}`
        resolve()
      } else if (status.status === "failed") {
        settled = true
        cleanup()
        reject(new Error(status.error || status.message || "Download fehlgeschlagen"))
      }
    })

    eventSource.onerror = () => {
      if (!settled) {
        cleanup()
        reject(new Error("Die Verbindung zum Download-Status wurde unterbrochen"))
      }
    }
  })
}
