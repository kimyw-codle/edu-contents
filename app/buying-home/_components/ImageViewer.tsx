'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ImageViewerProps {
  images: { id: string; src: string; name: string; subtitle?: string }[];
  initialIndex: number;
  onClose: () => void;
  toolbar?: (index: number) => React.ReactNode;
}

export default function ImageViewer({ images, initialIndex, onClose, toolbar }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setCurrentIndex(i => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goPrev();
      else goNext();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) return null;
  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={onClose}>
      {/* 상단 바 */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="min-w-0">
          <h3 className="text-white font-medium text-sm truncate">{current.name}</h3>
          {current.subtitle && <p className="text-white/50 text-xs">{current.subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className="text-white/50 text-xs">{currentIndex + 1} / {images.length}</span>
          {toolbar && toolbar(currentIndex)}
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none ml-1">x</button>
        </div>
      </div>

      {/* 이미지 영역 */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden px-4 pb-4"
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 이전 버튼 */}
        {images.length > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors text-xl"
          >
            &larr;
          </button>
        )}

        <img
          key={current.id}
          src={current.src}
          alt={current.name}
          className="max-w-full max-h-full object-contain rounded-lg"
        />

        {/* 다음 버튼 */}
        {images.length > 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-black/60 hover:text-white transition-colors text-xl"
          >
            &rarr;
          </button>
        )}
      </div>

      {/* 하단 썸네일 (5장 이상일 때만) */}
      {images.length >= 5 && (
        <div className="flex justify-center gap-1.5 px-4 pb-3 shrink-0 overflow-x-auto" onClick={e => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-12 h-12 rounded-md overflow-hidden border-2 shrink-0 transition-all ${i === currentIndex ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={img.src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
