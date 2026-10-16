import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Format a date to a locale string
 */
export function formatDate(date: string | Date, locale = 'es-MX'): string {
  const timeZone = localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone,
  });
}

/**
 * Format a date to a short string
 */
export function formatDateShort(date: string | Date, locale = 'es-MX'): string {
  const timeZone = localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
}

export function formatDateTime(date: string | Date, locale?: string): string {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';

  const timeZone = localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return parsedDate.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  });
}

/**
 * Truncate text to a given length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Debounce a function call
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const hexToRgbString = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
};