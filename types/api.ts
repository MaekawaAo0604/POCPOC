/**
 * エラーコード定義
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'API_ERROR'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMITED';

/**
 * APIエラーレスポンス
 */
export interface ErrorResponse {
  /** エラーコード */
  error: ErrorCode;
  /** ユーザー向けメッセージ */
  message: string;
}

/**
 * PoC生成APIレスポンス
 */
export interface GeneratePoCResponse {
  pocId: string;
  html: string;
}

/**
 * 共有URL生成APIレスポンス
 */
export interface ShareResponse {
  shareUrl: string;
}

/**
 * フィードバック送信APIレスポンス
 */
export interface FeedbackResponse {
  success: boolean;
}

/**
 * エラーメッセージのマッピング
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: '入力内容に問題があります。',
  NOT_FOUND: 'データが見つかりません。',
  API_ERROR: 'AI処理中にエラーが発生しました。',
  INTERNAL_ERROR: '一時的なエラーです。再試行してください。',
  RATE_LIMITED: 'しばらく待ってから再試行してください。',
};
