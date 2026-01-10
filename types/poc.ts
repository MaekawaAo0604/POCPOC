import type { AutoConfig } from './pain';

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
