import { useState } from 'react';
import { cn } from '@/shared/utils';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  error?: string;
}

export function TagInput({ tags,
  onChange,
  label,
  placeholder,
  id = 'tag-input',
  className,
  inputClassName,
  error
}: TagInputProps) {
  const [tagInput, setTagInput] = useState('');

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^,|,$/g, '');
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput) {
      if (tags.length > 0) {
        e.preventDefault();
        onChange(tags.slice(0, -1));
      }
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[rgb(var(--color-text-muted))]"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center flex-wrap gap-2 p-2.5 bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))] text-sm rounded-md border border-[rgb(var(--color-border))] focus-within:outline-none focus-within:ring-[1px] focus-within:ring-[rgb(var(--color-primary-500))] focus-within:border-[rgb(var(--color-primary-500))] transition-all duration-200 cursor-text",
          inputClassName
        )}
        onClick={() => document.getElementById(id)?.focus()}
      >
        {tags.map((tag, index) => (
          <div
            key={index}
            className="flex items-center gap-1 bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text))] px-2 py-1 rounded-full text-xs border border-[rgb(var(--color-border))]/50"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(index); }}
              className="flex items-center justify-center hover:text-red-500 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] cursor-pointer">close</span>
            </button>
          </div>
        ))}
        <input
          id={id}
          type="text"
          value={tagInput}
          onChange={handleTagInputChange}
          onKeyDown={handleTagInputKeyDown}
          placeholder={tags && tags.length > 0 ? '' : (placeholder || 'Añadir tags...')}
          className="flex-1 min-w-[200px] bg-transparent text-[rgb(var(--color-text))] text-sm placeholder:text-[rgb(var(--color-text-muted))]/40"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
