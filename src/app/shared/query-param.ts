// Angular gives an array for repeated params (?q=a&q=b). Take the first one.
export function firstQueryParam(value: unknown): string {
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : '';
}
