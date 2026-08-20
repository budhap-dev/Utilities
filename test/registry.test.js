/**
 * @jest-environment jsdom
 */
import { TOOLS, getTool, searchTools } from '../src/registry';

describe('registry', () => {
  test('every tool is well-formed and unique', () => {
    const ids = new Set();
    TOOLS.forEach((t) => {
      expect(t.id).toMatch(/^[a-z0-9-]+$/);
      expect(ids.has(t.id)).toBe(false);
      ids.add(t.id);
      expect(typeof t.name).toBe('string');
      expect(typeof t.group).toBe('string');
      expect(typeof t.description).toBe('string');
      expect(t.icon).toBeTruthy();
      expect(t.component).toBeTruthy();
    });
  });
  test('lookup & search', () => {
    expect(getTool('json-parser').name).toBe('JSON Parser');
    expect(searchTools('epoch').map((t) => t.id)).toContain('datetime');
    expect(searchTools('zzzz')).toEqual([]);
  });
});
