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


export const downloadMediaFile = async (youtubeId: string, videoId: string, audioId: string): Promise<void> => {

    console.log(`YOUTUBEID: ${youtubeId}`)
    console.log(`VIDEOID: ${videoId}`)
    console.log(`AUDIOID: ${audioId}`)

  try {
    const response = await fetch(`${getBackendUrl()}/api/download-media`, {
      method: 'GET',
      headers: {
        'youtubeid': youtubeId,
        'videoid': videoId,
        'audioid': audioId,
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown Server Error' }))
      throw new Error(errorData.error || `Server-Error: ${response.status}`)
    }

    const blob = await response.blob()

    const contentDisposition = response.headers.get('content-disposition')
    
    let filename = ''

    if (videoId === "0") {
        filename = 'Grabberty-download.mp3'
    } else if (audioId === "0") {
        filename = 'Grabberty-download.mp4'
    } else {
        filename = 'Grabberty-download.mp4'
    }

    if (contentDisposition && contentDisposition.includes('filename=')) {
      filename = contentDisposition.split('filename=')[1].replaceAll('"', '')
    }

    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()

    link.remove()
    window.URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Error by running download:', error)
    throw error
  }
}
