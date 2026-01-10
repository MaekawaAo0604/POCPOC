/**
 * Tailwind CSS クラス名結合ユーティリティ
 * clsx と tailwind-merge の軽量実装
 */

type ClassValue = string | undefined | null | false | ClassValue[];

function toVal(mix: ClassValue): string {
  if (typeof mix === 'string') return mix;
  if (Array.isArray(mix)) {
    return mix.map(toVal).filter(Boolean).join(' ');
  }
  return '';
}

/**
 * 複数のクラス名を結合する
 * falsy な値は無視される
 */
export function cn(...inputs: ClassValue[]): string {
  return inputs
    .map(toVal)
    .filter(Boolean)
    .join(' ')
    .split(' ')
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(' ');
}
