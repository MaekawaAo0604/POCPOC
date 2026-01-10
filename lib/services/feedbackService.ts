/**
 * FeedbackService - フィードバック保存・取得機能
 *
 * フィードバックはPoCデータに直接埋め込んで保存
 */
import { kv, KEYS, DEFAULT_TTL_SECONDS } from '@/lib/kv';
import type { FeedbackData, PoCData, EmbeddedFeedback } from '@/types';

export interface FeedbackService {
  saveFeedback(feedback: FeedbackData): Promise<void>;
  getFeedbackByPocId(pocId: string): Promise<EmbeddedFeedback | null>;
}

class FeedbackServiceImpl implements FeedbackService {
  /**
   * フィードバック保存 - PoCデータに直接埋め込む
   */
  async saveFeedback(feedback: FeedbackData): Promise<void> {
    const { pocId, userRating, positives, blockers, freeComment } = feedback;

    // 既存のPoCデータを取得
    const pocData = await kv.get<PoCData>(KEYS.poc(pocId));
    if (!pocData) {
      throw new Error('PoC not found');
    }

    // フィードバックを埋め込む
    const embeddedFeedback: EmbeddedFeedback = {
      userRating,
      positives,
      blockers,
      freeComment,
      feedbackAt: new Date().toISOString(),
    };

    const updatedPoc: PoCData = {
      ...pocData,
      feedback: embeddedFeedback,
    };

    // TTLを維持して保存
    await kv.set(KEYS.poc(pocId), updatedPoc, { ex: DEFAULT_TTL_SECONDS });
  }

  /**
   * 特定PoCのフィードバック取得
   */
  async getFeedbackByPocId(pocId: string): Promise<EmbeddedFeedback | null> {
    const pocData = await kv.get<PoCData>(KEYS.poc(pocId));
    return pocData?.feedback ?? null;
  }
}

// シングルトンインスタンス
let feedbackServiceInstance: FeedbackService | null = null;

export function createFeedbackService(): FeedbackService {
  return new FeedbackServiceImpl();
}

export function getFeedbackService(): FeedbackService {
  if (!feedbackServiceInstance) {
    feedbackServiceInstance = createFeedbackService();
  }
  return feedbackServiceInstance;
}
