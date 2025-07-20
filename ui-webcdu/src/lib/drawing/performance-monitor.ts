/**
 * Performance monitoring utilities for drawing operations
 * Helps track and optimize rendering performance
 */

// Performance metrics tracking
interface PerformanceMetrics {
  frameTime: number[];
  drawCalls: number;
  elementsDrawn: number;
  elementsSkipped: number;
  lastUpdate: number;
}

// Global performance metrics
const metrics: PerformanceMetrics = {
  frameTime: [],
  drawCalls: 0,
  elementsDrawn: 0,
  elementsSkipped: 0,
  lastUpdate: 0
};

/**
 * Start measuring a frame render time
 */
export function startFrameTimer(): number {
  return performance.now();
}

/**
 * End measuring a frame render time and record metrics
 */
export function endFrameTimer(startTime: number): void {
  const duration = performance.now() - startTime;
  
  // Keep a rolling window of the last 60 frames
  metrics.frameTime.push(duration);
  if (metrics.frameTime.length > 60) {
    metrics.frameTime.shift();
  }
}

/**
 * Record drawing statistics
 */
export function recordDrawStats(drawn: number, skipped: number): void {
  metrics.drawCalls++;
  metrics.elementsDrawn += drawn;
  metrics.elementsSkipped += skipped;
}

/**
 * Reset drawing statistics
 */
export function resetDrawStats(): void {
  metrics.drawCalls = 0;
  metrics.elementsDrawn = 0;
  metrics.elementsSkipped = 0;
}

/**
 * Get current performance metrics
 */
export function getPerformanceMetrics(): {
  avgFrameTime: number;
  fps: number;
  drawCalls: number;
  elementsDrawn: number;
  elementsSkipped: number;
} {
  // Calculate average frame time
  const avgFrameTime = metrics.frameTime.length > 0
    ? metrics.frameTime.reduce((sum, time) => sum + time, 0) / metrics.frameTime.length
    : 0;
  
  // Calculate FPS
  const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
  
  return {
    avgFrameTime,
    fps,
    drawCalls: metrics.drawCalls,
    elementsDrawn: metrics.elementsDrawn,
    elementsSkipped: metrics.elementsSkipped
  };
}

/**
 * Determine if we should use low detail rendering based on current performance
 */
export function shouldUseLowDetailRendering(scale: number): boolean {
  // Get current metrics
  const currentMetrics = getPerformanceMetrics();
  
  // If FPS is below threshold, use low detail rendering
  if (currentMetrics.fps < 30 && currentMetrics.drawCalls > 0) {
    return true;
  }
  
  // If we have a lot of elements and low zoom, use low detail
  if (currentMetrics.elementsDrawn > 1000 && scale < 0.5) {
    return true;
  }
  
  // Default to normal rendering
  return false;
}

/**
 * Adaptive performance optimization
 * Returns recommended optimization settings based on current performance
 */
export function getAdaptiveOptimizationSettings(scale: number): {
  simplifyFactor: number;
  cullDistance: number;
  useImageSmoothing: boolean;
  batchSimilarElements: boolean;
} {
  // Get current metrics
  const currentMetrics = getPerformanceMetrics();
  
  // Default settings
  const settings = {
    simplifyFactor: 1,
    cullDistance: 100,
    useImageSmoothing: true,
    batchSimilarElements: false
  };
  
  // Adjust based on performance and scale
  if (currentMetrics.fps < 20 || (currentMetrics.elementsDrawn > 2000 && scale < 0.7)) {
    // Low performance mode
    settings.simplifyFactor = 3;
    settings.cullDistance = 200;
    settings.useImageSmoothing = false;
    settings.batchSimilarElements = true;
  } else if (currentMetrics.fps < 40 || (currentMetrics.elementsDrawn > 1000 && scale < 0.9)) {
    // Medium performance mode
    settings.simplifyFactor = 2;
    settings.cullDistance = 150;
    settings.useImageSmoothing = true;
    settings.batchSimilarElements = true;
  }
  
  // Further adjust based on zoom level
  if (scale < 0.3) {
    settings.simplifyFactor += 2;
    settings.cullDistance += 50;
  } else if (scale < 0.6) {
    settings.simplifyFactor += 1;
  }
  
  return settings;
}