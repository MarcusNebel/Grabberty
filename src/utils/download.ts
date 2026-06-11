export const extractYoutubeId = (url: string): string => {
  const trimmedUrl = url.trim()

  if (!trimmedUrl) {
    return ""
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern)
    if (match?.[1]) {
      return match[1]
    }
  }

  return ""
}

export type BackendVideoFormat = {
  format_id: string
  ext: string
  height?: number
  resolution?: string
  filesize?: number
  filesize_approx?: number
  bitrate?: number
}

export type BackendAudioFormat = {
  format_id: string
  ext: string
  abr?: number
  acodec?: string
  filesize?: number
  filesize_approx?: number
}

export type BackendMetadata = {
  id: string
  title: string
  channel?: string
  uploader?: string
  view_count?: number
  duration?: number
  thumbnail?: string
  videoFormats: BackendVideoFormat[]
  audioFormats: BackendAudioFormat[]
}

export const fetchVideoMetadata = async (youtubeId: string): Promise<BackendMetadata> => {
  const response = await fetch(`/api/get-metadata`, {
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

export const downloadMediaFile = async (
  youtubeId: string,
  videoId: string,
  audioId: string
): Promise<void> => {
  try {
    const response = await fetch(`/api/download-media`, {
      method: "GET",
      headers: {
        youtubeid: youtubeId,
        videoid: videoId,
        audioid: audioId,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown Server Error" }))
      throw new Error(errorData.error || `Server-Error: ${response.status}`)
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get("content-disposition")

    let filename = "Grabberty-download.mp4"

    if (videoId === "0") {
      filename = "Grabberty-download.mp3"
    } else if (audioId === "0") {
      filename = "Grabberty-download.mp4"
    }

    if (contentDisposition && contentDisposition.includes("filename=")) {
      filename = contentDisposition.split("filename=")[1].replaceAll('"', "")
    }

    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()

    link.remove()
    window.URL.revokeObjectURL(downloadUrl)
  } catch (error) {
    console.error("Error by running download:", error)
    throw error
  }
}
