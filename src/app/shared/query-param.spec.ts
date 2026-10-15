import { firstQueryParam } from './query-param';

describe('firstQueryParam', () => {
  it('should return the first value', () => {
    expect(firstQueryParam('matrix')).toBe('matrix');
    expect(firstQueryParam(['alien', 'matrix'])).toBe('alien');
  });

  it('should return empty string for anything else', () => {
    expect(firstQueryParam(undefined)).toBe('');
    expect(firstQueryParam(null)).toBe('');
    expect(firstQueryParam([])).toBe('');
    expect(firstQueryParam(42)).toBe('');
  });
});
