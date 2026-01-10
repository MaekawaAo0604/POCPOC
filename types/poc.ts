import type { AutoConfig } from './pain';
import type { UserRating, PositiveType, BlockerType } from './feedback';

/**
 * PoCに埋め込むフィードバック情報
 */
export interface EmbeddedFeedback {
  /** 価値評価 */
  userRating: UserRating;
  /** 良かった点 */
  positives: PositiveType[];
  /** 引っかかった点 */
  blockers: BlockerType[];
  /** 一言コメント */
  freeComment: string;
  /** フィードバック日時 */
  feedbackAt: string;
}

/**
 * 調整オプション
 */
export interface Adjustments {
  /** シナリオ/ユースケース */
  scenario: string;
  /** トーン */
  tone: string;
  /** 出力スタイル */
  outputStyle: string;
  /** 追加の指示 */
  additionalNotes: string;
}

/**
 * PoC生成リクエストの仕様
 */
export interface PoCSpec {
  /** 選択された具体ペインID一覧 */
  selectedPains: string[];
  /** 自動設定 */
  autoConfig: AutoConfig;
  /** 調整オプション */
  adjustments: Adjustments;
  /** サンプル入力 */
  sampleInput: string;
}

/**
 * 保存されるPoC実行データ
 */
export interface PoCRun extends PoCSpec {
  /** PoC ID */
  pocId: string;
  /** 生成されたHTML */
  generatedHtml: string;
  /** 共有トークン */
  shareToken?: string;
  /** 作成日時 (ISO 8601) */
  createdAt: string;
  /** フィードバック（埋め込み） */
  feedback?: EmbeddedFeedback;
}

/**
 * PoC生成結果
 */
export interface PoCResult {
  /** PoC ID */
  pocId: string;
  /** 生成されたHTML */
  html: string;
  /** メタデータ */
  meta: PoCRun;
}

/**
 * PoC取得データ (ストレージから取得)
 */
export interface PoCData extends PoCRun {}
