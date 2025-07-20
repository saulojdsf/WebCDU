# Drawing Infrastructure

This directory contains the core infrastructure for the canvas drawing tools feature.

## Overview

The drawing system provides a complete foundation for implementing drawing capabilities in the React Flow-based application. It includes type definitions, state management, utility functions, and React context providers.

## Architecture

### Core Components

1. **Types and Interfaces** (`drawing-types.ts`)
   - `DrawingTool`: Union type for available drawing tools
   - `Point`: Coordinate representation with optional pressure
   - `Stroke`: Freehand drawing data structure
   - `Shape`: Geometric shape data structure
   - `DrawingData`: Complete drawing state container
   - `ToolSettings`: Configuration for all drawing tools

2. **Drawing Context** (`DrawingContext.tsx`)
   - React context provider for global drawing state
   - Reducer-based state management
   - Action creators for state updates
   - Custom hook (`useDrawing`) for context access

3. **Drawing State Hook** (`useDrawingState.ts`)
   - Higher-level drawing operations
   - Stroke and shape creation utilities
   - Tool-specific helper functions
   - Drawing workflow management

4. **Utility Functions** (`drawing-utils.ts`)
   - Coordinate transformations
   - Path smoothing algorithms
   - Bounds calculations
   - Data validation and cloning
   - Drawing statistics

## Usage

### Basic Setup

```typescript
import { DrawingProvider } from './lib/drawing';

function App() {
  return (
    <DrawingProvider>
      {/* Your app components */}
    </DrawingProvider>
  );
}
```

### Using Drawing State

```typescript
import { useDrawingState } from './lib/drawing';

function DrawingComponent() {
  const {
    isDrawingMode,
    currentTool,
    toggleDrawingMode,
    setCurrentTool,
    createStroke,
    addShape,
  } = useDrawingState();

  // Component implementation
}
```

### Creating Strokes

```typescript
const points = [
  { x: 0, y: 0 },
  { x: 10, y: 10 },
  { x: 20, y: 5 },
];

const stroke = createStroke(points);
// Stroke is automatically created with current tool settings
```

### Creating Shapes

```typescript
const bounds = { x: 10, y: 20, width: 100, height: 50 };
const shape = addShape('rectangle', bounds);
// Shape is automatically added to drawing data
```

## State Management

The drawing system uses a reducer pattern for state management:

- **State**: Centralized in `DrawingContextState`
- **Actions**: Dispatched through action creators
- **Updates**: Immutable state updates via reducer
- **Persistence**: Drawing data can be exported/imported

## Tool Settings

Each tool maintains its own settings:

```typescript
const toolSettings = {
  pen: {
    size: 2,
    color: '#000000',
    opacity: 1,
  },
  eraser: {
    size: 10,
  },
  shapes: {
    strokeColor: '#000000',
    fillColor: '#ffffff',
    strokeWidth: 2,
    filled: false,
  },
};
```

## Data Structures

### Stroke Data
- Contains array of points with coordinates
- Includes tool type and settings used
- Timestamped for ordering and history

### Shape Data
- Geometric bounds (x, y, width, height)
- Shape type (rectangle, circle, line)
- Styling settings (colors, stroke width, fill)

### Drawing Data
- Version for compatibility
- Arrays of strokes and shapes
- Serializable for persistence

## Testing

The infrastructure includes comprehensive tests:

- **Unit Tests**: Core utilities and data structures
- **Integration Tests**: Context and hook functionality
- **Type Safety**: Full TypeScript coverage

Run tests with:
```bash
npm test -- --run src/lib/__tests__/drawing-types.test.ts
npm test -- --run src/contexts/__tests__/DrawingContext.test.tsx
npm test -- --run src/hooks/__tests__/useDrawingState.test.tsx
```

## Next Steps

This infrastructure provides the foundation for:

1. **DrawingCanvas Component**: HTML5 canvas implementation
2. **DrawingToolbar Component**: Tool selection UI
3. **DrawingEngine Class**: Canvas rendering logic
4. **Integration**: React Flow viewport synchronization

The infrastructure is designed to be extensible and maintainable, supporting future enhancements like undo/redo, layers, and advanced drawing features.