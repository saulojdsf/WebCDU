# Viewport Synchronization Implementation

This document describes the implementation of viewport synchronization between React Flow and the drawing canvas.

## Overview

The viewport synchronization system ensures that drawings remain properly aligned with the React Flow canvas during zoom and pan operations. The implementation includes performance optimizations for smooth rendering even with large drawings.

## Key Components

### 1. Enhanced useViewportSync Hook

The `useViewportSync` hook provides optimized viewport synchronization with:

- Throttled viewport updates to prevent excessive redraws
- Significant change detection to avoid unnecessary updates
- Performance mode selection (quality, balanced, performance)
- Visible bounds calculation for culling
- RequestAnimationFrame-based scheduling for smooth updates

### 2. DrawingEngine Viewport Handling

The DrawingEngine class implements several viewport-related methods:

- `setViewportTransform`: Standard viewport transformation with throttling
- `setViewportTransformLowDetail`: Low-detail rendering for rapid viewport changes
- `forceViewportSync`: Immediate viewport synchronization for critical updates
- `redraw` and `redrawOptimized`: Adaptive rendering based on viewport and drawing complexity
- Culling techniques to only render visible elements

### 3. Performance Monitoring

The performance monitoring system tracks:

- Frame render times
- Drawing statistics (elements drawn vs. skipped)
- Adaptive optimization settings based on current performance

### 4. DrawingCanvasOverlay Integration

The DrawingCanvasOverlay component:

- Manages canvas size synchronization with React Flow
- Handles viewport change events
- Applies appropriate rendering strategies based on viewport state
- Ensures proper event handling during pan/zoom operations

## Optimization Techniques

1. **Viewport-based Culling**: Only render elements visible in the current viewport
2. **Adaptive Detail Level**: Simplify rendering at lower zoom levels
3. **Batch Rendering**: Group similar strokes for more efficient rendering
4. **Path Simplification**: Reduce points in complex paths based on zoom level
5. **Throttled Updates**: Limit update frequency during rapid viewport changes
6. **RequestAnimationFrame**: Synchronize rendering with browser's refresh cycle
7. **Performance Monitoring**: Dynamically adjust rendering quality based on performance

## Usage

The viewport synchronization system works automatically when using the DrawingCanvasOverlay component. No additional configuration is required for basic usage.

For advanced customization, the useViewportSync hook accepts options:

```typescript
const { viewport, forceSyncViewport } = useViewportSync({
  throttleMs: 16,
  performanceMode: 'balanced',
  significantChangeThreshold: { zoom: 0.01, position: 1 }
});
```

## Performance Considerations

- Large drawings (1000+ strokes) automatically use optimized rendering
- Very low zoom levels (<0.1) skip detailed rendering
- During rapid panning/zooming, simplified rendering is used
- Batch rendering is applied when many similar elements are present