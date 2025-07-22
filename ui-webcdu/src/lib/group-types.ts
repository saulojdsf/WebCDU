/**
 * Group functionality types and interfaces for node grouping feature
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the node grouping functionality, providing a centralized type system for
 * better maintainability and type safety.
 */

import type { Node, Edge } from 'reactflow';
import type { Parameter } from '../contexts/ParameterContext';

/**
 * Bounds interface for group positioning and sizing
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Group style configuration
 */
export interface GroupStyle {
  backgroundColor: string;
  borderColor: string;
  borderRadius: number;
  borderWidth?: number;
  opacity?: number;
}

/**
 * Core NodeGroup interface representing a group of nodes
 */
export interface NodeGroup {
  /** Unique identifier for the group */
  id: string;
  /** Display title for the group */
  title: string;
  /** Array of node IDs that belong to this group */
  nodeIds: string[];
  /** Calculated bounds of the group based on member nodes */
  bounds: Bounds;
  /** Visual styling properties for the group */
  style: GroupStyle;
  /** Z-index for rendering order (groups render behind nodes) */
  zIndex: number;
  /** Timestamp when the group was created */
  createdAt: number;
  /** Timestamp when the group was last modified */
  updatedAt: number;
}

/**
 * Group state management interface
 */
export interface GroupState {
  /** Array of all groups in the diagram */
  groups: NodeGroup[];
  /** Array of currently selected group IDs */
  selectedGroupIds: string[];
  /** Counter for generating default group names */
  groupCounter: number;
}

/**
 * Extended diagram state that includes group information
 */
export interface DiagramState {
  /** ReactFlow nodes */
  nodes: Node[];
  /** ReactFlow edges */
  edges: Edge[];
  /** Group state */
  groupState: GroupState;
  /** Selected node IDs */
  selectedNodeIds: string[];
  /** Selected edge IDs */
  selectedEdgeIds: string[];
  /** Parameters for the diagram */
  parameters: Parameter[];
}

/**
 * Group creation parameters
 */
export interface CreateGroupParams {
  /** Node IDs to include in the group */
  nodeIds: string[];
  /** Optional title for the group */
  title?: string;
  /** Optional custom styling */
  style?: Partial<GroupStyle>;
}

/**
 * Group update parameters
 */
export interface UpdateGroupParams {
  /** Group ID to update */
  groupId: string;
  /** Optional new title */
  title?: string;
  /** Optional new styling */
  style?: Partial<GroupStyle>;
  /** Optional new node membership */
  nodeIds?: string[];
}

/**
 * Group operation result
 */
export interface GroupOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Optional error message if operation failed */
  error?: string;
  /** The affected group (for successful operations) */
  group?: NodeGroup;
}

/**
 * Group selection state
 */
export interface GroupSelection {
  /** Currently selected group IDs */
  groupIds: string[];
  /** Whether multiple groups are selected */
  isMultiSelect: boolean;
  /** Last selected group ID (for multi-select operations) */
  lastSelectedId?: string;
}

/**
 * Group interaction event types
 */
export type GroupInteractionEvent =
  | 'group-select'
  | 'group-deselect'
  | 'group-drag-start'
  | 'group-drag'
  | 'group-drag-end'
  | 'group-title-edit'
  | 'group-delete'
  | 'group-ungroup';

/**
 * Group event handler parameters
 */
export interface GroupEventParams {
  /** The group involved in the event */
  group: NodeGroup;
  /** The type of event */
  event: GroupInteractionEvent;
  /** Optional additional data */
  data?: any;
}

/**
 * Group persistence format for save/load operations
 */
export interface GroupPersistenceData {
  /** Version of the group data format */
  version: string;
  /** Array of groups to persist */
  groups: NodeGroup[];
  /** Metadata about the group data */
  metadata: {
    /** Total number of groups */
    totalGroups: number;
    /** Timestamp when data was saved */
    savedAt: number;
    /** Application version that saved the data */
    appVersion?: string;
  };
}

/**
 * Group validation result
 */
export interface GroupValidationResult {
  /** Whether the group data is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: string[];
  /** Array of validation warnings */
  warnings: string[];
}

/**
 * Group bounds calculation options
 */
export interface BoundsCalculationOptions {
  /** Padding around the group bounds */
  padding: number;
  /** Minimum width for the group */
  minWidth: number;
  /** Minimum height for the group */
  minHeight: number;
  /** Whether to include node handles in bounds calculation */
  includeHandles: boolean;
}

/**
 * Group theme configuration
 */
export interface GroupTheme {
  /** Light theme colors */
  light: {
    backgroundColor: string;
    borderColor: string;
    selectedBorderColor: string;
    titleColor: string;
  };
  /** Dark theme colors */
  dark: {
    backgroundColor: string;
    borderColor: string;
    selectedBorderColor: string;
    titleColor: string;
  };
}

