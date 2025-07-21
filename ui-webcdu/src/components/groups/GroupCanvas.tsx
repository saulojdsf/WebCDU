import React, { useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import type { Node } from 'reactflow';
import { GroupLayer } from './GroupLayer';
import type { UseGroupStateReturn } from '@/hooks/useGroupState';

interface GroupCanvasProps {
    nodes: Node[];
    groupStateManager: UseGroupStateReturn;
    selectedNodes: string[];
    children?: React.ReactNode;
}

/**
 * GroupCanvas is now a simple passthrough wrapper for children.
 * GroupLayer must be rendered inside ReactFlow to access context.
 */
export const GroupCanvas: React.FC<GroupCanvasProps> = ({
    children,
}) => {
    return <>{children}</>;
};

export default GroupCanvas;