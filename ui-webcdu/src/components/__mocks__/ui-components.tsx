/**
 * Mock UI components for testing
 */
import React from 'react';

// Mock Label component
export const Label = (props: any) => <label data-testid="label" {...props} />;

// Mock Input component
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => <input data-testid="search-input" ref={ref} {...props} />
);

// Mock Button component
export const Button = (props: any) => <button data-testid="button" {...props} />;

// Mock Tooltip components
export const Tooltip = ({ children }: any) => <div data-testid="tooltip">{children}</div>;
export const TooltipContent = ({ children }: any) => <div data-testid="tooltip-content">{children}</div>;
export const TooltipProvider = ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>;
export const TooltipTrigger = ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>;

// Mock VisuallyHidden component
export const VisuallyHidden = ({ children }: any) => <div data-testid="visually-hidden">{children}</div>;

// Mock cn utility
export const cn = (...args: any[]) => args.filter(Boolean).join(' ');