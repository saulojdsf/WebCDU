# Copy and Paste Nodes Feature

## Overview
The copy and paste functionality has been successfully implemented for the Control Loop Designer Webapp. Users can now copy selected nodes and paste them with unique IDs and parameters.

## How to Use

### Copy Nodes
1. Select one or more nodes by clicking on them (hold Ctrl/Cmd for multi-selection)
2. Press **Ctrl+C** to copy the selected nodes
3. A success toast will appear confirming the copy operation

### Paste Nodes
1. After copying nodes, press **Ctrl+V** to paste them
2. The pasted nodes will appear with:
   - **Unique IDs**: Automatically assigned the next available ID (0001-9999)
   - **Unique Vout values**: Generated to avoid conflicts (e.g., X0003, X0004, etc.)
   - **Same parameters**: All other parameters (P1, P2, P3, P4) are copied exactly
   - **Offset position**: Pasted 50px down and right from the original position
   - **Cleared connections**: Vin and Vin2 are reset since connections aren't copied

## Technical Implementation

### Files Created/Modified
- `ui-webcdu/src/hooks/useCopyPaste.ts` - Main copy/paste logic
- `ui-webcdu/src/hooks/useGlobalKeyboardShortcuts.ts` - Added Ctrl+C/Ctrl+V shortcuts
- `ui-webcdu/src/App.tsx` - Integrated copy/paste functionality
- `ui-webcdu/src/hooks/__tests__/useCopyPaste.test.ts` - Comprehensive tests
- `README.md` - Updated documentation

### Key Features
- **Smart ID Management**: Finds the lowest available ID from 0001-9999
- **Vout Conflict Resolution**: Generates unique Vout names when conflicts occur
- **Parameter Preservation**: Copies all node parameters except connections
- **Error Handling**: Shows appropriate error messages for edge cases
- **Toast Notifications**: User-friendly feedback for all operations

### Test Coverage
The implementation includes 7 comprehensive tests covering:
- ✅ Copy single and multiple nodes
- ✅ Paste with unique ID generation
- ✅ Vout conflict resolution
- ✅ Error handling for edge cases
- ✅ ReactFlow instance validation

## Usage Examples

### Basic Copy/Paste
1. Create a GANHO node with P1 = "2.5"
2. Select it and press Ctrl+C
3. Press Ctrl+V to paste
4. Result: New node with same P1 value but unique ID and Vout

### Multi-Node Copy
1. Select multiple nodes (Ctrl+click)
2. Press Ctrl+C to copy all selected
3. Press Ctrl+V to paste all with unique IDs

### Error Scenarios
- Copying with no selection: "No nodes selected to copy"
- Pasting with nothing copied: "No nodes to paste"
- Canvas not ready: "Canvas not ready for pasting"

## Keyboard Shortcuts
- **Ctrl+C**: Copy selected nodes
- **Ctrl+V**: Paste copied nodes
- **Delete/Backspace**: Delete selected nodes (existing)
- **Ctrl+G**: Group selected nodes (existing)
- **Ctrl+Shift+G**: Ungroup selected groups (existing)

The copy/paste feature integrates seamlessly with existing keyboard shortcuts and maintains the application's user experience standards.