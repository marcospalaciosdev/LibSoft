import { useState, useEffect, useRef, useCallback, type TouchEvent, type KeyboardEvent } from 'react';
import { cn } from '@/shared/utils';

export interface PhotoCarouselProps {
  /** Array of image URLs */
  images?: string[];
  /** Alias for `images` - Array of image URLs */
  urls?: string[];
  /** Array of alt text descriptions for images */
  alts?: string[];
  /** Array of captions or titles for images */
  captions?: string[];
  /** Starting index (default: 0) */
  initialIndex?: number;
  /** Auto-play carousel slides (default: false) */
  autoPlay?: boolean;
  /** Auto-play slide duration in milliseconds (default: 4000) */
  autoPlayInterval?: number;
  /** Pause auto-play when hovering over carousel (default: true) */
  pauseOnHover?: boolean;
  /** Enable infinite loop navigation (default: true) */
  loop?: boolean;
  /** Display previous / next navigation arrows (default: true) */
  showArrows?: boolean;
  /** Display bottom indicator dots/pills (default: true) */
  showIndicators?: boolean;
  /** Display bottom thumbnail preview bar (default: false) */
  showThumbnails?: boolean;
  /** Display counter badge, e.g. "1 / 5" (default: true) */
  showCounter?: boolean;
  /** Display slide captions if provided (default: true) */
  showCaptions?: boolean;
  /** Enable clicking image to expand fullscreen modal (default: true) */
  enableFullscreen?: boolean;
  /** Aspect ratio or height class, e.g. "aspect-video", "aspect-[16/9]", "h-80" (default: "aspect-video") */
  aspectRatio?: string;
  /** Transition effect: 'slide' or 'fade' (default: 'slide') */
  effect?: 'slide' | 'fade';
  /** Image object-fit property: 'cover', 'contain', 'fill' (default: 'cover') */
  objectFit?: 'cover' | 'contain' | 'fill';
  /** Additional container CSS class names */
  className?: string;
  /** Callback triggered on slide index change */
  onSlideChange?: (index: number) => void;
}

