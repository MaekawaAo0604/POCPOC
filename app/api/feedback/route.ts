/**
 * POST /api/feedback
 * フィードバック送信エンドポイント
 */
import { NextRequest, NextResponse } from 'next/server';
import { getFeedbackService } from '@/lib/services/feedbackService';
import type {
  FeedbackData,
  ErrorResponse,
  FeedbackResponse,
  UserRating,
  PositiveType,
  BlockerType,
} from '@/types';

// バリデーション用の有効な値
const VALID_RATINGS: UserRating[] = ['helpful', 'meh', 'unknown'];
const VALID_POSITIVES: PositiveType[] = ['time', 'quality', 'consistency', 'learning'];
const VALID_BLOCKERS: BlockerType[] = ['accuracy', 'exceptions', 'data', 'complexity', 'security'];

// リクエストボディの型
interface FeedbackRequest {
  pocId: string;
  selectedPains: string[];
  userRating: UserRating;
  positives: PositiveType[];
  blockers: BlockerType[];
  freeComment?: string;
}

// バリデーション
function validateRequest(body: unknown): body is FeedbackRequest {
  if (!body || typeof body !== 'object') return false;

  const req = body as Record<string, unknown>;

  if (typeof req.pocId !== 'string' || req.pocId.trim() === '') {
    return false;
  }

  if (!Array.isArray(req.selectedPains)) {
    return false;
  }

  if (!VALID_RATINGS.includes(req.userRating as UserRating)) {
    return false;
  }

  if (!Array.isArray(req.positives)) {
    return false;
  }

  if (!Array.isArray(req.blockers)) {
    return false;
  }

  // positives の値チェック
  for (const p of req.positives) {
    if (!VALID_POSITIVES.includes(p as PositiveType)) {
      return false;
    }
  }

  // blockers の値チェック
  for (const b of req.blockers) {
    if (!VALID_BLOCKERS.includes(b as BlockerType)) {
      return false;
    }
  }

  // freeComment は任意
  if (req.freeComment !== undefined && typeof req.freeComment !== 'string') {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  console.log('[/api/feedback] POST called');
  try {
    const body = await request.json();
    console.log('[/api/feedback] Request body:', JSON.stringify(body));

    // バリデーション
    if (!validateRequest(body)) {
      console.log('[/api/feedback] Validation failed');
      const errorResponse: ErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: 'フィードバック内容が不正です。',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    console.log('[/api/feedback] Validation passed');

    const feedbackData: FeedbackData = {
      pocId: body.pocId,
      selectedPains: body.selectedPains,
      userRating: body.userRating,
      positives: body.positives,
      blockers: body.blockers,
      freeComment: body.freeComment || '',
    };

    // フィードバック保存
    console.log('[/api/feedback] Calling saveFeedback...');
    const feedbackService = getFeedbackService();
    await feedbackService.saveFeedback(feedbackData);
    console.log('[/api/feedback] saveFeedback completed');

    const response: FeedbackResponse = {
      success: true,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[/api/feedback] Failed to save feedback:', error);

    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'サーバーエラーが発生しました。',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
