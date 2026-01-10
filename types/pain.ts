/**
 * 出力タイプ
 */
export type OutputType =
  | 'summary'
  | 'category'
  | 'reply_draft'
  | 'priority'
  | 'sentiment';

/**
 * KPI目標
 */
export interface KpiTarget {
  /** 指標名 (例: "時間短縮") */
  metric: string;
  /** 目標値 (例: 50) */
  value: number;
  /** 単位 (例: "%") */
  unit: string;
}

/**
 * 自動設定
 * ペイン選択に基づいて自動生成される仮説・推奨出力・KPI
 */
export interface AutoConfig {
  /** 仮説（試す機能）: 2〜5個 */
  hypothesisFeatures: string[];
  /** 推奨出力タイプ */
  recommendedOutputs: OutputType[];
  /** KPI目標 */
  kpiTarget: KpiTarget;
  /** 根拠説明: 「この課題なのでこの仮説」 */
  rationale: string;
}

/**
 * 具体ペイン（課題の詳細）
 */
export interface PainDetail {
  /** 一意のID */
  id: string;
  /** ペイン名 (例: "対応時間が長い") */
  name: string;
  /** 説明 */
  description: string;
  /** このペインに対応する自動設定 */
  autoConfig: AutoConfig;
}

/**
 * 大分類ペイン（課題カテゴリ）
 */
export interface PainCategory {
  /** 一意のID */
  id: string;
  /** カテゴリ名 (例: "カスタマーサポート") */
  name: string;
  /** 説明 */
  description: string;
  /** このカテゴリに属する具体ペイン一覧 */
  pains: PainDetail[];
}

/**
 * ペインマスタ全体
 */
export interface PainConfig {
  /** 大分類ペイン一覧 */
  categories: PainCategory[];
}
