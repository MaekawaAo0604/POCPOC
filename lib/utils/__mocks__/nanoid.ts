/**
 * nanoid mock for Jest
 * ESM-only のnanoidをJestで使用するためのモック
 */

export function nanoid(size: number = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function customAlphabet(alphabet: string, defaultSize?: number) {
  return (size: number = defaultSize || 21): string => {
    let result = '';
    for (let i = 0; i < size; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
  };
}

export const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
