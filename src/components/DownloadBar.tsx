import { useEffect, useState } from "react"
import icon from "../assets/logo.svg"
import type {
  BackendAudioFormat,
  BackendVideoFormat,
} from "../utils/types"
import {
  extractYoutubeId,
  fetchVideoMetadata,
  downloadMediaFile,
} from "../utils/download"
import DownloadForm from "./DownloadForm"
import VideoPreview from "./VideoPreview"
import {
  buildAudioOptions,
  buildVideoInfo,
  buildVideoOptions,
  getDefaultOption,
} from "./downloadBar.utils"
import type { DropdownOption, VideoInfo } from "./downloadBar.types"

function DownloadBar() {
  const [url, setUrl] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [videoFormats, setVideoFormats] = useState<BackendVideoFormat[]>([])
  const [qualityOptions, setQualityOptions] = useState<DropdownOption[]>([])
  const [audioFormats, setAudioFormats] = useState<BackendAudioFormat[]>([])
  const [audioOptions, setAudioOptions] = useState<DropdownOption[]>([])
  const [selectedQuality, setSelectedQuality] = useState("")
  const [selectedAudio, setSelectedAudio] = useState("")
  const [savedYoutubeId, setSavedYoutubeId] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => setIsMounted(true))
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  const handleNext = async () => {
    const youtubeId = extractYoutubeId(url)

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

      setVideoFormats(metadata.videoFormats)
      setAudioFormats(metadata.audioFormats)
      setQualityOptions(nextQualityOptions)
      setAudioOptions(nextAudioOptions)
      setSelectedQuality(getDefaultOption(nextQualityOptions))
      setSelectedAudio(getDefaultOption(nextAudioOptions))
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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0E0E0F] px-4 py-10">
      <div className="flex w-full max-w-[980px] flex-col items-center gap-14">
        <div
          className={`flex flex-col items-center gap-3 text-center ${
            isExpanded ? "opacity-90" : isMounted ? "hero-fade" : "opacity-0"
          }`}
        >
          <img src={icon} className="mb-3 h-16 w-16" alt="Grabberty logo" />
          <h1 className="text-4xl font-bold text-[#FFFFFF]">Grabberty</h1>
          <p className="text-[#8E8E93]">Fast, simple and high-quality self-hosted downloader</p>
        </div>

        <div
          className={`card-expand w-full rounded-[30px] border border-[#555559] bg-[#1B1B1D] shadow-[0_20px_60px_rgba(0,0,0,0.38)] ${
            !isExpanded && !isMounted ? "opacity-0" : ""
          } ${isExpanded ? "" : isMounted ? "bar-fade" : ""} ${
            isExpanded ? "max-w-[900px]" : "max-w-[700px]"
          }`}
        >
          <div className="overflow-visible p-5 sm:p-6">
            <DownloadForm
              url={url}
              isExpanded={isExpanded}
              isLoading={isLoading}
              quality={selectedQuality}
              audio={selectedAudio}
              qualityOptions={qualityOptions}
              audioOptions={audioOptions}
              onUrlChange={setUrl}
              onQualityChange={setSelectedQuality}
              onAudioChange={setSelectedAudio}
              onNext={() => void handleNext()}
              onDownload={() => void handleDownload()}
            />

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
              <VideoPreview
                videoInfo={videoInfo}
                isLoading={isLoading}
                selectedQuality={selectedQuality}
                selectedAudio={selectedAudio}
                videoFormats={videoFormats}
                audioFormats={audioFormats}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DownloadBar
