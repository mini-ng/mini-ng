export function isAlphanumeric(value: string): boolean {
  return /^[0-9a-zA-Z]+$/.test(value);
}

export function nextChar(str: string, index: number): string | null {
  if (index + 1 >= str.length) return null;
  return str[index + 1];
}

export function containsQuotes(ch: string): boolean {
  return ch === '"' || ch === "'";
}
