import DropdownField from "./DropdownField"
import type { DropdownOption } from "./downloadBar.types"

type DownloadFormProps = {
  url: string
  isExpanded: boolean
  isLoading: boolean
  quality: string
  audio: string
  qualityOptions: DropdownOption[]
  audioOptions: DropdownOption[]
  onUrlChange: (url: string) => void
  onQualityChange: (quality: string) => void
  onAudioChange: (audio: string) => void
  onNext: () => void
  onDownload: () => void
}

function LinkIcon() {
  return (
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
  )
}

function DownloadForm({
  url,
  isExpanded,
  isLoading,
  quality,
  audio,
  qualityOptions,
  audioOptions,
  onUrlChange,
  onQualityChange,
  onAudioChange,
  onNext,
  onDownload,
}: DownloadFormProps) {
  const canSubmit = Boolean(url.trim())
  const handleSubmit = isExpanded ? onDownload : onNext

  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center rounded-[14px] border border-[#242427] bg-[#242427] px-4 h-[50px] transition-colors duration-300 focus-within:border-[#8E8E93] focus-within:bg-[#27272a]">
        <span className="mr-3 flex h-5 w-5 flex-shrink-0 items-center justify-center text-[#8E8E93]">
          <LinkIcon />
        </span>
        <input
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleSubmit()
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
          value={quality}
          onChange={onQualityChange}
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
          value={audio}
          onChange={onAudioChange}
          options={audioOptions}
          disabled={isLoading || !audioOptions.length}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
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
  )
}

export default DownloadForm