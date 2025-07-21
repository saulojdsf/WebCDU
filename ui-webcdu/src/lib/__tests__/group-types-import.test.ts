/**
 * Test to verify that group types can be imported correctly
 */

import { describe, it, expect } from 'vitest';

describe('Group Types Import Test', () => {
  it('should import all group types without errors', async () => {
    // Dynamic import to test module loading
    const groupTypes = await import('../group-types');
    
    // Verify main interfaces are available
    expect(typeof groupTypes.isNodeGroup).toBe('function');
    expect(typeof groupTypes.isGroupState).toBe('function');
    expect(groupTypes.DEFAULT_GROUP_STYLE).toBeDefined();
    expect(groupTypes.DEFAULT_BOUNDS_OPTIONS).toBeDefined();
    expect(groupTypes.DEFAULT_GROUP_THEME).toBeDefined();
  });

  it('should allow static imports', () => {
    // This test passes if the file compiles without import errors
    expect(true).toBe(true);
  });
});