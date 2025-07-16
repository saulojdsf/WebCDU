# Implementation Plan

- [ ] 1. Set up theme provider and context
  - Wrap the main App component with ThemeProvider from next-themes
  - Configure theme provider with system preference detection and localStorage persistence
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. Create theme toggle component
  - Build a ThemeToggle component with sun/moon icons using lucide-react
  - Implement toggle functionality with visual feedback and smooth transitions
  - Add proper ARIA labels and accessibility attributes
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Integrate theme toggle into site header
  - Add the ThemeToggle component to the site header menubar
  - Position it appropriately within the existing header layout
  - Ensure it's easily accessible and visible to users
  - _Requirements: 3.1, 3.2_

- [ ] 4. Enhance CSS theme system
  - Verify all existing CSS custom properties work correctly with dark theme
  - Add any missing theme variables for complete component coverage
  - Ensure smooth transitions between light and dark themes
  - _Requirements: 1.2, 1.3, 1.4, 4.1, 4.2, 4.3, 4.4_

- [ ] 5. Test theme persistence and system preference detection
  - Verify theme preference is stored in localStorage correctly
  - Test automatic theme application on page reload
  - Ensure system preference detection works when no manual preference is set
  - Test theme updates when system preference changes
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 6. Validate accessibility and visual consistency
  - Test contrast ratios for all text/background combinations in both themes
  - Verify all UI components (buttons, forms, cards, navigation) display correctly in dark mode
  - Ensure focus indicators and interactive states work in both themes
  - Test keyboard navigation and screen reader compatibility
  - _Requirements: 4.1, 4.2, 4.3, 4.4_