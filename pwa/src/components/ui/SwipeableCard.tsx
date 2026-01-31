import { useState, useRef, type TouchEvent, type ReactNode } from "react";

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

  const handleTouchStart = (e: TouchEvent) => {
    if (isDeleting) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
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
      const maxSwipe = containerWidth * 0.4; // Cap at 40% when locked

      // Only allow left swipe (dx > 0), cap at container width
      const newSwipeX = Math.max(0, Math.min(dx, containerWidth));
      setSwipeX(newSwipeX);

      // Reveal delete button at 40% threshold
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

  const handleCancelClick = () => {
    setSwipeX(0);
    setDeleteRevealed(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Red delete background (absolute, right-0) */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-red-500 px-5">
        <button
          onClick={handleDeleteClick}
          disabled={isDeleting}
          className="min-w-[88px] min-h-[44px] px-4 py-2 text-white font-medium rounded-lg bg-red-600 hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50"
          aria-label={`${deleteLabel} meal`}
        >
          {isDeleting ? "Deleting..." : deleteLabel}
        </button>
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

      {/* Cancel overlay when delete revealed */}
      {deleteRevealed && !isDeleting && (
        <div
          onClick={handleCancelClick}
          className="absolute inset-0 bg-transparent z-10 cursor-pointer"
          aria-label="Cancel delete"
        />
      )}
    </div>
  );
}
