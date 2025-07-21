import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../useTheme';
import React from 'react';

// Mock next-themes
vi.mock('next-themes', () => {
    const mockSetTheme = vi.fn();

    return {
        useTheme: () => ({
            theme: vi.fn().mockReturnValue('light'),
            setTheme: mockSetTheme,
            systemTheme: 'light',
            themes: ['light', 'dark', 'system'],
        }),
    };
});

// Create a wrapper for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

describe('useTheme', () => {
    it('should provide theme functionality', () => {
        const { result } = renderHook(() => useTheme(), { wrapper });

        expect(result.current).toHaveProperty('theme');
        expect(result.current).toHaveProperty('setTheme');
        expect(result.current).toHaveProperty('toggleTheme');
        expect(typeof result.current.toggleTheme).toBe('function');
    });
});