/**
 * Group context menu item
 */
export interface GroupContextMenuItem {
  /** Unique identifier for the menu item */
  id: string;
  /** Display label */
  label: string;
  /** Icon name (if using icon library) */
  icon?: string;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick: (group: NodeGroup) => void;
  /** Whether to show a separator after this item */
  separator?: boolean;
}

/**
 * Default group style configuration
 */
export const DEFAULT_GROUP_STYLE: GroupStyle = {
  backgroundColor: 'rgba(59, 130, 246, 0.1)',
  borderColor: 'rgb(59, 130, 246)',
  borderRadius: 8,
  borderWidth: 2,
  opacity: 1,
};

/**
 * Default bounds calculation options
 */
export const DEFAULT_BOUNDS_OPTIONS: BoundsCalculationOptions = {
  padding: 20,
  minWidth: 100,
  minHeight: 60,
  includeHandles: true,
};

/**
 * Default group theme
 */
export const DEFAULT_GROUP_THEME: GroupTheme = {
  light: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgb(59, 130, 246)',
    selectedBorderColor: 'rgb(37, 99, 235)',
    titleColor: 'rgb(30, 58, 138)',
  },
  dark: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderColor: 'rgb(96, 165, 250)',
    selectedBorderColor: 'rgb(147, 197, 253)',
    titleColor: 'rgb(191, 219, 254)',
  },
};

/**
 * Type guard to check if an object is a valid NodeGroup
 */
export function isNodeGroup(obj: any): obj is NodeGroup {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    Array.isArray(obj.nodeIds) &&
    obj.bounds &&
    typeof obj.bounds === 'object' &&
    typeof obj.bounds.x === 'number' &&
    typeof obj.bounds.y === 'number' &&
    typeof obj.bounds.width === 'number' &&
    typeof obj.bounds.height === 'number' &&
    obj.style &&
    typeof obj.style === 'object' &&
    typeof obj.style.backgroundColor === 'string' &&
    typeof obj.style.borderColor === 'string' &&
    typeof obj.style.borderRadius === 'number'
  );
}

/**
 * Type guard to check if an object is valid GroupState
 */
export function isGroupState(obj: any): obj is GroupState {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return (
    Array.isArray(obj.groups) &&
    Array.isArray(obj.selectedGroupIds) &&
    typeof obj.groupCounter === 'number'
  );
}

/**
 * Helper type for group event handlers
 */
export type GroupEventHandler = (params: GroupEventParams) => void;

/**
 * Helper type for group state update functions
 */
export type GroupStateUpdater = (prevState: GroupState) => GroupState;

/**
 * Arrangement group representation for group-aware arrangement
 */
export interface ArrangementGroup {
  /** Group ID */
  id: string;
  /** Node IDs that belong to this group */
  nodeIds: string[];
  /** Current bounds of the group */
  bounds: Bounds;
  /** Whether to treat this group as a single unit during arrangement */
  treatAsUnit: boolean;
  /** Center point of the group for positioning calculations */
  center: { x: number; y: number };
  /** Priority for arrangement (higher numbers get arranged first) */
  priority?: number;
}

/**
 * Configuration options for group-aware arrangement
 */
export interface GroupArrangementOptions {
  /** Whether to respect group boundaries during arrangement */
  respectGroups: boolean;
  /** Whether to arrange nodes within groups */
  arrangeWithinGroups: boolean;
  /** Whether to maintain group structure during arrangement */
  maintainGroupStructure: boolean;
  /** Minimum spacing between groups */
  groupSpacing: number;
  /** Whether to expand groups to fit rearranged nodes */
  expandGroupsToFit: boolean;
  /** Strategy for handling ungrouped nodes */
  ungroupedNodeStrategy: 'ignore' | 'treat-as-individual-groups' | 'arrange-freely';
}

/**
 * Result of group-aware arrangement operation
 */
export interface GroupArrangementResult {
  /** Whether the arrangement was successful */
  success: boolean;
  /** Updated node positions */
  nodePositions: Array<{ id: string; x: number; y: number }>;
  /** Updated group bounds */
  updatedGroups: NodeGroup[];
  /** Error message if arrangement failed */
  error?: string;
}

/**
 * Default group arrangement options
 */
export const DEFAULT_GROUP_ARRANGEMENT_OPTIONS: GroupArrangementOptions = {
  respectGroups: true,
  arrangeWithinGroups: true,
  maintainGroupStructure: true,
  groupSpacing: 50,
  expandGroupsToFit: true,
  ungroupedNodeStrategy: 'treat-as-individual-groups',
};