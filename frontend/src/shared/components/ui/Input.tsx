import React, { useId, useState, useRef, useEffect, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/utils';
import { useOutsideClick } from '@/shared/hooks/useOutsideClick';

interface BaseInputProps {
  label?: React.ReactNode | {
    content: React.ReactNode,
    width?: string,
    height?: string,
    className?: string,
  };
  error?: string;
  onClearError?: () => void;
  helperText?: string;
  children?: React.ReactNode;
  inputClassName?: string;
  className?: string;
  orientation?: string;
  onSuggestionClick?: (value: string, label: string) => void;
  suggestions?: {
    label: string,
    value: string,
  }[];
}

interface TextInputProps extends BaseInputProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  inputType?: 'text' | 'password';
  type?: string;
}

interface TextareaInputProps extends BaseInputProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  inputType: 'textarea';
}

type InputProps = TextInputProps | TextareaInputProps;

export function Input({
  label,
  error,
  onClearError,
  helperText,
  inputClassName,
  className,
  id,
  children,
  inputType = 'text',
  orientation = 'vertical',
  defaultValue,
  onSuggestionClick,
  ...props
}: InputProps) {
  const generatedId = useId();
  const isLabelObject = label && typeof label === 'object' && 'content' in label;
  const labelObject = isLabelObject ? (label as { content: React.ReactNode; className?: string; width?: string; heigth?: string }) : undefined;
  const labelContent = isLabelObject ? labelObject?.content : label;
  const labelWidth = orientation === 'horizontal' ? labelObject?.width ?? 'auto' : undefined;
  const fallbackId = typeof labelContent === 'string' ? labelContent.toLowerCase().replace(/\s+/g, '-') : generatedId;
  const inputId = id || fallbackId;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const prevSuggestionsLength = useRef<number>((props as BaseInputProps).suggestions?.length ?? 0);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState<boolean>(false);

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [internalValue, setInternalValue] = useState<string | number | readonly string[] | undefined>(
    (props as TextInputProps).value ??
    (props as TextInputProps).defaultValue ??
    '',
  );

  useEffect(() => {
    if ('value' in props && props.value !== undefined) {
      setInternalValue((props as TextInputProps).value);
    }
  }, [(props as TextInputProps).value]);

  const inputValue = internalValue;

  const openSuggestions = () => {
    if ((props as BaseInputProps).suggestions?.length) {
      setIsSuggestionsOpen(true);
    }
  };

  useEffect(() => {
    const suggestions = (props as BaseInputProps).suggestions;
    const currentLength = suggestions?.length ?? 0;
    const previousLength = prevSuggestionsLength.current;

    if (currentLength > 0 && previousLength === 0) {
      setIsSuggestionsOpen(true);
    }

    prevSuggestionsLength.current = currentLength;
  }, [(props as BaseInputProps).suggestions]);

  const handleSuggestionSelect = (value: string, label: string) => {

    if (onSuggestionClick) {
      onSuggestionClick(value, label);
    }

    if (inputRef.current) {
      inputRef.current.value = value;
    }

    const syntheticEvent = {
      target: {
        value,
        name: (props as any).name,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    (props as any).onChange?.(syntheticEvent);
    setIsSuggestionsOpen(false);
  };

  const suggestionsRef = useRef<HTMLDivElement>(null);
  useOutsideClick([suggestionsRef], () => {
    setIsSuggestionsOpen(false);
  });

  const baseSuggestionsClassName = "absolute top-[100%] left-0 mt-2 w-full z-50 overflow-x-hidden overflow-y-scroll rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] shadow-lg overflow-scroll max-h-[200px]";

  const baseClassName = cn(
    'w-full px-3 py-2 rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))] text-[rgb(var(--color-text))]',
    'placeholder:text-[rgb(var(--color-text-muted))]/40 relative',
    'focus:outline-none focus:ring-[1px] focus:ring-[rgb(var(--color-primary-500))] focus:border-primary-500',
    'transition-all duration-200',
    error && 'border-red-500 focus:ring-error-500/30 focus:border-error-500',
    'disabled:bg-[rgb(var(--color-surface))] disabled:cursor-not-allowed',

    inputType === 'password' && 'pr-10',
    inputClassName,
  );

  const handleClearError = () => {
    onClearError?.();
  };

  const renderInput = (
    className?: string,
  ) => {
    if (inputType === 'textarea') {
      const { onClick, suggestions, value, defaultValue, ...restTextAreaProps } = props as TextareaInputProps;

      const handleTextAreaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
        handleClearError();
        onClick?.(e);
      };

      const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInternalValue(e.target.value);
        (props as TextareaInputProps).onChange?.(e);
      };

      return (
        <div className={`${orientation === 'horizontal' ? 'col-start-2 row-start-1' : ''} relative w-full`}>
          <textarea
            id={inputId}
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={cn(baseClassName, 'resize-y min-h-20', className)}
            onClick={handleTextAreaClick}
            onFocus={openSuggestions}
            onChange={handleTextAreaChange}
            value={inputValue}
            {...(restTextAreaProps as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
          {suggestions && suggestions.length > 0 && isSuggestionsOpen && (
            <div className={`${baseSuggestionsClassName}`} ref={suggestionsRef}>
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.value}
                  className="w-full px-3 py-2 text-left text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))] cursor-pointer"
                  onClick={() => handleSuggestionSelect(suggestion.value, suggestion.label)}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }

    const { type = 'text', min, max, onChange, onBlur, onClick, suggestions, value, defaultValue, ...restInputProps } = props as TextInputProps;

    const computedType = inputType === 'password' ? (showPassword ? 'text' : 'password') : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (computedType === 'number') {
        const val = Number(e.target.value);
        if (max !== undefined && val > Number(max)) {
          e.target.value = max.toString();
        }
      } else if (computedType === 'datetime-local') {
        const val = e.target.value;
        if (max !== undefined && val > String(max)) {
          e.target.value = String(max);
        }
      }
      setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (computedType === 'number' && e.target.value !== '') {
        const val = Number(e.target.value);
        let clamped = val;
        if (min !== undefined && val < Number(min)) clamped = Number(min);
        if (max !== undefined && val > Number(max)) clamped = Number(max);

        if (clamped !== val) {
          e.target.value = clamped.toString();
          onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      } else if (computedType === 'datetime-local' && e.target.value !== '') {
        const val = e.target.value;
        let clamped = val;
        if (min !== undefined && val < String(min)) clamped = String(min);
        if (max !== undefined && val > String(max)) clamped = String(max);

        if (clamped !== val) {
          e.target.value = clamped;
          onChange?.(e as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      }
      onBlur?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
      handleClearError();
      onClick?.(e);
    };

    return (
      <div className={`${orientation === 'horizontal' ? 'col-start-2 row-start-1' : ''} relative w-full flex items-center`}>
        <input
          id={inputId}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={computedType}
          className={`${baseClassName} ${className}`}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onClick={handleClick}
          onFocus={openSuggestions}
          {...(restInputProps as InputHTMLAttributes<HTMLInputElement>)}
        />

        {inputType === 'password' && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowPassword(!showPassword);
            }}
            className="absolute right-3 text-[rgb(var(--color-text-muted))]/60 hover:text-[rgb(var(--color-text))] focus:outline-none transition-colors cursor-pointer"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <div className='flex items-center justify-center'>
              <span className='material-symbols-outlined p-0 text-(length:--fs-icon-sm) cursor-pointer select-none'>
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </button>
        )}

        {
          suggestions && suggestions.length > 0 && isSuggestionsOpen && (
            <div className={`${baseSuggestionsClassName}`} ref={suggestionsRef}>
              {suggestions.map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.value}
                  className="w-full px-3 py-2 text-left text-sm text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-bg-secondary))] cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionSelect(suggestion.value, suggestion.label)}
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          )
        }
      </div >
    );
  };

  return (
    <div
      className={`${orientation === 'horizontal' && labelContent ? 'grid items-center' : 'flex flex-col'} relative ${className}`}
      style={orientation === 'horizontal' && labelContent ? { gridTemplateColumns: `${labelWidth} 1fr` } : undefined}
    >
      {labelContent && (
        <label htmlFor={inputId} className={`cursor-pointer text-sm font-medium text-[rgb(var(--color-text-muted))] whitespace-nowrap overflow-hidden text-ellipsis min-w-0 ${orientation === 'horizontal' ? 'col-start-1 row-start-1' : 'mb-2'}`}>
          {labelContent}
        </label>
      )}
      {renderInput()}
      {error && <p className={`text-xs text-red-500 ${orientation === 'horizontal' ? 'col-start-2 row-start-2 mt-2' : 'mt-1'}`}>{error}</p>}
      {helperText && !error && <p className="text-xs text-[rgb(var(--color-text-muted))]/60 mt-2">{helperText}</p>}
      {children}
    </div>
  );
}