import { nanoid } from 'nanoid';

/**
 * PoC ID生成
 * URL-safe, 一意性保証
 * @returns 21文字のランダムID
 */
export function generatePocId(): string {
  return nanoid(21);
}

/**
 * 共有トークン生成
 * セキュリティ強化のため長めのトークン
 * @returns 32文字のランダムトークン
 */
export function generateShareToken(): string {
  return nanoid(32);
}
