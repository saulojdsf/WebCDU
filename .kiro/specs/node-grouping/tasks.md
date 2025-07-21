# Implementation Plan

- [x] 1. Create group data model and types
  - Define TypeScript interfaces for NodeGroup, GroupState, and related types
  - Create group-related type definitions in a new types file
  - Ensure compatibility with existing ReactFlow Node and Edge types
  - _Requirements: 1.1, 2.1, 5.1, 5.4_

- [x] 2. Implement group state management
  - [x] 2.1 Extend diagram state to include group data
    - Add groups array and selectedGroupIds to main application state
    - Implement group counter for default naming
    - Update state management hooks to handle group operations
    - _Requirements: 2.5, 5.1, 5.4_

  - [x] 2.2 Create GroupManager service class
    - Implement createGroup, updateGroupTitle, deleteGroup methods
    - Add group bounds calculation and update functionality
    - Implement group membership management (add/remove nodes)
    - Include validation logic for group operations
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 3.1, 3.2_

- [x] 3. Enhance selection system for multi-node support
  - [x] 3.1 Implement multi-node selection with Ctrl+click
    - Extend existing onSelectionChange handler to support multiple nodes
    - Add logic to track multi-node selection state
    - Ensure compatibility with existing single-node selection
    - _Requirements: 1.1_

  - [x] 3.2 Add drag selection functionality
    - Implement selection rectangle for dragging to select multiple nodes
    - Integrate with ReactFlow's selection box feature
    - Update selection state when drag selection completes
    - _Requirements: 1.1_

- [x] 4. Create group rendering system
  - [x] 4.1 Implement GroupRenderer component
    - Create React component for rendering group backgrounds
    - Implement rounded rectangle rendering with proper styling
    - Add group title display and positioning logic
    - Handle theme-aware styling (light/dark mode support)
    - _Requirements: 2.2, 4.1, 4.2, 4.3, 4.4_

  - [x] 4.2 Integrate groups with ReactFlow canvas

    - Add groups as custom background elements in ReactFlow
    - Ensure groups render behind nodes with proper z-index
    - Implement group bounds calculation based on member nodes
    - Handle viewport changes and zoom levels correctly
    - Fix GroupLayer component integration issues with selectedNodes prop
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 5. Implement group interaction handlers
  - [x] 5.1 Add context menu for group operations
    - Extend existing right-click handling to show group/ungroup options
    - Display "Group" option when multiple nodes are selected
    - Display "Ungroup" option when clicking on existing groups
    - Implement context menu positioning and styling
    - _Requirements: 1.2, 3.1_

  - [x] 5.2 Implement group selection and manipulation





    - Add click handling for group background selection
    - Implement group dragging to move all member nodes together
    - Ensure group selection updates selectedGroupIds state
    - Handle group selection highlighting with proper visual feedback
    - Fix GroupRenderer click event handling
    - _Requirements: 1.5, 1.6, 4.5, 6.1, 6.2_

- [x] 6. Add group title editing functionality
  - [x] 6.1 Implement inline title editing
    - Add double-click handler for group titles
    - Create inline text input component for title editing
    - Handle Enter key and click-outside to save title changes
    - Implement title validation and default naming
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.2 Add title creation dialog for new groups
    - Show title input dialog when creating new groups
    - Provide default title generation (Group 1, Group 2, etc.)
    - Allow users to skip title entry for default naming
    - _Requirements: 2.1, 2.5_

- [x] 7. Implement group persistence
  - [x] 7.1 Extend save/load functionality for groups
    - Update exportNodes function to include group data
    - Modify loadNodes function to restore group information
    - Ensure backward compatibility with diagrams without groups
    - Handle group data validation during import
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 Update CDU export to exclude group data
    - Ensure CDU export maintains existing functionality
    - Verify that group visual elements don't affect CDU output
    - Preserve logical node connections while ignoring group containers
    - _Requirements: 5.3_

- [x] 8. Add group deletion and cleanup
  - [x] 8.1 Implement group deletion with confirmation
    - Add delete confirmation dialog for group removal
    - Implement logic to delete all member nodes when group is deleted
    - Handle orphaned group cleanup when member nodes are deleted individually
    - _Requirements: 6.3_

  - [x] 8.2 Implement ungroup functionality
    - Create ungroup operation that removes group container
    - Preserve all member nodes in their current positions
    - Maintain all existing node connections after ungrouping
    - Update selection state after ungrouping operation
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 9. Add group copy/paste functionality
  - [ ] 9.1 Implement group copying
    - Extend existing copy functionality to handle entire groups
    - Copy all member nodes and their internal connections
    - Store group metadata for paste operation
    - _Requirements: 6.4_

  - [ ] 9.2 Implement group pasting
    - Create new instances of all nodes when pasting groups
    - Preserve relative positioning of nodes within the group
    - Generate new unique IDs for pasted nodes
    - Recreate group container with copied nodes
    - _Requirements: 6.5_

- [ ] 10. Add keyboard shortcuts and accessibility
  - [ ] 10.1 Implement keyboard shortcuts for group operations
    - Add Ctrl+G shortcut for grouping selected nodes
    - Add Ctrl+Shift+G shortcut for ungrouping selected groups
    - Integrate shortcuts with existing keyboard handling
    - _Requirements: 1.2, 3.1_

  - [ ] 10.2 Add accessibility features
    - Implement ARIA labels for group elements
    - Add keyboard navigation support for group selection
    - Ensure screen reader compatibility for group operations
    - _Requirements: 4.1, 4.2_

- [x] 11. Fix integration and test issues




  - [x] 11.1 Fix GroupLayer component integration


    - Fix selectedNodes prop handling to prevent undefined errors
    - Ensure proper integration with ReactFlow context
    - Fix group selection and interaction event handling
    - _Requirements: All requirements_

  - [x] 11.2 Fix GroupRenderer accessibility and interaction


    - Add proper role and accessibility attributes to group elements
    - Fix click event handling for group selection
    - Ensure proper keyboard navigation support
    - _Requirements: 4.1, 4.2, 6.1, 6.2_

  - [x] 11.3 Write comprehensive tests


    - Fix existing failing tests for group components
    - Add missing test coverage for group functionality
    - Test complete group creation and manipulation workflow
    - Test group interaction with ReactFlow canvas
    - _Requirements: All requirements_