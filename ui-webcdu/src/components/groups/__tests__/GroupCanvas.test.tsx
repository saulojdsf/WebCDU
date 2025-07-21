import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactFlowProvider } from 'reactflow';
import { GroupCanvas } from '../GroupCanvas';
import type { NodeGroup } from '@/lib/group-types';
import type { UseGroupStateReturn } from '@/hooks/useGroupState';

// Mock next-themes
vi.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

const mockGroup: NodeGroup = {
    id: 'group-1',
    title: 'Test Group',
    nodeIds: ['node-1', 'node-2'],
    bounds: {
        x: 100,
        y: 200,
        width: 300,
        height: 150,
    },
    style: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderRadius: 8,
    },
    zIndex: -1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
};

const mockNodes = [
    {
        id: 'node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'Node 1' },
    },
    {
        id: 'node-2',
        type: 'default',
        position: { x: 200, y: 200 },
        data: { label: 'Node 2' },
    },
];

const mockGroupStateManager: Partial<UseGroupStateReturn> = {
    groupState: {
        groups: [mockGroup],
        selectedGroupIds: [],
        groupCounter: 1,
    },
    hasGroups: true,
    updateAllGroupBounds: vi.fn(),
    deleteGroup: vi.fn(),
    removeNodesFromGroup: vi.fn(),
};

describe('GroupCanvas', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithReactFlow = (component: React.ReactElement) => {
        return render(
            <ReactFlowProvider>
                {component}
            </ReactFlowProvider>
        );
    };

    it('renders group canvas with children', () => {
        renderWithReactFlow(
            <GroupCanvas
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            >
                <div data-testid="child-content">Child Content</div>
            </GroupCanvas>
        );

        expect(screen.getByTestId('group-canvas')).toBeInTheDocument();
        expect(screen.getByTestId('group-layer')).toBeInTheDocument();
        expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('renders groups in the layer', () => {
        renderWithReactFlow(
            <GroupCanvas
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        expect(screen.getByTestId('group-group-1')).toBeInTheDocument();
    });

    it('updates group bounds when nodes change', () => {
        const { rerender } = renderWithReactFlow(
            <GroupCanvas
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        // Change nodes
        const newNodes = [
            ...mockNodes,
            {
                id: 'node-3',
                type: 'default',
                position: { x: 300, y: 300 },
                data: { label: 'Node 3' },
            },
        ];

        rerender(
            <ReactFlowProvider>
                <GroupCanvas
                    nodes={newNodes}
                    groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                />
            </ReactFlowProvider>
        );

        expect(mockGroupStateManager.updateAllGroupBounds).toHaveBeenCalledWith(newNodes);
    });

    it('handles orphaned groups when nodes are deleted', () => {
        const groupWithMissingNode: NodeGroup = {
            ...mockGroup,
            nodeIds: ['node-1', 'node-missing'],
        };

        const groupStateWithMissingNode = {
            ...mockGroupStateManager,
            groupState: {
                groups: [groupWithMissingNode],
                selectedGroupIds: [],
                groupCounter: 1,
            },
        };

        renderWithReactFlow(
            <GroupCanvas
                nodes={[mockNodes[0]]} // Only node-1 exists
                groupStateManager={groupStateWithMissingNode as UseGroupStateReturn}
            />
        );

        // Should delete the group since it would have less than 2 nodes
        expect(groupStateWithMissingNode.deleteGroup).toHaveBeenCalledWith('group-1');
    });
});