# Node Grouping Design Document

## Overview

The node grouping feature enables users to organize related nodes in the control diagram canvas by creating visual groups with rounded rectangle backgrounds. Groups function as cohesive units that can be moved, titled, and manipulated collectively while preserving individual node functionality and connections.

This feature integrates with the existing React Flow-based canvas system, extending the current node and edge management to support group-level operations. The design maintains backward compatibility with existing diagrams while adding new organizational capabilities.

## Architecture

### Core Components

The grouping system consists of several key architectural components:

1. **Group Data Model**: Extends the existing diagram state to include group definitions
2. **Group Renderer**: Custom React Flow component for rendering group backgrounds
3. **Group Manager**: Service layer for group operations (create, update, delete)
4. **Selection Handler**: Enhanced selection logic to support group-level interactions
5. **Persistence Layer**: Extended save/load functionality to include group data

### Integration Points

- **React Flow Canvas**: Groups render as custom background elements behind nodes
- **Node Selection System**: Enhanced to support multi-node and group selection
- **Diagram State Management**: Extended to track group membership and properties
- **Export System**: Modified to exclude group visual data from CDU export

## Components and Interfaces

### Group Data Model

```typescript
interface NodeGroup {
  id: string;
  title: string;
  nodeIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    backgroundColor: string;
    borderColor: string;
    borderRadius: number;
  };
  zIndex: number;
}

interface GroupState {
  groups: NodeGroup[];
  selectedGroupIds: string[];
}
```

**Design Rationale**: The group model separates visual properties from logical relationships, allowing groups to be styled independently while maintaining clear node membership. The bounds are calculated dynamically but cached for performance.

### Group Renderer Component

```typescript
interface GroupRendererProps {
  group: NodeGroup;
  isSelected: boolean;
  onSelect: (groupId: string) => void;
  onTitleEdit: (groupId: string, newTitle: string) => void;
}
```

The GroupRenderer creates a custom React Flow node type that renders behind regular nodes. It handles:
- Background rectangle rendering with rounded corners
- Title display and inline editing
- Selection state visualization
- Click event handling for group selection

**Design Rationale**: Using React Flow's custom node system ensures groups integrate seamlessly with the existing canvas zoom, pan, and coordinate systems.

### Group Manager Service

```typescript
class GroupManager {
  createGroup(nodeIds: string[], title?: string): string;
  updateGroupTitle(groupId: string, title: string): void;
  addNodesToGroup(groupId: string, nodeIds: string[]): void;
  removeNodesFromGroup(groupId: string, nodeIds: string[]): void;
  deleteGroup(groupId: string): void;
  getGroupBounds(nodeIds: string[]): Bounds;
  updateGroupBounds(groupId: string): void;
}
```

**Design Rationale**: Centralizing group operations in a service layer provides a clean API for UI components and ensures consistent state management across all group interactions.

### Enhanced Selection System

The existing selection system is extended to support:
- Multi-node selection via Ctrl+click and drag selection
- Group selection when clicking on group backgrounds
- Collective operations on grouped nodes
- Context menu integration for group/ungroup actions

**Design Rationale**: Building on the existing selection patterns maintains UI consistency while adding new capabilities. The selection system distinguishes between individual node selection and group selection to provide appropriate interaction modes.

## Data Models

### Extended Diagram State

```typescript
interface DiagramState {
  // Existing properties
  nodes: Node[];
  edges: Edge[];
  
  // New group properties
  groups: NodeGroup[];
  selectedGroupIds: string[];
  groupCounter: number; // For default naming
}
```

### Group Persistence Format

```json
{
  "version": "1.0",
  "nodes": [...],
  "edges": [...],
  "groups": [
    {
      "id": "group-1",
      "title": "Control Loop",
      "nodeIds": ["node-1", "node-2", "node-3"],
      "bounds": {
        "x": 100,
        "y": 200,
        "width": 300,
        "height": 150
      },
      "style": {
        "backgroundColor": "rgba(59, 130, 246, 0.1)",
        "borderColor": "rgb(59, 130, 246)",
        "borderRadius": 8
      },
      "zIndex": -1
    }
  ]
}
```

**Design Rationale**: The persistence format maintains backward compatibility by adding groups as a separate array. Existing diagrams without groups will load normally, and the group data is optional.

## Error Handling

### Group Creation Validation

- **Empty Selection**: Prevent group creation with fewer than 2 nodes
- **Duplicate Grouping**: Handle attempts to group already-grouped nodes
- **Invalid Node References**: Validate all node IDs exist before group creation

### Group Operation Safety

- **Orphaned Groups**: Automatically clean up groups when all member nodes are deleted
- **Bounds Calculation**: Handle edge cases where nodes have invalid positions
- **Title Validation**: Sanitize group titles and provide fallbacks for empty titles

### State Consistency

- **Group Membership**: Ensure nodes can only belong to one group at a time
- **Selection Sync**: Keep group selection state synchronized with node selection
- **Undo/Redo**: Integrate group operations with existing undo/redo system

**Design Rationale**: Robust error handling prevents the grouping system from corrupting the diagram state and provides clear feedback when operations cannot be completed.

## Testing Strategy

### Unit Tests

1. **Group Manager Service**
   - Group creation with various node selections
   - Title editing and validation
   - Group deletion and cleanup
   - Bounds calculation accuracy

2. **Group Data Model**
   - State mutations and immutability
   - Serialization and deserialization
   - Validation logic

3. **Selection Logic**
   - Multi-node selection scenarios
   - Group selection behavior
   - Context menu integration

### Integration Tests

1. **Canvas Interaction**
   - Group rendering at different zoom levels
   - Drag operations with grouped nodes
   - Selection state synchronization

2. **Persistence**
   - Save/load cycles with grouped diagrams
   - Backward compatibility with ungrouped diagrams
   - Export functionality excluding group data

3. **User Workflows**
   - Complete group creation workflow
   - Group editing and ungrouping
   - Complex multi-group scenarios

### Visual Testing

1. **Rendering Accuracy**
   - Group backgrounds render correctly
   - Title positioning and styling
   - Theme compatibility (light/dark mode)

2. **Interaction Feedback**
   - Selection highlighting
   - Hover states
   - Context menu positioning

**Design Rationale**: The testing strategy covers both the logical grouping operations and the visual canvas integration, ensuring the feature works reliably across different usage patterns and edge cases.

## Implementation Considerations

### Performance Optimization

- **Bounds Caching**: Cache group bounds and only recalculate when member nodes move
- **Render Optimization**: Use React.memo for group components to prevent unnecessary re-renders
- **Selection Batching**: Batch selection updates to avoid multiple state changes

### Accessibility

- **Keyboard Navigation**: Support keyboard-only group selection and manipulation
- **Screen Reader Support**: Provide appropriate ARIA labels for group elements
- **Focus Management**: Maintain logical focus order when navigating grouped elements

### Theme Integration

- **Color Scheme**: Use CSS custom properties for theme-aware group styling
- **Contrast Ratios**: Ensure group backgrounds maintain sufficient contrast
- **Animation Support**: Respect user preferences for reduced motion

**Design Rationale**: These considerations ensure the grouping feature integrates seamlessly with the existing application architecture while maintaining performance and accessibility standards.