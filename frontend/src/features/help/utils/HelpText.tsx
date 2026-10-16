import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants';

interface HelpTextProps {
  text: string;
}

export function HelpText({ text }: HelpTextProps) {
  const parsedContent = useMemo(() => {
    if (!text) return null;

    let cleanText = text;
    Object.entries(ROUTES).forEach(([token, route]) => {
      cleanText = cleanText.replaceAll(`{{${token}}}`, route);
    });

    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(cleanText)) !== null) {
      const [, linkText, rawUrl] = match;
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        parts.push(cleanText.substring(lastIndex, matchIndex));
      }

      const isExternal = rawUrl.startsWith('http') || rawUrl.startsWith('www');
      const formattedUrl = rawUrl.startsWith('www.') ? `https://${rawUrl}` : rawUrl;

      if (isExternal) {
        parts.push(
          <a
            key={`${matchIndex}-${rawUrl}`}
            href={formattedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[rgb(var(--color-primary-600))] font-semibold hover:underline"
          >
            {linkText}
          </a>
        );
      } else {
        parts.push(
          <Link
            key={`${matchIndex}-${rawUrl}`}
            to={formattedUrl}
            className="text-[rgb(var(--color-primary-600))] font-semibold hover:underline"
          >
            {linkText}
          </Link>
        );
      }

      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < cleanText.length) {
      parts.push(cleanText.substring(lastIndex));
    }

    return parts.length > 0 ? parts : cleanText;
  }, [text]);

  return <>{parsedContent}</>;
}