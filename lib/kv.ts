import { kv } from '@vercel/kv';

/**
 * Vercel KV キープレフィックス定義
 * 1つのDBでキープレフィックスによりデータを分離
 */
export const KEYS = {
  /** PoC データ (TTL 24時間) */
  poc: (id: string) => `poc:${id}`,

  /** 共有トークン → pocId マッピング (TTL 24時間) */
  share: (token: string) => `share:${token}`,

  /** フィードバックリスト (永続保存) */
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
