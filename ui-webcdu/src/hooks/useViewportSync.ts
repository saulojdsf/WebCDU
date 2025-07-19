import { useEffect, useRef, useCallback } from 'react';
import { useViewport } from 'reactflow';

interface ViewportSyncOptions {
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  throttleMs?: number;
  significantChangeThreshold?: {
    zoom: number;
    position: number;
  };
}

/**
 * Custom hook for optimized viewport synchronization
 * Provides throttled viewport updates and significant change detection
 */
export function useViewportSync(options: ViewportSyncOptions = {}) {
  const {
    onViewportChange,
    throttleMs = 16, // ~60fps
    significantChangeThreshold = { zoom: 0.01, position: 1 }
  } = options;

  const { x, y, zoom } = useViewport();
  const lastUpdateRef = useRef(0);
  const lastViewportRef = useRef({ x, y, zoom });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleViewportChange = useCallback(() => {
    if (!onViewportChange) return;

    const now = performance.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    // Check if change is significant
    const last = lastViewportRef.current;
    const zoomChanged = Math.abs(last.zoom - zoom) > significantChangeThreshold.zoom;
    const positionChanged = 
      Math.abs(last.x - x) > significantChangeThreshold.position ||
      Math.abs(last.y - y) > significantChangeThreshold.position;

    if (!zoomChanged && !positionChanged) {
      return; // No significant change
    }

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Throttle updates
    if (timeSinceLastUpdate < throttleMs) {
      timeoutRef.current = setTimeout(() => {
        lastUpdateRef.current = performance.now();
        lastViewportRef.current = { x, y, zoom };
        onViewportChange({ x, y, zoom });
        timeoutRef.current = null;
      }, throttleMs - timeSinceLastUpdate);
    } else {
      lastUpdateRef.current = now;
      lastViewportRef.current = { x, y, zoom };
      onViewportChange({ x, y, zoom });
    }
  }, [x, y, zoom, onViewportChange, throttleMs, significantChangeThreshold]);

  useEffect(() => {
    handleViewportChange();
  }, [handleViewportChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    viewport: { x, y, zoom },
    isSignificantChange: () => {
      const last = lastViewportRef.current;
      const zoomChanged = Math.abs(last.zoom - zoom) > significantChangeThreshold.zoom;
      const positionChanged = 
        Math.abs(last.x - x) > significantChangeThreshold.position ||
        Math.abs(last.y - y) > significantChangeThreshold.position;
      return zoomChanged || positionChanged;
    }
  };
}