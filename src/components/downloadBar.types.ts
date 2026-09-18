import type {
  BackendAudioFormat,
  BackendVideoFormat,
} from "../utils/types"

export type DropdownOption = {
  label: string
  value: string
}

export type VideoInfo = {
  title: string
  channel: string
  views: string
  duration: string
  thumbnail?: string
}

export type DownloadFormats = {
  video: BackendVideoFormat[]
  audio: BackendAudioFormat[]
}