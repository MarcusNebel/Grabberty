import type {
  BackendAudioFormat,
  BackendMetadata,
  BackendVideoFormat,
} from "../utils/types"
import type { DropdownOption, VideoInfo } from "./downloadBar.types"

export const formatDuration = (durationSeconds?: number): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return "--:--"
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = Math.floor(durationSeconds % 60)

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return "—"

  const gigabytes = bytes / (1024 ** 3)
  const megabytes = bytes / (1024 ** 2)
  const kilobytes = bytes / 1024

  if (gigabytes >= 1) return `${gigabytes.toFixed(2)} GB`
  if (megabytes >= 1) return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
  return `${kilobytes.toFixed(0)} KB`
}

export const getEstimatedFinalFileSize = (
  videoFormats: BackendVideoFormat[],
  audioFormats: BackendAudioFormat[],
  videoId: string,
  audioId: string
): number | undefined => {
  const video = videoFormats.find((format) => format.format_id === videoId)
  const audio = audioFormats.find((format) => format.format_id === audioId)

  const videoSize = video?.filesize ?? video?.filesize_approx ?? 0
  const audioSize = audio?.filesize ?? audio?.filesize_approx ?? 0

  return videoSize + audioSize || undefined
}

export const getOutputFormat = (videoId: string, audioId: string): string => {
  const videoSkipped = videoId === "0"
  const audioSkipped = audioId === "0"

  if (videoSkipped && audioSkipped) return "—"
  if (videoSkipped) return "MP3"
  return "MP4"
}

export const buildVideoOptions = (
  formats: BackendVideoFormat[]
): DropdownOption[] => {
  const seenQualities = new Set<string>()
  const options: DropdownOption[] = [{ label: "Skip Video", value: "0" }]

  options.push(
    ...[...formats]
      .sort((left, right) => (right.height ?? 0) - (left.height ?? 0))
      .filter((format) => {
        const quality = format.height ? `${format.height}p` : format.resolution ?? "unknown"

        if (seenQualities.has(quality)) return false
        seenQualities.add(quality)
        return true
      })
      .map((format) => ({
        label: format.height ? `${format.height}p` : format.resolution ?? "unknown",
        value: format.format_id,
      }))
  )

  return options
}

export const buildAudioOptions = (
  formats: BackendAudioFormat[]
): DropdownOption[] => {
  const seenSampleRates = new Set<string>()
  const options: DropdownOption[] = [{ label: "Skip Audio", value: "0" }]

  options.push(
    ...[...formats]
      .sort((left, right) => (right.abr ?? 0) - (left.abr ?? 0))
      .filter((format) => {
        const sampleRate = format.asr ? `${format.asr}Hz` : "unknown"

        if (seenSampleRates.has(sampleRate)) return false
        seenSampleRates.add(sampleRate)
        return true
      })
      .map((format) => ({
        label: format.asr ? `${format.asr}Hz` : "unknown",
        value: format.format_id,
      }))
  )

  return options
}

export const getDefaultOption = (options: DropdownOption[]): string =>
  options.find((option) => option.value !== "0")?.value ?? options[0]?.value ?? ""

export const buildVideoInfo = (metadata: BackendMetadata): VideoInfo => ({
  title: metadata.title,
  channel: metadata.channel ?? metadata.uploader ?? "Unknown channel",
  views: metadata.view_count
    ? `${metadata.view_count.toLocaleString()} views`
    : "Views unavailable",
  duration: formatDuration(metadata.duration),
  thumbnail: metadata.thumbnail,
})