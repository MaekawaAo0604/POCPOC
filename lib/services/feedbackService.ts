/**
 * FeedbackService - フィードバック保存・取得機能
 *
 * メタデータのみ永続保存（TTLなし）
 */
import { kv, KEYS } from '@/lib/kv';
import { generatePocId } from '@/lib/utils/idGenerator';
import type { FeedbackData, StoredFeedback } from '@/types';

export interface FeedbackService {
  saveFeedback(feedback: FeedbackData): Promise<void>;
  getFeedbacks(limit?: number): Promise<StoredFeedback[]>;
  getFeedbacksByPocId(pocId: string): Promise<StoredFeedback[]>;
}

class FeedbackServiceImpl implements FeedbackService {
  /**
   * フィードバック保存 - メタデータのみ永続保存（TTLなし）
   */
  async saveFeedback(feedback: FeedbackData): Promise<void> {
    const feedbackWithId: StoredFeedback = {
      feedbackId: generatePocId(), // IDとして再利用
      ...feedback,
      createdAt: new Date().toISOString(),
    };

    // List型で追加（TTLなし = 永続）
    await kv.lpush(KEYS.feedbacks, JSON.stringify(feedbackWithId));
  }

  /**
   * フィードバック一覧取得（管理用）
   */
  async getFeedbacks(limit = 100): Promise<StoredFeedback[]> {
    const feedbacks = await kv.lrange(KEYS.feedbacks, 0, limit - 1);
    return feedbacks.map((f) => JSON.parse(f as string) as StoredFeedback);
  }

  /**
   * 特定PoCのフィードバック取得
   */
  async getFeedbacksByPocId(pocId: string): Promise<StoredFeedback[]> {
    const allFeedbacks = await this.getFeedbacks(1000); // 十分な数を取得
    return allFeedbacks.filter((f) => f.pocId === pocId);
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
