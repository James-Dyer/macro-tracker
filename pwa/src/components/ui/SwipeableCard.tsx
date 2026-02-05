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
 * - Swipe left to reveal delete button (30% threshold)
 * - Swipe further (70%+) or tap button to execute delete
 * - One-swipe delete requires confirmation; two-swipe delete is immediate
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

      // Reveal delete button at 30% threshold
      const maxSwipe = containerWidth * 0.3;
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
    const threshold30 = containerWidth * 0.3;
    const threshold70 = containerWidth * 0.7;

    // Execute delete at 70% threshold
    if (swipeX > threshold70) {
      // Check if this was a one-swipe delete (requires confirmation) or two-swipe (immediate)
      const isOneSwipeDelete = swipeXAtTouchStart.current < threshold30;

      if (isOneSwipeDelete) {
        // Show confirmation modal for one-swipe delete
        setShowConfirmModal(true);
        // Lock at 70% while modal is shown
        setSwipeX(threshold70);
      } else {
        // Two-swipe delete - execute immediately (user already revealed button deliberately)
        await executeDelete();
      }
    } else if (swipeX > threshold30) {
      // Lock at 30% (show delete button)
      setSwipeX(threshold30);
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

  const handleConfirmDelete = async () => {
    setShowConfirmModal(false);
    await executeDelete();
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    // Reset to closed state
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
      {/* Red delete background - unified clickable target */}
      <div
        onClick={handleDeleteClick}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 px-5 cursor-pointer active:bg-red-600 transition-colors select-none"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        role="button"
        aria-label={`${deleteLabel} meal`}
        style={{
          pointerEvents: isDeleting ? 'none' : 'auto',
          width: `${swipeX}px`, // Fill the revealed area
          transition: isSwiping ? "none" : "width 0.3s ease-out",
        }}
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
        className="bg-app"
      >
        {children}
      </div>

      {/* Confirmation Modal for one-swipe delete */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in"
          onClick={handleCancelDelete}
        >
          <div
            className="bg-elevated rounded-lg p-6 mx-4 max-w-sm w-full shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-2 text-primary">Delete this meal?</h3>
            <p className="text-secondary mb-6">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-themed rounded-lg font-medium hover:bg-tertiary active:bg-tertiary transition-colors text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 active:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
