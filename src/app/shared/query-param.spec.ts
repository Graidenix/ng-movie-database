import { firstQueryParam } from './query-param';

describe('firstQueryParam', () => {
  it('keeps a single value and takes the first of repeated values', () => {
    expect(firstQueryParam('matrix')).toBe('matrix');
    expect(firstQueryParam(['alien', 'matrix'])).toBe('alien');
  });

  it('turns missing or non-string values into an empty string', () => {
    expect(firstQueryParam(undefined)).toBe('');
    expect(firstQueryParam(null)).toBe('');
    expect(firstQueryParam([])).toBe('');
    expect(firstQueryParam(42)).toBe('');
  });
});
