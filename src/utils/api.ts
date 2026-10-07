import type { BackendMetadata } from "./types"

const getBackendUrl = () => {
  const hostname = window.location.hostname
  const port = window.location.port
  
  // Prüfe ob es eine IP-Adresse ist (IPv4)
  const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)
  
  if (isIP) {
    return `http://${hostname}:${port}`
  } else {
    return `http://${hostname}`
  }
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


export const downloadMediaFile = async (youtubeId: string, videoId: string, audioId: string) => {
    console.log(`YOUTUBEID: ${youtubeId}`)
    console.log(`VIDEOID: ${videoId}`)
    console.log(`AUDIOID: ${audioId}`)

  const params = new URLSearchParams({
    youtubeid: youtubeId,
    videoid: videoId,
    audioid: audioId,
  })

  const downloadUrl = `${getBackendUrl()}/api/download-media?${params.toString()}`

  window.location.href = downloadUrl
}
