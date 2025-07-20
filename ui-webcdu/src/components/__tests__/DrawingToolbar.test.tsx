import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrawingToolbar } from '../drawing/DrawingToolbar';
import { DrawingProvider } from '@/contexts/DrawingContext';

// Mock the drawing context for testing
const renderWithProvider = (component: React.ReactElement) => {
    return render(
        <DrawingProvider>
            {component}
        </DrawingProvider>
    );
};

describe('DrawingToolbar', () => {
    it('renders drawing mode toggle button', () => {
        renderWithProvider(<DrawingToolbar />);

        const drawingButton = screen.getByRole('button', { name: 'Desenho' });
        expect(drawingButton).toBeInTheDocument();
    });

    it('renders all drawing tool buttons', () => {
        renderWithProvider(<DrawingToolbar />);

        // Check for tool buttons by their titles
        expect(screen.getByTitle('Caneta')).toBeInTheDocument();
        expect(screen.getByTitle('Borracha')).toBeInTheDocument();
        expect(screen.getByTitle('Retângulo')).toBeInTheDocument();
        expect(screen.getByTitle('Círculo')).toBeInTheDocument();
        expect(screen.getByTitle('Linha')).toBeInTheDocument();
    });

    it('enables drawing mode when drawing button is clicked', () => {
        renderWithProvider(<DrawingToolbar />);

        // First enable drawing mode by clicking the drawing button
        const drawingButton = screen.getByRole('button', { name: 'Desenho' });
        fireEvent.click(drawingButton);

        // Drawing mode button should be active (check for default variant class)
        expect(drawingButton).toHaveClass('bg-primary'); // Should have default variant class
    });

    it('shows size slider', () => {
        renderWithProvider(<DrawingToolbar />);

        expect(screen.getByText('Tamanho:')).toBeInTheDocument();
    });

    it('shows color picker for non-eraser tools', () => {
        renderWithProvider(<DrawingToolbar />);

        // Enable drawing mode first
        const penTool = screen.getByTitle('Caneta');
        fireEvent.click(penTool);

        expect(screen.getByText('Cor:')).toBeInTheDocument();
        expect(screen.getByDisplayValue('#000000')).toBeInTheDocument();
    });

    it('shows opacity slider for pen tool', () => {
        renderWithProvider(<DrawingToolbar />);

        // Enable pen tool
        const penTool = screen.getByTitle('Caneta');
        fireEvent.click(penTool);

        expect(screen.getByText('Opacidade:')).toBeInTheDocument();
    });

    it('shows layer control buttons', () => {
        renderWithProvider(<DrawingToolbar />);

        expect(screen.getByTitle(/mostrar desenhos|ocultar desenhos/i)).toBeInTheDocument();
        expect(screen.getByTitle('Limpar todos os desenhos')).toBeInTheDocument();
    });

    it('disables tools when drawing mode is off', () => {
        renderWithProvider(<DrawingToolbar />);

        const penTool = screen.getByTitle('Caneta');
        const eraserTool = screen.getByTitle('Borracha');

        expect(penTool).toBeDisabled();
        expect(eraserTool).toBeDisabled();
    });

    it('enables tools when drawing mode is on', () => {
        renderWithProvider(<DrawingToolbar />);

        // Enable drawing mode
        const drawingButton = screen.getByRole('button', { name: 'Desenho' });
        fireEvent.click(drawingButton);

        const penTool = screen.getByTitle('Caneta');
        const eraserTool = screen.getByTitle('Borracha');

        expect(penTool).not.toBeDisabled();
        expect(eraserTool).not.toBeDisabled();
    });
});