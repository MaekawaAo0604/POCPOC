/**
 * FeedbackService - フィードバック保存・取得機能
 *
 * フィードバックはPoCデータに直接埋め込んで保存
 * 複数評価を加重移動平均で集計
 */
import { kv, KEYS, DEFAULT_TTL_SECONDS } from '@/lib/kv';
import type { FeedbackData, PoCData, EmbeddedFeedback, FeedbackEntry } from '@/types';
import { RATING_SCORES } from '@/types';

/** 最大保持するフィードバック数 */
const MAX_FEEDBACK_ENTRIES = 20;

/** 加重移動平均の減衰率（新しいほど重みが大きい） */
const DECAY_FACTOR = 0.8;

export interface FeedbackService {
  saveFeedback(feedback: FeedbackData): Promise<void>;
  getFeedbackByPocId(pocId: string): Promise<EmbeddedFeedback | null>;
}

/**
 * 加重移動平均スコアを計算
 * 新しい評価ほど重みが大きい（指数減衰）
 */
function calculateWeightedScore(entries: FeedbackEntry[]): number {
  if (entries.length === 0) return 0;

  let weightedSum = 0;
  let weightSum = 0;

  entries.forEach((entry, index) => {
    // 新しい順なので、index=0が最新
    const weight = Math.pow(DECAY_FACTOR, index);
    const score = RATING_SCORES[entry.userRating];
    weightedSum += score * weight;
    weightSum += weight;
  });

  return Math.round((weightedSum / weightSum) * 100) / 100;
}

class FeedbackServiceImpl implements FeedbackService {
  /**
   * フィードバック保存 - 既存のフィードバックに追加して加重平均を再計算
   */
  async saveFeedback(feedback: FeedbackData): Promise<void> {
    const { pocId, userRating, positives, blockers, freeComment } = feedback;

    // 既存のPoCデータを取得
    const pocData = await kv.get<PoCData>(KEYS.poc(pocId));
    if (!pocData) {
      throw new Error('PoC not found');
    }

    // 新しいフィードバックエントリ
    const newEntry: FeedbackEntry = {
      userRating,
      positives,
      blockers,
      freeComment,
      feedbackAt: new Date().toISOString(),
    };

    // 既存のエントリを取得（新しい順）
    const existingEntries = pocData.feedback?.entries ?? [];

    // 新しいエントリを先頭に追加し、最大数を超えたら古いものを削除
    const updatedEntries = [newEntry, ...existingEntries].slice(0, MAX_FEEDBACK_ENTRIES);

    // 加重移動平均を計算
    const weightedScore = calculateWeightedScore(updatedEntries);

    // 更新されたフィードバック
    const embeddedFeedback: EmbeddedFeedback = {
      entries: updatedEntries,
      weightedScore,
      count: updatedEntries.length,
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
