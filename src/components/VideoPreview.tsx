import type { BackendAudioFormat, BackendVideoFormat } from "../utils/types"
import {
  formatFileSize,
  getEstimatedFinalFileSize,
  getOutputFormat,
} from "./downloadBar.utils"
import type { VideoInfo } from "./downloadBar.types"

type VideoPreviewProps = {
  videoInfo: VideoInfo | null
  isLoading: boolean
  selectedQuality: string
  selectedAudio: string
  videoFormats: BackendVideoFormat[]
  audioFormats: BackendAudioFormat[]
}

function VideoThumbnail({ videoInfo }: { videoInfo: VideoInfo }) {
  return (
    <div className="relative h-[122px] w-full overflow-hidden rounded-[14px] bg-gradient-to-br from-[#1D1E31] via-[#17172A] to-[#111114] lg:w-[220px] lg:flex-shrink-0">
      {videoInfo.thumbnail ? (
        <img src={videoInfo.thumbnail} alt={videoInfo.title} className="h-full w-full object-cover" />
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
  )
}

function LoadingPreview() {
  return (
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
  )
}

function VideoPreview({
  videoInfo,
  isLoading,
  selectedQuality,
  selectedAudio,
  videoFormats,
  audioFormats,
}: VideoPreviewProps) {
  if (isLoading && !videoInfo) return <LoadingPreview />
  if (!videoInfo) return null

  return (
    <div className="rounded-[18px] border border-[#242427] bg-[#242427] p-4">
      <div className="flex flex-col gap-4 lg:flex-row">
        <VideoThumbnail videoInfo={videoInfo} />
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
              {getOutputFormat(selectedQuality, selectedAudio)}
            </span>
            <span className="rounded-full border border-[#555559] bg-[#1B1B1D] px-3 py-1 text-xs font-semibold text-[#8E8E93]">
              {formatFileSize(
                getEstimatedFinalFileSize(
                  videoFormats,
                  audioFormats,
                  selectedQuality,
                  selectedAudio
                )
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoPreview