import { useEffect, useRef, useState } from "react"
import type { DropdownOption } from "./downloadBar.types"

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

type DropdownFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  disabled?: boolean
}

function DropdownField({
  label,
  value,
  onChange,
  options,
  disabled,
}: DropdownFieldProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
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
        <span className="ml-3 text-[#8E8E93]"><DropdownChevron open={open} /></span>
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
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DropdownField