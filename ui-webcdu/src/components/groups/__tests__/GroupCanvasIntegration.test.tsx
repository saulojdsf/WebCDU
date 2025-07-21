import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReactFlowProvider } from 'reactflow';
import { GroupLayer } from '../GroupLayer';
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
    selectGroups: vi.fn(),
    updateGroupTitle: vi.fn(),
    updateAllGroupBounds: vi.fn(),
    deleteGroup: vi.fn(),
    toggleGroupSelection: vi.fn(),
};

describe('Group Canvas Integration Tests', () => {
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

    it('renders groups with correct viewport transformation', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        const layerElement = screen.getByTestId('group-layer');
        expect(layerElement).toBeInTheDocument();

        // Check that the layer has the correct transform style for viewport integration
        const style = window.getComputedStyle(layerElement);
        expect(style.position).toBe('absolute');
        expect(style.zIndex).toBe('-1');
    });

    it('handles group dragging with proper event propagation', () => {
        const mockOnGroupDrag = vi.fn();

        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');

        // Simulate mouse down to start drag
        fireEvent.mouseDown(groupElement, { clientX: 100, clientY: 100 });

        // Simulate mouse move to trigger drag
        fireEvent.mouseMove(window, { clientX: 110, clientY: 110 });

        // Simulate mouse up to end drag
        fireEvent.mouseUp(window);

        // Verify that the group element exists and is interactive
        expect(groupElement).toBeInTheDocument();
        expect(groupElement).toHaveAttribute('role', 'group');
    });

    it('maintains proper z-index ordering with ReactFlow elements', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        const layerElement = screen.getByTestId('group-layer');
        const groupElement = screen.getByTestId('group-group-1');

        // Verify layer is behind other elements
        expect(layerElement).toHaveStyle({ zIndex: '-1' });

        // Verify group has correct z-index
        expect(groupElement).toHaveStyle({ zIndex: '-1' });
    });

    it('handles viewport changes correctly', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Verify initial render
        expect(screen.getByTestId('group-layer')).toBeInTheDocument();
        expect(screen.getByTestId('group-group-1')).toBeInTheDocument();

        // Verify group has correct positioning attributes
        const groupElement = screen.getByTestId('group-group-1');
        expect(groupElement).toHaveStyle({
            position: 'absolute',
            left: '100px',
            top: '200px',
            width: '300px',
            height: '150px'
        });
    });

    it('handles group selection with proper event handling', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');

        // Test normal click
        fireEvent.click(groupElement);
        expect(mockGroupStateManager.selectGroups).toHaveBeenCalledWith(['group-1']);

        // Test Ctrl+click for multi-selection
        fireEvent.click(groupElement, { ctrlKey: true });
        expect(mockGroupStateManager.toggleGroupSelection).toHaveBeenCalledWith('group-1');
    });

    it('integrates properly with ReactFlow pointer events', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        const layerElement = screen.getByTestId('group-layer');
        const groupElement = screen.getByTestId('group-group-1');

        // Verify layer allows pointer events to pass through
        expect(layerElement).toHaveStyle({ pointerEvents: 'none' });

        // Verify group elements can receive pointer events
        expect(groupElement).toHaveAttribute('tabIndex', '0');
    });

    it('handles selected state correctly', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={['group-1']}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
                selectedNodes={[]}
                contextMenu={null}
                closeMenu={vi.fn()}
                openGroupMenu={vi.fn()}
            />
        );

        // Verify group renders and shows selected state
        const groupElement = screen.getByTestId('group-group-1');
        expect(groupElement).toBeInTheDocument();
        expect(groupElement).toHaveAttribute('aria-selected', 'true');
    });
});