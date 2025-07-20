import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useViewport, useReactFlow } from 'reactflow';

interface ViewportSyncOptions {
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void;
  throttleMs?: number;
  significantChangeThreshold?: {
    zoom: number;
    position: number;
  };
  enableOptimizations?: boolean;
  performanceMode?: 'balanced' | 'quality' | 'performance';
}

/**
 * Enhanced hook for optimized viewport synchronization between React Flow and canvas
 * Provides throttled viewport updates, significant change detection, and performance optimizations
 */
export function useViewportSync(options: ViewportSyncOptions = {}) {
  const {
    onViewportChange,
    throttleMs = 16, // ~60fps
    significantChangeThreshold = { zoom: 0.01, position: 1 },
    enableOptimizations = true,
    performanceMode = 'balanced'
  } = options;

  const { x, y, zoom } = useViewport();
  const reactFlowInstance = useReactFlow();
  const lastUpdateRef = useRef(0);
  const lastViewportRef = useRef({ x, y, zoom });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<{ x: number; y: number; zoom: number } | null>(null);
  const onViewportChangeRef = useRef(onViewportChange);

  // Update the callback ref when it changes
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  // Determine actual throttle time based on performance mode
  const actualThrottleMs = useMemo(() => {
    switch (performanceMode) {
      case 'quality': return Math.max(8, throttleMs / 2); // Higher quality, more updates
      case 'performance': return Math.max(32, throttleMs * 2); // Better performance, fewer updates
      case 'balanced':
      default:
        return throttleMs;
    }
  }, [throttleMs, performanceMode]);

  // Determine if we should skip rendering based on zoom level (optimization)
  const shouldSkipRender = useCallback((currentZoom: number): boolean => {
    if (!enableOptimizations) return false;
    
    // Skip detailed rendering at very low zoom levels
    if (performanceMode === 'performance' && currentZoom < 0.4) return true;
    if (performanceMode === 'balanced' && currentZoom < 0.2) return true;
    if (performanceMode === 'quality' && currentZoom < 0.1) return true;
    
    return false;
  }, [enableOptimizations, performanceMode]);

  // Process viewport changes with optimizations
  const processViewportChange = useCallback(() => {
    if (!pendingUpdateRef.current || !onViewportChangeRef.current) return;
    
    const { x, y, zoom } = pendingUpdateRef.current;
    pendingUpdateRef.current = null;
    
    // Apply optimizations based on zoom level
    const skipDetailedRender = shouldSkipRender(zoom);
    
    // Update last viewport reference
    lastViewportRef.current = { x, y, zoom };
    lastUpdateRef.current = performance.now();
    
    // Call the viewport change handler
    onViewportChangeRef.current({ 
      x, 
      y, 
      zoom
    });
  }, [shouldSkipRender]);

  // Handle viewport changes with proper dependency management
  useEffect(() => {
    if (!onViewportChangeRef.current) return;

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

    // Store the pending update
    pendingUpdateRef.current = { x, y, zoom };

    // Clear any pending timeout/animation frame
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Throttle updates using requestAnimationFrame for smoother performance
    if (timeSinceLastUpdate < actualThrottleMs) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          processViewportChange();
        });
      }, actualThrottleMs - timeSinceLastUpdate);
    } else {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        processViewportChange();
      });
    }
  }, [x, y, zoom, actualThrottleMs, significantChangeThreshold.zoom, significantChangeThreshold.position, processViewportChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Force sync viewport immediately (useful for critical updates)
  const forceSyncViewport = useCallback(() => {
    if (onViewportChangeRef.current) {
      lastViewportRef.current = { x, y, zoom };
      lastUpdateRef.current = performance.now();
      onViewportChangeRef.current({ x, y, zoom });
    }
  }, [x, y, zoom]);

  // Get visible bounds in flow coordinates
  const getVisibleBounds = useCallback(() => {
    if (!reactFlowInstance) return null;
    
    // Get the React Flow container dimensions
    const container = document.querySelector('.react-flow');
    if (!container) return null;
    
    const rect = container.getBoundingClientRect();
    const topLeft = reactFlowInstance.screenToFlowPosition({ x: 0, y: 0 });
    const bottomRight = reactFlowInstance.screenToFlowPosition({ x: rect.width, y: rect.height });
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }, [reactFlowInstance]);

  return {
    viewport: { x, y, zoom },
    isSignificantChange: () => {
      const last = lastViewportRef.current;
      const zoomChanged = Math.abs(last.zoom - zoom) > significantChangeThreshold.zoom;
      const positionChanged = 
        Math.abs(last.x - x) > significantChangeThreshold.position ||
        Math.abs(last.y - y) > significantChangeThreshold.position;
      return zoomChanged || positionChanged;
    },
    forceSyncViewport,
    getVisibleBounds,
    shouldSkipRender: () => shouldSkipRender(zoom)
  };
}