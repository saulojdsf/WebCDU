import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GroupRenderer } from '../GroupRenderer';
import type { NodeGroup } from '@/lib/group-types';

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

describe('GroupRenderer', () => {
    const mockOnSelect = vi.fn();
    const mockOnTitleEdit = vi.fn();
    const mockOnTitleEditStart = vi.fn();
    const mockOnTitleEditEnd = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders group with correct styling', () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');
        expect(groupElement).toBeInTheDocument();

        const titleElement = screen.getByTestId('group-title-group-1');
        expect(titleElement).toHaveTextContent('Test Group');
    });

    it('calls onSelect when group background is clicked', () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');
        fireEvent.click(groupElement);

        expect(mockOnSelect).toHaveBeenCalledWith('group-1', expect.any(Object));
    });

    it('enters edit mode when title is double-clicked', () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
                onTitleEditStart={mockOnTitleEditStart}
            />
        );

        const titleElement = screen.getByTestId('group-title-group-1');
        fireEvent.doubleClick(titleElement);

        expect(mockOnTitleEditStart).toHaveBeenCalledWith('group-1');
        expect(screen.getByTestId('group-title-input-group-1')).toBeInTheDocument();
    });

    it('saves title changes when Enter is pressed', async () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
                onTitleEditEnd={mockOnTitleEditEnd}
            />
        );

        // Enter edit mode
        const titleElement = screen.getByTestId('group-title-group-1');
        fireEvent.doubleClick(titleElement);

        // Edit the title
        const inputElement = screen.getByTestId('group-title-input-group-1');
        fireEvent.change(inputElement, { target: { value: 'New Title' } });
        fireEvent.keyDown(inputElement, { key: 'Enter' });

        await waitFor(() => {
            expect(mockOnTitleEdit).toHaveBeenCalledWith('group-1', 'New Title');
            expect(mockOnTitleEditEnd).toHaveBeenCalledWith('group-1');
        });
    });

    it('cancels title editing when Escape is pressed', async () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
                onTitleEditEnd={mockOnTitleEditEnd}
            />
        );

        // Enter edit mode
        const titleElement = screen.getByTestId('group-title-group-1');
        fireEvent.doubleClick(titleElement);

        // Edit the title and cancel
        const inputElement = screen.getByTestId('group-title-input-group-1');
        fireEvent.change(inputElement, { target: { value: 'New Title' } });
        fireEvent.keyDown(inputElement, { key: 'Escape' });

        await waitFor(() => {
            expect(mockOnTitleEdit).not.toHaveBeenCalled();
            expect(mockOnTitleEditEnd).toHaveBeenCalledWith('group-1');
        });
    });

    it('applies selected styling when isSelected is true', () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={true}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');
        expect(groupElement).toHaveAttribute('aria-selected', 'true');
    });

    it('has proper accessibility attributes', () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');
        expect(groupElement).toHaveAttribute('role', 'group');
        expect(groupElement).toHaveAttribute('aria-label', 'Group: Test Group');
        expect(groupElement).toHaveAttribute('tabIndex', '0');
        expect(groupElement).toHaveAttribute('aria-describedby', 'group-title-group-1');

        const titleElement = screen.getByTestId('group-title-group-1');
        expect(titleElement).toHaveAttribute('role', 'button');
        expect(titleElement).toHaveAttribute('tabIndex', '0');
        expect(titleElement).toHaveAttribute('aria-label', 'Group title: Test Group. Double-click to edit.');
        expect(titleElement).toHaveAttribute('id', 'group-title-group-1');
    });

    it('supports keyboard navigation for group selection', () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
            />
        );

        const groupElement = screen.getByTestId('group-group-1');

        // Test Enter key
        fireEvent.keyDown(groupElement, { key: 'Enter' });
        expect(mockOnSelect).toHaveBeenCalledWith('group-1', expect.objectContaining({
            ctrlKey: false,
            metaKey: false
        }));

        mockOnSelect.mockClear();

        // Test Space key
        fireEvent.keyDown(groupElement, { key: ' ' });
        expect(mockOnSelect).toHaveBeenCalledWith('group-1', expect.objectContaining({
            ctrlKey: false,
            metaKey: false
        }));
    });

    it('supports keyboard navigation for title editing', async () => {
        render(
            <GroupRenderer
                group={mockGroup}
                isSelected={false}
                onSelect={mockOnSelect}
                onTitleEdit={mockOnTitleEdit}
                onTitleEditStart={mockOnTitleEditStart}
            />
        );

        const titleElement = screen.getByTestId('group-title-group-1');

        // Test Enter key to start editing
        fireEvent.keyDown(titleElement, { key: 'Enter' });

        await waitFor(() => {
            expect(mockOnTitleEditStart).toHaveBeenCalledWith('group-1');
            expect(screen.getByTestId('group-title-input-group-1')).toBeInTheDocument();
        });
    });
});