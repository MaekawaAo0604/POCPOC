/**
 * 良かった点の選択肢
 */
export type PositiveType = 'time' | 'quality' | 'consistency' | 'learning';

/**
 * 引っかかった点の選択肢
 */
export type BlockerType =
  | 'accuracy'
  | 'exceptions'
  | 'data'
  | 'complexity'
  | 'security';

/**
 * ユーザー評価
 */
export type UserRating = 'helpful' | 'meh' | 'unknown';

/**
 * フィードバックデータ
 */
export interface FeedbackData {
  /** PoC ID */
  pocId: string;
  /** 選択された具体ペイン一覧 */
  selectedPains: string[];
  /** 価値評価 (必須) */
  userRating: UserRating;
  /** 良かった点 (任意・複数選択) */
  positives: PositiveType[];
  /** 引っかかった点 (任意・複数選択) */
  blockers: BlockerType[];
  /** 一言コメント (任意) */
  freeComment: string;
}

/**
 * 保存されるフィードバックデータ (IDと作成日時付き)
 */
export interface StoredFeedback extends FeedbackData {
  /** フィードバックID */
  feedbackId: string;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
}

/**
 * 良かった点の表示ラベル
 */
export const POSITIVE_LABELS: Record<PositiveType, string> = {
  time: '時間が減りそう',
  quality: 'ミスが減りそう',
  consistency: '判断が揃いそう',
  learning: '学習コストが下がりそう',
};

/**
 * 引っかかった点の表示ラベル
 */
export const BLOCKER_LABELS: Record<BlockerType, string> = {
  accuracy: '精度が足りない',
  exceptions: '例外が多い',
  data: '入力データが整ってない',
  complexity: 'ルールが複雑',
  security: 'セキュリティ/運用が不安',
};

/**
 * ユーザー評価の表示ラベル
 */
export const USER_RATING_LABELS: Record<UserRating, string> = {
  helpful: '役に立った',
  meh: '微妙',
  unknown: 'わからない',
};
