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
};

describe('GroupLayer', () => {
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

    it('renders group layer with groups', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        expect(screen.getByTestId('group-layer')).toBeInTheDocument();
        expect(screen.getByTestId('group-group-1')).toBeInTheDocument();
    });

    it('handles group selection', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');
        fireEvent.click(groupElement);

        expect(mockGroupStateManager.selectGroups).toHaveBeenCalledWith(['group-1']);
    });

    it('handles group title editing', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        const titleElement = screen.getByTestId('group-title-group-1');
        fireEvent.doubleClick(titleElement);

        const inputElement = screen.getByTestId('group-title-input-group-1');
        fireEvent.change(inputElement, { target: { value: 'New Title' } });
        fireEvent.keyDown(inputElement, { key: 'Enter' });

        expect(mockGroupStateManager.updateGroupTitle).toHaveBeenCalledWith('group-1', 'New Title');
    });

    it('shows selected state for selected groups', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[mockGroup]}
                selectedGroupIds={['group-1']}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');
        expect(groupElement).toHaveAttribute('aria-selected', 'true');
    });

    it('renders empty layer when no groups', () => {
        renderWithReactFlow(
            <GroupLayer
                groups={[]}
                selectedGroupIds={[]}
                nodes={mockNodes}
                groupStateManager={mockGroupStateManager as UseGroupStateReturn}
            />
        );

        const layerElement = screen.getByTestId('group-layer');
        expect(layerElement).toBeInTheDocument();
        expect(layerElement.children).toHaveLength(0);
    });
});