/**
 * Normalizes a URL query param to one string. Angular returns an array when the param repeats
 * (`?q=alien&q=matrix`); the first value wins. Anything else becomes ''.
 */
export function firstQueryParam(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : '';
}
