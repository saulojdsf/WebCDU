import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactFlowProvider } from 'reactflow';
import { GroupLayer } from '../GroupLayer';
import { useGroupState } from '@/hooks/useGroupState';
import type { NodeGroup } from '@/lib/group-types';

// Mock next-themes
vi.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light' }),
}));

// Mock useGroupState hook
const mockGroupState = {
    groups: [] as NodeGroup[],
    selectedGroupIds: [] as string[],
    groupCounter: 0,
};

const mockGroupStateManager = {
    groupState: mockGroupState,
    createGroup: vi.fn(),
    updateGroupTitle: vi.fn(),
    deleteGroup: vi.fn(),
    selectGroups: vi.fn(),
    toggleGroupSelection: vi.fn(),
    clearSelection: vi.fn(),
    updateAllGroupBounds: vi.fn(),
};

vi.mock('@/hooks/useGroupState', () => ({
    useGroupState: () => mockGroupStateManager,
}));

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
    {
        id: 'node-3',
        type: 'default',
        position: { x: 300, y: 300 },
        data: { label: 'Node 3' },
    },
];

describe('Group Workflow Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGroupState.groups = [];
        mockGroupState.selectedGroupIds = [];
        mockGroupState.groupCounter = 0;
    });

    const renderWithReactFlow = (component: React.ReactElement) => {
        return render(
            <ReactFlowProvider>
                {component}
            </ReactFlowProvider>
        );
    };

    it('completes full group creation workflow', async () => {
        const mockGroup: NodeGroup = {
            id: 'group-1',
            title: 'Test Group',
            nodeIds: ['node-1', 'node-2'],
            bounds: {
                x: 100,
                y: 100,
                width: 200,
                height: 200,
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

        // Mock successful group creation
        mockGroupStateManager.createGroup.mockReturnValue({
            success: true,
            group: mockGroup,
        });

        const contextMenu = {
            groupId: null,
            x: 100,
            y: 100,
            type: 'canvas' as const,
        };

        renderWithReactFlow(
            <GroupLayer
                groups={[]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager}
                selectedNodes={['node-1', 'node-2']}
                contextMenu={contextMenu}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Verify context menu shows group option
        expect(screen.getByText('Group')).toBeInTheDocument();

        // Click group option
        fireEvent.click(screen.getByText('Group'));

        // Verify group creation dialog appears
        await waitFor(() => {
            expect(screen.getByText('Enter Group Title')).toBeInTheDocument();
        });

        // Enter group title
        const titleInput = screen.getByRole('textbox');
        fireEvent.change(titleInput, { target: { value: 'Test Group' } });

        // Submit group creation
        fireEvent.click(screen.getByText('Create Group'));

        // Verify group creation was called
        await waitFor(() => {
            expect(mockGroupStateManager.createGroup).toHaveBeenCalledWith(
                { nodeIds: ['node-1', 'node-2'], title: 'Test Group' },
                mockNodes
            );
        });
    });

    it('handles group selection and manipulation', async () => {
        const mockGroup: NodeGroup = {
            id: 'group-1',
            title: 'Test Group',
            nodeIds: ['node-1', 'node-2'],
            bounds: {
                x: 100,
                y: 100,
                width: 200,
                height: 200,
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

        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Find and click on group
        const groupElement = screen.getByTestId('group-group-1');
        fireEvent.click(groupElement);

        // Verify group selection was called
        expect(mockGroupStateManager.selectGroups).toHaveBeenCalledWith(['group-1']);
    });

    it('handles group title editing workflow', async () => {
        const mockGroup: NodeGroup = {
            id: 'group-1',
            title: 'Original Title',
            nodeIds: ['node-1', 'node-2'],
            bounds: {
                x: 100,
                y: 100,
                width: 200,
                height: 200,
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

        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Double-click on group title to start editing
        const titleElement = screen.getByTestId('group-title-group-1');
        fireEvent.doubleClick(titleElement);

        // Verify edit input appears
        await waitFor(() => {
            expect(screen.getByTestId('group-title-input-group-1')).toBeInTheDocument();
        });

        // Edit the title
        const inputElement = screen.getByTestId('group-title-input-group-1');
        fireEvent.change(inputElement, { target: { value: 'New Title' } });
        fireEvent.keyDown(inputElement, { key: 'Enter' });

        // Verify title update was called
        await waitFor(() => {
            expect(mockGroupStateManager.updateGroupTitle).toHaveBeenCalledWith('group-1', 'New Title');
        });
    });

    it('handles group ungrouping workflow', async () => {
        const mockGroup: NodeGroup = {
            id: 'group-1',
            title: 'Test Group',
            nodeIds: ['node-1', 'node-2'],
            bounds: {
                x: 100,
                y: 100,
                width: 200,
                height: 200,
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

        const contextMenu = {
            groupId: 'group-1',
            x: 100,
            y: 100,
            type: 'group' as const,
        };

        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager}
                selectedNodes={[]}
                contextMenu={contextMenu}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Verify context menu shows ungroup option
        expect(screen.getByText('Ungroup')).toBeInTheDocument();

        // Click ungroup option
        fireEvent.click(screen.getByText('Ungroup'));

        // Verify ungroup confirmation dialog appears
        await waitFor(() => {
            expect(screen.getByText('Delete Group')).toBeInTheDocument();
        });

        // Choose to ungroup (keep nodes)
        fireEvent.click(screen.getByText('Ungroup (Keep Nodes)'));

        // Verify group deletion was called
        await waitFor(() => {
            expect(mockGroupStateManager.deleteGroup).toHaveBeenCalledWith('group-1');
        });
    });

    it('handles multi-group selection', async () => {
        const mockGroup1: NodeGroup = {
            id: 'group-1',
            title: 'Group 1',
            nodeIds: ['node-1'],
            bounds: { x: 100, y: 100, width: 100, height: 100 },
            style: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgb(59, 130, 246)', borderRadius: 8 },
            zIndex: -1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const mockGroup2: NodeGroup = {
            id: 'group-2',
            title: 'Group 2',
            nodeIds: ['node-2'],
            bounds: { x: 200, y: 200, width: 100, height: 100 },
            style: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgb(59, 130, 246)', borderRadius: 8 },
            zIndex: -1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup1, mockGroup2]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Click first group
        const group1Element = screen.getByTestId('group-group-1');
        fireEvent.click(group1Element);

        // Verify single selection
        expect(mockGroupStateManager.selectGroups).toHaveBeenCalledWith(['group-1']);

        // Ctrl+click second group for multi-selection
        const group2Element = screen.getByTestId('group-group-2');
        fireEvent.click(group2Element, { ctrlKey: true });

        // Verify multi-selection toggle was called
        expect(mockGroupStateManager.toggleGroupSelection).toHaveBeenCalledWith('group-2');
    });

    it('handles empty state correctly', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Verify layer exists but is empty
        const layerElement = screen.getByTestId('group-layer');
        expect(layerElement).toBeInTheDocument();
        expect(layerElement.children).toHaveLength(0);
    });
});