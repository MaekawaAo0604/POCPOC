import { kv } from '@vercel/kv';

/**
 * Vercel KV キープレフィックス定義
 * 1つのDBでキープレフィックスによりデータを分離
 */
export const KEYS = {
  /** PoC データ (TTL 24時間) - フィードバックも直接埋め込み */
  poc: (id: string) => `poc:${id}`,

  /** 共有トークン → pocId マッピング (TTL 24時間) */
  share: (token: string) => `share:${token}`,

  /** @deprecated フィードバックはPoCデータに直接埋め込むため不使用 */
  feedbacks: 'feedbacks',
} as const;

/**
 * デフォルトTTL (24時間 = 86400秒)
 */
export const DEFAULT_TTL_SECONDS = Number(
  process.env.POC_TTL_SECONDS || 86400
);

/**
 * KVクライアントをエクスポート
 */
export { kv };
