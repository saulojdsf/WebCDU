# Design Document

## Overview

The node search functionality provides users with the ability to quickly locate and highlight specific nodes in a graph visualization through two distinct search modes: direct node ID lookup and variable-based search. The feature integrates seamlessly with the existing graph visualization system, providing visual feedback and automatic view adjustments to enhance user navigation in complex graphs.

## Architecture

The search functionality follows a modular architecture that separates concerns between the search interface, search logic, and visualization updates:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Search UI     │───▶│  Search Engine   │───▶│  Visualization  │
│   Component     │    │                  │    │   Controller    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │   Graph Data     │
                       │   Manager        │
                       └──────────────────┘
```

**Design Rationale:** This separation allows for independent testing of search logic, easy extension of search modes, and clean integration with existing graph visualization components.

## Components and Interfaces

### SearchComponent
- **Purpose:** Provides the user interface for search input and mode selection
- **Key Methods:**
  - `onSearchInput(query: string)`: Handles user input and triggers search
  - `clearSearch()`: Resets search state and removes highlighting
  - `setSearchMode(mode: 'id' | 'variable')`: Switches between search modes
- **State Management:** Maintains current search query, active mode, and search results

### SearchEngine
- **Purpose:** Implements search algorithms for both ID and variable-based searches
- **Key Methods:**
  - `searchById(nodeId: string): SearchResult`: Finds node by exact ID match
  - `searchByVariable(variableName: string): SearchResult`: Finds nodes with matching Vin/Vout
  - `validateSearchQuery(query: string): boolean`: Validates search input
- **Search Result Interface:**
```typescript
interface SearchResult {
  nodes: Node[];
  edges: Edge[];
  found: boolean;
  searchType: 'id' | 'variable';
  query: string;
}
```

### VisualizationController
- **Purpose:** Manages visual updates and view adjustments based on search results
- **Key Methods:**
  - `highlightSearchResults(result: SearchResult)`: Applies visual highlighting
  - `centerViewOnNodes(nodes: Node[])`: Adjusts viewport to show found nodes
  - `clearHighlighting()`: Removes all search-related visual effects
  - `dimNonMatchingNodes(matchingNodes: Node[])`: De-emphasizes non-matching elements

**Design Rationale:** The controller pattern allows for consistent visual behavior across different search types and provides a clean interface for future visualization enhancements.

## Data Models

### Node Structure
```typescript
interface Node {
  id: string;
  vin?: string[];  // Input variables
  vout?: string[]; // Output variables
  // ... other node properties
}
```

### Search State
```typescript
interface SearchState {
  query: string;
  mode: 'id' | 'variable';
  results: SearchResult | null;
  isActive: boolean;
  highlightedElements: {
    nodes: string[];
    edges: string[];
  };
}
```

**Design Rationale:** The search state model maintains all necessary information for consistent UI updates and allows for easy serialization if search state persistence is needed in the future.

## Error Handling

### Search Validation
- **Empty Query:** Display placeholder text, no error state
- **Invalid Characters:** Allow all characters but sanitize for security
- **No Results Found:** Display contextual messages:
  - ID search: "Node not found"
  - Variable search: "Variable not found"

### Performance Considerations
- **Large Graphs:** Implement debounced search to avoid excessive processing
- **Memory Management:** Clear previous search results before processing new queries
- **Search Timeout:** Implement reasonable timeout for complex variable searches

**Design Rationale:** Graceful error handling ensures users understand search results without disrupting their workflow, while performance considerations maintain responsiveness in large graphs.

## Testing Strategy

### Unit Tests
- **SearchEngine:** Test both search modes with various input scenarios
- **SearchComponent:** Test user interactions and state management
- **VisualizationController:** Test highlighting and view adjustment logic

### Integration Tests
- **End-to-End Search Flow:** Test complete search workflow from input to visualization
- **Search Mode Switching:** Verify correct behavior when switching between ID and variable search
- **Multiple Search Results:** Test handling of variable searches returning multiple nodes

### Visual Testing
- **Highlighting Accuracy:** Verify correct nodes and edges are highlighted
- **View Centering:** Ensure viewport adjustments work correctly for different graph sizes
- **Contrast and Accessibility:** Test highlighting visibility and color contrast

**Design Rationale:** Comprehensive testing ensures reliable search functionality across different graph configurations and user interaction patterns.

## Implementation Notes

### Search Algorithm Optimization
- **ID Search:** Direct hash map lookup for O(1) performance
- **Variable Search:** Pre-indexed variable-to-node mapping for efficient lookups
- **Edge Detection:** Cache variable relationships to quickly identify connecting edges

### Visual Design Decisions
- **Highlight Color:** Use distinct accent color (e.g., bright orange) that contrasts with normal selection
- **Dimming Effect:** Apply 50% opacity to non-matching elements for better focus
- **Edge Highlighting:** Use thicker stroke width and matching accent color for variable search results
- **Animation:** Smooth transitions (200ms) for highlighting changes to avoid jarring updates

### Accessibility Considerations
- **Keyboard Navigation:** Full keyboard support for search input and result navigation
- **Screen Reader Support:** Announce search results and highlight changes
- **High Contrast Mode:** Ensure highlighting remains visible in high contrast themes
- **Focus Management:** Maintain logical focus flow during search operations

**Design Rationale:** These implementation details ensure the search functionality is performant, visually appealing, and accessible to all users while maintaining consistency with the existing application design.