export function PhotoCarousel({
  images,
  urls,
  alts = [],
  captions = [],
  initialIndex = 0,
  autoPlay = false,
  autoPlayInterval = 4000,
  pauseOnHover = true,
  loop = true,
  showArrows = true,
  showIndicators = true,
  showThumbnails = false,
  showCounter = true,
  showCaptions = true,
  enableFullscreen = true,
  aspectRatio = 'aspect-video',
  effect = 'slide',
  objectFit = 'cover',
  className = '',
  onSlideChange,
}: PhotoCarouselProps) {
  // Combine urls and images for flexibility
  const imageList = urls || images || [];
  const total = imageList.length;

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (total === 0) return 0;
    return Math.max(0, Math.min(initialIndex, total - 1));
  });

  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedMap, setLoadedMap] = useState<Record<number, boolean>>({});
  const [errorMap, setErrorMap] = useState<Record<number, boolean>>({});

  // Touch gesture state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if initialIndex or image list length changes
  useEffect(() => {
    if (total > 0 && currentIndex >= total) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const goToSlide = useCallback(
    (index: number) => {
      if (total === 0) return;
      let newIndex = index;
      if (loop) {
        newIndex = (index + total) % total;
      } else {
        newIndex = Math.max(0, Math.min(index, total - 1));
      }
      setCurrentIndex(newIndex);
      onSlideChange?.(newIndex);
    },
    [total, loop, onSlideChange]
  );

  const goToNext = useCallback(() => {
    goToSlide(currentIndex + 1);
  }, [goToSlide, currentIndex]);

  const goToPrev = useCallback(() => {
    goToSlide(currentIndex - 1);
  }, [goToSlide, currentIndex]);

  // Handle Autoplay timer
  useEffect(() => {
    if (!isPlaying || isPaused || isFullscreen || total <= 1) return;

    const timer = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [isPlaying, isPaused, isFullscreen, total, autoPlayInterval, goToNext]);

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40; // px threshold

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToNext();
    } else if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  };

  // Global keydown listener for Fullscreen modal
  useEffect(() => {
    if (!isFullscreen) return;
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isFullscreen, goToNext, goToPrev]);

  // Handle Image load events
  const handleImageLoad = (index: number) => {
    setLoadedMap((prev) => ({ ...prev, [index]: true }));
  };

  const handleImageError = (index: number) => {
    setErrorMap((prev) => ({ ...prev, [index]: true }));
    setLoadedMap((prev) => ({ ...prev, [index]: true }));
  };

  // Empty state fallback
  if (total === 0) {
    return (
      <div
        className={cn(
          'relative w-full rounded-2xl bg-[rgb(var(--color-surface))] border border-[rgb(var(--color-border))] flex flex-col items-center justify-center p-8 text-center text-[rgb(var(--color-text-muted))]',
          aspectRatio,
          className
        )}
      >
        <svg
          className="w-12 h-12 mb-3 text-[rgb(var(--color-text-muted))]/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm font-medium">No hay imágenes para mostrar</p>
      </div>
    );
  }

  const currentAlt = alts[currentIndex] || `Imagen ${currentIndex + 1}`;
  const currentCaption = captions[currentIndex];

  const fitClass =
    objectFit === 'contain'
      ? 'object-contain'
      : objectFit === 'fill'
        ? 'object-fill'
        : 'object-cover';

  useEffect(() => {
    setLoadedMap({});
    setErrorMap({});
  }, [urls, images]);

  return (
    <>
      {/* Main Carousel Container */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          'group relative w-full overflow-hidden rounded-2xl bg-black/90 shadow-lg outline-none select-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary-500))]',
          aspectRatio,
          className
        )}
      >
        {/* Slides Track */}
        <div className="relative w-full h-full">
          {imageList.map((src, index) => {
            const isActive = index === currentIndex;
            const isLoaded = loadedMap[index];
            const hasError = errorMap[index];

            // Solo renderizamos en el DOM las imágenes cerca del slide actual para evitar errores de red en segundo plano
            const shouldRenderImage = Math.abs(index - currentIndex) <= 1 || (loop && (index === 0 || index === total - 1));

            if (!shouldRenderImage) return null;

            if (effect === 'fade') {
              return (
                <div
                  key={`${src}-${index}`}
                  className={cn(
                    'absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out',
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                  )}
                >
                  {!isLoaded && !hasError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 animate-pulse">
                      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {hasError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-4">
                      <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-medium">Error al cargar la imagen</span>
                    </div>
                  ) : (
                    <img
                      src={src}
                      alt={alts[index] || `Imagen ${index + 1}`}
                      onLoad={() => handleImageLoad(index)}
                      onError={() => handleImageError(index)}
                      onClick={() => enableFullscreen && setIsFullscreen(true)}
                      className={cn(
                        'w-full h-full transition-all duration-300',
                        fitClass,
                        enableFullscreen && 'cursor-zoom-in'
                      )}
                    />
                  )}
                </div>
              );
            }

            // Layout para efecto 'slide'
            return (
              <div
                key={`${src}-${index}`}
                className={cn(
                  'absolute inset-0 w-full h-full transition-transform duration-500 ease-out transform',
                  isActive
                    ? 'translate-x-0 z-10 opacity-100'
                    : index < currentIndex
                      ? '-translate-x-full z-0 opacity-0'
                      : 'translate-x-full z-0 opacity-0'
                )}
              >
                {!isLoaded && !hasError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/60 animate-pulse">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {hasError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-gray-400 p-4">
                    <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-xs font-medium">Error al cargar la imagen</span>
                  </div>
                ) : (
                  <img
                    src={src}
                    alt={alts[index] || `Imagen ${index + 1}`}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                    onClick={() => enableFullscreen && setIsFullscreen(true)}
                    className={cn(
                      'w-full h-full transition-all duration-300',
                      fitClass,
                      enableFullscreen && 'cursor-zoom-in'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Counter Badge */}
        {showCounter && total > 1 && (
          <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white text-xs font-medium tracking-wide">
            {currentIndex + 1} / {total}
          </div>
        )}

        {/* Action Controls Top-Right (Play/Pause & Fullscreen) */}
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {autoPlay && (
            <button
              type="button"
              onClick={() => setIsPlaying((prev) => !prev)}
              aria-label={isPlaying ? 'Pausar diapositivas' : 'Reproducir diapositivas'}
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}

          {enableFullscreen && (
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              aria-label="Ver en pantalla completa"
              className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation Arrows */}
        {showArrows && total > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              disabled={!loop && currentIndex === 0}
              aria-label="Imagen anterior"
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/10 text-white transition-all duration-200 cursor-pointer shadow-md hover:scale-110 active:scale-95',
                'opacity-0 group-hover:opacity-100',
                !loop && currentIndex === 0 && 'opacity-30 cursor-not-allowed hover:scale-100'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={goToNext}
              disabled={!loop && currentIndex === total - 1}
              aria-label="Imagen siguiente"
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md border border-white/10 text-white transition-all duration-200 cursor-pointer shadow-md hover:scale-110 active:scale-95',
                'opacity-0 group-hover:opacity-100',
                !loop && currentIndex === total - 1 && 'opacity-30 cursor-not-allowed hover:scale-100'
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Caption Overlay */}
        {showCaptions && currentCaption && (
          <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white pointer-events-none">
            <p className="text-sm font-medium tracking-wide drop-shadow-sm">{currentCaption}</p>
          </div>
        )}

        {/* Bottom Indicator Dots */}
        {showIndicators && total > 1 && (
          <div
            className={cn(
              'absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto',
              showCaptions && currentCaption && 'bottom-10'
            )}
          >
            {imageList.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => goToSlide(index)}
                aria-label={`Ir a imagen ${index + 1}`}
                className={cn(
                  'h-2 rounded-full transition-all duration-300 cursor-pointer',
                  index === currentIndex
                    ? 'w-6 bg-white shadow-sm'
                    : 'w-2 bg-white/40 hover:bg-white/70'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Optional Thumbnail Strip */}
      {showThumbnails && total > 1 && (
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
          {imageList.map((src, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={cn(
                'relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer focus:outline-none',
                index === currentIndex
                  ? 'border-[rgb(var(--color-primary-500))] ring-2 ring-[rgb(var(--color-primary-500))]/30 scale-105'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <img
                src={src}
                alt={alts[index] || `Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-lg animate-fadeIn select-none"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Modal Header Controls */}
          <div
            className="absolute top-4 inset-x-6 z-50 flex items-center justify-between text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium tracking-wide">
              {currentIndex + 1} / {total}
            </div>

            <div className="flex items-center gap-3">
              {currentCaption && (
                <span className="hidden sm:inline text-sm font-medium text-gray-200">
                  {currentCaption}
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Cerrar vista completa"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded Image View */}
          <div
            className="relative max-w-7xl max-h-[85vh] p-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageList[currentIndex]}
              alt={currentAlt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
            />
          </div>

          {/* Fullscreen Navigation Buttons */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrev();
                }}
                aria-label="Imagen anterior"
                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                aria-label="Imagen siguiente"
                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/10 hover:bg-white/25 text-white backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

/** Also export as ImageCarousel for optional naming preference */
export const ImageCarousel = PhotoCarousel;
