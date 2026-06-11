export type BackendVideoFormat = {
  format_id: string
  ext: string
  width?: number
  height?: number
  resolution?: string
  fps?: number
  vcodec?: string
  filesize?: number
  filesize_approx?: number
  bitrate?: number
  url?: string
}

export type BackendAudioFormat = {
  format_id: string
  ext: string
  acodec?: string
  abr?: number
  asr?: number
  filesize?: number
  filesize_approx?: number
  audioQuality?: string
  url?: string
}

export type BackendMetadata = {
  id: string
  title: string
  description?: string
  channel?: string
  uploader?: string
  uploader_id?: string
  channel_id?: string
  view_count?: number
  duration?: number
  upload_date?: string
  thumbnail?: string
  webpage_url: string
  videoFormats: BackendVideoFormat[]
  audioFormats: BackendAudioFormat[]
}
