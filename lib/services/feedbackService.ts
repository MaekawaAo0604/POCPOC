/**
 * FeedbackService - フィードバック保存・取得機能
 *
 * フィードバックは別キー（feedback:{pocId}）に保存
 * Vercel KVのリードレプリカ問題を回避するため、PoCデータとは分離
 * 複数評価を加重移動平均で集計
 */
import { kv, KEYS, DEFAULT_TTL_SECONDS } from '@/lib/kv';
import type { FeedbackData, PoCData, EmbeddedFeedback, FeedbackEntry } from '@/types';
import { RATING_SCORES } from '@/types';

/** 最大保持するフィードバック数 */
const MAX_FEEDBACK_ENTRIES = 20;

/** EMAの平滑化係数（新しい評価の重み） */
const EMA_ALPHA = 0.3;

export interface FeedbackService {
  saveFeedback(feedback: FeedbackData): Promise<void>;
  getFeedbackByPocId(pocId: string): Promise<EmbeddedFeedback | null>;
}

/** 初期スコア（中間値から開始） */
const INITIAL_SCORE = 2.0;

/**
 * EMA（指数移動平均）でスコアを計算
 * 新スコア = 既存スコア × (1-α) + 新評価 × α
 * 初回は中間値(2.0)から開始
 */
function calculateEmaScore(existingScore: number, newRating: number, isFirst: boolean): number {
  const baseScore = isFirst ? INITIAL_SCORE : existingScore;
  const newScore = baseScore * (1 - EMA_ALPHA) + newRating * EMA_ALPHA;
  return Math.round(newScore * 100) / 100;
}

class FeedbackServiceImpl implements FeedbackService {
  /**
   * フィードバック保存 - 別キーに保存（リードレプリカ問題を回避）
   */
  async saveFeedback(feedback: FeedbackData): Promise<void> {
    const { pocId, userRating, positives, blockers, freeComment } = feedback;

    // PoCの存在確認のみ
    const pocData = await kv.get<PoCData>(KEYS.poc(pocId));
    if (!pocData) {
      throw new Error('PoC not found');
    }

    // 既存のフィードバックを別キーから取得
    const existingFeedback = await kv.get<EmbeddedFeedback>(KEYS.feedback(pocId));

    // 新しいフィードバックエントリ
    const newEntry: FeedbackEntry = {
      userRating,
      positives,
      blockers,
      freeComment,
      feedbackAt: new Date().toISOString(),
    };

    // 既存のエントリを取得（新しい順）
    const existingEntries = existingFeedback?.entries ?? [];

    // 新しいエントリを先頭に追加し、最大数を超えたら古いものを削除
    const updatedEntries = [newEntry, ...existingEntries].slice(0, MAX_FEEDBACK_ENTRIES);

    // EMA（指数移動平均）でスコアを計算
    const isFirst = !existingFeedback || existingFeedback.count === 0;
    const existingScore = existingFeedback?.weightedScore ?? 0;
    const newRating = RATING_SCORES[userRating];
    const weightedScore = calculateEmaScore(existingScore, newRating, isFirst);

    // 累計評価件数（エントリ数ではなく実際の評価回数）
    const previousCount = existingFeedback?.count ?? 0;
    const newCount = previousCount + 1;

    // 更新されたフィードバック
    const embeddedFeedback: EmbeddedFeedback = {
      entries: updatedEntries,
      weightedScore,
      count: newCount,
    };

    // デバッグ: 保存前の状態
    console.log('[FeedbackService] Before save:', {
      pocId,
      feedbackKey: KEYS.feedback(pocId),
      existingCount: existingFeedback?.count ?? 0,
      newCount,
      weightedScore,
    });

    // 別キーに保存（TTL付き）
    await kv.set(KEYS.feedback(pocId), embeddedFeedback, { ex: DEFAULT_TTL_SECONDS });

    // デバッグ: 保存後に確認
    const saved = await kv.get<EmbeddedFeedback>(KEYS.feedback(pocId));
    console.log('[FeedbackService] After save:', {
      pocId,
      hasFeedback: !!saved,
      count: saved?.count,
      weightedScore: saved?.weightedScore,
    });
  }

  /**
   * 特定PoCのフィードバック取得 - 別キーから取得
   */
  async getFeedbackByPocId(pocId: string): Promise<EmbeddedFeedback | null> {
    return await kv.get<EmbeddedFeedback>(KEYS.feedback(pocId));
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
