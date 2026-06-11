import { useEffect, useRef, useState } from "react"
import icon from "../assets/Grabberty_Logo.svg"
import type {
  BackendAudioFormat,
  BackendMetadata,
  BackendVideoFormat,
} from "../utils/types"
import {
  extractYoutubeId,
  fetchVideoMetadata,
  downloadMediaFile,
} from "../utils/download"

type DropdownOption = {
  label: string
  value: string
}

type VideoInfo = {
  title: string
  channel: string
  views: string
  duration: string
  format: string
  fileSize: string
  thumbnail?: string
}

const formatDuration = (durationSeconds?: number): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return "--:--"
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = Math.floor(durationSeconds % 60)

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) {
    return "Size unavailable"
  }

  const megabytes = bytes / (1024 * 1024)

  if (megabytes >= 1) {
    return `${megabytes.toFixed(megabytes >= 10 ? 0 : 1)} MB`
  }

  const kilobytes = bytes / 1024
  return `${kilobytes.toFixed(kilobytes >= 10 ? 0 : 1)} KB`
}

const buildVideoOptions = (formats: BackendVideoFormat[]): DropdownOption[] => {
  const seen = new Set<string>()
  
  const options: DropdownOption[] = [
    {
      label: "Skip Video",
      value: "0",
    },
  ]

  options.push(
    ...[...formats]
      .sort((left, right) => (right.height ?? 0) - (left.height ?? 0))
      .filter((format) => {
        const qualityLabel = format.height ? `${format.height}p` : format.resolution ?? "unknown"
        
        if (seen.has(qualityLabel)) {
          return false
        }
        
        seen.add(qualityLabel)
        return true
      })
      .map((format) => {
        const qualityLabel = format.height ? `${format.height}p` : format.resolution ?? "unknown"

        return {
          label: qualityLabel,
          value: format.format_id,
        }
      })
  )

  return options
}

const buildAudioOptions = (formats: BackendAudioFormat[]): DropdownOption[] => {
  const seen = new Set<string>()
  
  const options: DropdownOption[] = [
    {
      label: "Skip Audio",
      value: "0",
    },
  ]

  options.push(
    ...[...formats]
      .sort((left, right) => (right.abr ?? 0) - (left.abr ?? 0))
      .filter((format) => {
        const sampleRateLabel = format.asr ? `${format.asr}Hz` : "unknown"
        
        if (seen.has(sampleRateLabel)) {
          return false
        }
        
        seen.add(sampleRateLabel)
        return true
      })
      .map((format) => {
        const sampleRateLabel = format.asr ? `${format.asr}Hz` : "unknown"

        return {
          label: sampleRateLabel,
          value: format.format_id,
        }
      })
  )

  return options
}

const buildVideoInfo = (metadata: BackendMetadata): VideoInfo => ({
  title: metadata.title,
  channel: metadata.channel ?? metadata.uploader ?? "Unknown channel",
  views: metadata.view_count ? `${metadata.view_count.toLocaleString()} views` : "Views unavailable",
  duration: formatDuration(metadata.duration),
  format: metadata.videoFormats[0]?.ext?.toUpperCase() ?? "MP4",
  fileSize: formatFileSize(metadata.videoFormats[0]?.filesize ?? metadata.videoFormats[0]?.filesize_approx),
  thumbnail: metadata.thumbnail,
})

function DropdownChevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 12"
      className={`h-3 w-3 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      fill="none"
    >
      <path
        d="M2 4.5L6 8.5L10 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DropdownField({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  const currentOption = options.find((option) => option.value === value)

  return (
    <div ref={rootRef} className="relative min-w-[150px]">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        disabled={disabled}
        className="flex h-[50px] w-full items-center justify-between rounded-[14px] border border-[#555559] bg-[#242427] px-4 text-sm text-[#FFFFFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors duration-300 hover:border-[#8E8E93] hover:bg-[#2a2a2d] focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate text-left text-[#FFFFFF]">
          {currentOption ? currentOption.label : label}
        </span>
        <span className="ml-3 text-[#8E8E93]">
          <DropdownChevron open={open} />
        </span>
      </button>

      <div
        className={`absolute left-0 top-[calc(100%+10px)] z-20 w-full overflow-hidden rounded-[14px] border border-[#555559] bg-[#1B1B1D] shadow-[0_18px_40px_rgba(0,0,0,0.45)] transition-all duration-300 ease-out ${
          open
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
      >
        {options.map((option) => {
          const active = option.value === value

          return (
            <button
              type="button"
              key={option.value}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors duration-200 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                active
                  ? "bg-[#E53925] text-[#FFFFFF]"
                  : "text-[#8E8E93] hover:bg-[#242427] hover:text-[#FFFFFF]"
              }`}
            >
              <span>{option.label}</span>
              {active ? <span className="text-xs text-[#FFFFFF]">Selected</span> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DownloadBar() {
  const [url, setUrl] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [qualityOptions, setQualityOptions] = useState<DropdownOption[]>([])
  const [audioOptions, setAudioOptions] = useState<DropdownOption[]>([])
  const [selectedQuality, setSelectedQuality] = useState("")
  const [selectedAudio, setSelectedAudio] = useState("")
  const [savedYoutubeId, setSavedYoutubeId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setIsMounted(true)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [])

  const handleNext = async () => {
    const youtubeId = extractYoutubeId(url)
    console.log(`Extracted YoutubeId: ${youtubeId}`)

    if (!youtubeId) {
      setErrorMessage("Bitte einen gültigen YouTube-Link eingeben.")
      return
    }

    setSavedYoutubeId(youtubeId)
    setErrorMessage("")
    setIsExpanded(true)
    setIsLoading(true)
    setVideoInfo(null)

    try {
      const metadata = await fetchVideoMetadata(youtubeId)
      const nextQualityOptions = buildVideoOptions(metadata.videoFormats)
      const nextAudioOptions = buildAudioOptions(metadata.audioFormats)

      if (!nextQualityOptions.length || !nextAudioOptions.length) {
        throw new Error("Keine passenden Video- oder Audioformate gefunden.")
      }

      setQualityOptions(nextQualityOptions)
      setAudioOptions(nextAudioOptions)
      setSelectedQuality(nextQualityOptions[0].value)
      setSelectedAudio(nextAudioOptions[0].value)
      setVideoInfo(buildVideoInfo(metadata))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Metadata loading failed"
      setErrorMessage(message)
      setQualityOptions([])
      setAudioOptions([])
      setSelectedQuality("")
      setSelectedAudio("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!savedYoutubeId) {
      setErrorMessage("Bitte einen gültigen YouTube-Link eingeben.")
      return
    }

    setErrorMessage("")
    setIsLoading(true)

    try {
      await downloadMediaFile(savedYoutubeId, selectedQuality, selectedAudio)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed"
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  const canSubmit = Boolean(url.trim())

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0E0E0F] px-4 py-10">
      <style>{`
        @keyframes softFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-fade {
          animation: softFadeUp 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .bar-fade {
          animation: softFadeUp 720ms cubic-bezier(0.22, 1, 0.36, 1) 60ms both;
        }

        .card-expand {
          transition: max-width 520ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 520ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease;
          will-change: max-width;
        }

        .slide-content {
          transition: max-height 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease, margin-top 520ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: max-height, opacity;
        }
      `}</style>

      <div className="flex w-full max-w-[980px] flex-col items-center gap-14">
        <div
          className={`flex flex-col items-center text-center gap-3 ${
            isExpanded ? "opacity-90" : isMounted ? "hero-fade" : "opacity-0"
          }`}
        >
          <img src={icon} className="mb-3 h-12 w-12" alt="Grabberty logo" />
          <h1 className="text-4xl font-bold text-[#FFFFFF]">Grabberty</h1>
          <p className="text-[#8E8E93]">Fast, simple and high-quality self-hosted downloader</p>
        </div>

        <div
          className={`card-expand w-full rounded-[30px] border border-[#555559] bg-[#1B1B1D] shadow-[0_20px_60px_rgba(0,0,0,0.38)] ${
            !isExpanded && !isMounted ? "opacity-0" : ""
          } ${
            isExpanded ? "" : isMounted ? "bar-fade" : ""
          } ${
            isExpanded ? "max-w-[900px]" : "max-w-[700px]"
          }`}
        >
          <div className="p-5 sm:p-6 overflow-visible">
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center rounded-[14px] border border-[#242427] bg-[#242427] px-4 h-[50px] transition-colors duration-300 focus-within:border-[#8E8E93] focus-within:bg-[#27272a]">
                <span className="mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#8E8E93]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 overflow-visible"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 1 0-7.07-7.07L11 5.93"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 1 0 7.07 7.07L13 18.07"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      if (isExpanded) {
                          void handleDownload()
                      } else {
                          void handleNext()
                      }
                    }
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#FFFFFF] outline-none placeholder:text-[#555559]"
                />
              </div>

              <div
                className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isExpanded ? "max-w-[155px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
                }`}
              >
                <DropdownField
                  label="Quality"
                  value={selectedQuality}
                  onChange={setSelectedQuality}
                  options={qualityOptions}
                  disabled={isLoading || !qualityOptions.length}
                />
              </div>

              <div
                className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isExpanded ? "max-w-[155px] opacity-100" : "max-w-0 opacity-0 pointer-events-none"
                }`}
              >
                <DropdownField
                  label="Audio"
                  value={selectedAudio}
                  onChange={setSelectedAudio}
                  options={audioOptions}
                  disabled={isLoading || !audioOptions.length}
                />
              </div>

              <button
                type="button"
                onClick={isExpanded ? handleDownload : handleNext}
                disabled={!canSubmit || isLoading}
                className={`h-[50px] rounded-[14px] px-6 text-sm font-semibold text-[#FFFFFF] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${
                  isExpanded
                    ? "min-w-[150px] bg-[#E53925] hover:bg-[#E5533C]"
                    : "min-w-[120px] bg-[#E53925] hover:bg-[#E5533C]"
                }`}
              >
                {isExpanded ? (isLoading ? "..." : "Download") : "Next"}
              </button>
            </div>

            <div
              className={`slide-content overflow-hidden ${
                isExpanded ? "mt-5 max-h-[320px] opacity-100" : "mt-0 max-h-0 opacity-0"
              }`}
            >
              {errorMessage ? (
                <div className="mb-4 rounded-[14px] border border-[#E53925] bg-[#E53925]/10 px-4 py-3 text-sm text-[#FFFFFF]">
                  {errorMessage}
                </div>
              ) : null}

              {isLoading && !videoInfo ? (
                <div className="rounded-[18px] border border-[#242427] bg-[#242427] p-4">
                  <div className="flex gap-4">
                    <div className="h-[122px] w-[212px] animate-pulse rounded-[14px] bg-[#1B1B1D]" />
                    <div className="flex-1 space-y-3 pt-1">
                      <div className="h-5 w-[78%] animate-pulse rounded-full bg-[#1B1B1D]" />
                      <div className="h-4 w-[48%] animate-pulse rounded-full bg-[#1B1B1D]" />
                      <div className="mt-4 flex gap-2">
                        <div className="h-6 w-16 animate-pulse rounded-full bg-[#1B1B1D]" />
                        <div className="h-6 w-20 animate-pulse rounded-full bg-[#1B1B1D]" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : videoInfo ? (
                <div className="rounded-[18px] border border-[#242427] bg-[#242427] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    <div className="relative h-[122px] w-full overflow-hidden rounded-[14px] bg-gradient-to-br from-[#1D1E31] via-[#17172A] to-[#111114] lg:w-[220px] lg:flex-shrink-0">
                      {videoInfo.thumbnail ? (
                        <img
                          src={videoInfo.thumbnail}
                          alt={videoInfo.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(229,57,37,0.18),transparent_55%)]" />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/8 text-[#FFFFFF]">
                          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                            <path d="M8 5v14l11-7-11-7Z" fill="currentColor" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 rounded-[8px] bg-black/75 px-2 py-1 text-[10px] font-semibold text-[#FFFFFF]">
                        {videoInfo.duration}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 pt-1">
                      <h3 className="line-clamp-2 text-[15px] font-semibold leading-6 text-[#FFFFFF]">
                        {videoInfo.title}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[#8E8E93]">
                        <span>{videoInfo.channel}</span>
                        <span>•</span>
                        <span>{videoInfo.views}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[#E53925]/30 bg-[#E53925]/12 px-3 py-1 text-xs font-semibold text-[#E53925]">
                          {videoInfo.format}
                        </span>
                        <span className="rounded-full border border-[#555559] bg-[#1B1B1D] px-3 py-1 text-xs font-semibold text-[#8E8E93]">
                          {videoInfo.fileSize}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadBar
