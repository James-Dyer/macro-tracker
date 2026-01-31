import { useState, useRef, useEffect, type TouchEvent, type ReactNode } from "react";

interface SwipeableCardProps {
  onDelete: () => Promise<void>;
  deleteLabel?: string;
  children: ReactNode;
}

/**
 * SwipeableCard - Horizontal swipe gesture to reveal delete button
 *
 * Gesture pattern:
 * - Swipe left to reveal delete button (40% threshold)
 * - Swipe further (80%+) or tap button to execute delete
 * - Swipe right or tap elsewhere to cancel
 *
 * Only activates horizontal swipe if dx > dy (avoids scroll conflicts)
 */
export function SwipeableCard({
  onDelete,
  deleteLabel = "Delete",
  children,
}: SwipeableCardProps) {
  const [swipeX, setSwipeX] = useState(0);
  const [deleteRevealed, setDeleteRevealed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const swipeXAtTouchStart = useRef(0); // Track card position when touch starts

  // Close delete button when clicking outside card
  useEffect(() => {
    if (!deleteRevealed || isDeleting) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSwipeX(0);
        setDeleteRevealed(false);
      }
    };

    // Delay to avoid immediately closing when reveal happens
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [deleteRevealed, isDeleting]);

  const handleTouchStart = (e: TouchEvent) => {
    if (isDeleting) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swipeXAtTouchStart.current = swipeX; // Capture baseline position
    setIsSwiping(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDeleting || !containerRef.current) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = startX.current - currentX; // Positive = swipe left
    const dy = Math.abs(startY.current - currentY);

    // Only activate horizontal swipe if dx > dy (avoid scroll conflicts)
    if (!isSwiping && Math.abs(dx) > dy && Math.abs(dx) > 10) {
      setIsSwiping(true);
    }

    if (isSwiping) {
      const containerWidth = containerRef.current.offsetWidth;

      // Add delta to baseline position from touch start
      const newSwipeX = Math.max(
        0,
        Math.min(swipeXAtTouchStart.current + dx, containerWidth)
      );
      setSwipeX(newSwipeX);

      // Reveal delete button at 40% threshold
      const maxSwipe = containerWidth * 0.4;
      if (newSwipeX > maxSwipe && !deleteRevealed) {
        setDeleteRevealed(true);
        // Haptic feedback if supported
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      } else if (newSwipeX <= maxSwipe && deleteRevealed) {
        setDeleteRevealed(false);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isDeleting || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const threshold40 = containerWidth * 0.4;
    const threshold80 = containerWidth * 0.8;

    // Execute delete at 80% threshold
    if (swipeX > threshold80) {
      await executeDelete();
    } else if (swipeX > threshold40) {
      // Lock at 40% (show delete button)
      setSwipeX(threshold40);
      setDeleteRevealed(true);
    } else {
      // Reset (cancel)
      setSwipeX(0);
      setDeleteRevealed(false);
    }

    setIsSwiping(false);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (err) {
      console.error("Delete failed:", err);
      // Reset on error
      setSwipeX(0);
      setDeleteRevealed(false);
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = async () => {
    await executeDelete();
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Red delete background - unified clickable target */}
      <div
        onClick={handleDeleteClick}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 px-5 cursor-pointer active:bg-red-600 transition-colors select-none"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        role="button"
        aria-label={`${deleteLabel} meal`}
        style={{ pointerEvents: isDeleting ? 'none' : 'auto' }}
      >
        <span className="text-white font-semibold text-lg">
          {isDeleting ? "Deleting..." : deleteLabel}
        </span>
      </div>

      {/* Card content (transforms based on swipeX) */}
      <div
        style={{
          transform: `translateX(${-swipeX}px)`,
          transition: isSwiping ? "none" : "transform 0.3s ease-out",
        }}
        className="bg-white"
      >
        {children}
      </div>
    </div>
  );
}
