import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface AtelierImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackTitle?: string;
}

export function AtelierImage({
  src,
  alt,
  className = '',
  style,
  fallbackTitle,
}: AtelierImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#181c24] via-[#121826] to-[#0B0F17] p-6 text-center ${className}`}
        style={style}
      >
        <Sparkles className="mb-3 h-7 w-7 text-[#d0bcff]/70" aria-hidden="true" />
        <span className="font-display text-lg text-[#F8FAFC]">
          {fallbackTitle ?? alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      style={style}
    />
  );
}
