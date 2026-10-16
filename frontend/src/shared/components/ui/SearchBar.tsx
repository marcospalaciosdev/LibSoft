import { useState, type KeyboardEvent, type ChangeEvent, type RefObject } from "react"

type SearchBarProps = {
  ref?: RefObject<HTMLDivElement | null>
  placeholder?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  initialValue?: string
  className?: string
}

export function SearchBar({
  placeholder = "Buscar...",
  onChange,
  onSearch,
  initialValue = "",
  className = "",
  ref,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    onChange?.(newValue)
  }

  const handleSearch = () => {
    onSearch?.(value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleClear = () => {
    setValue('')
    onChange?.('')
    onSearch?.('')
  }

  return (
    <div ref={ref} className={`flex items-center gap-0 
    bg-[rgb(var(--color-bg))] 
    border border-[rgb(var(--color-border))] 
    rounded-md h-9
    transition-all duration-200
    hover:border-[rgb(var(--color-primary-500))]/50
    focus-within:ring-2 focus-within:ring-[rgb(var(--color-primary-500))]/20 focus-within:border-[rgb(var(--color-primary-500))]
    px-4 ${className}`}>

      <span className="material-symbols-outlined text-[rgb(var(--color-text-muted))]/70 text-sm mr-3 select-none">
        search
      </span>

      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          flex-1 h-full
          bg-transparent
          text-[rgb(var(--color-text))]
          placeholder:text-[rgb(var(--color-text-muted))]/60
          outline-none
          text-sm font-medium
        "
      />

      {value && (
        <button
          onClick={handleClear}
          className="material-symbols-outlined
            text-[rgb(var(--color-text-muted))]/70
            hover:text-[rgb(var(--color-text-muted))]
            transition-colors
            text-[length:var(--fs-icon-sm)]
            h-fit w-fit
            cursor-pointer
            mr-2
          "
        >
          close
        </button>
      )}
      {/* 
      <button
        onClick={handleSearch}
        className="material-symbols-outlined
          rounded-md
          bg-[rgb(var(--color-primary-500))]
          text-white
          hover:bg-[rgb(var(--color-primary-600))]
          active:scale-95
          transition-all
          text-sm
          h-6 w-6
          flex items-center justify-center
          cursor-pointer
          font-bold
          shadow-sm
        "
      >
        arrow_forward
      </button> */}

    </div>
  )
}