/**
 * POST /api/poc/generate
 * PoC生成エンドポイント
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPoCService } from '@/lib/services/pocService';
import type { PoCSpec, ErrorResponse, GeneratePoCResponse } from '@/types';

// リクエストボディの型
interface GeneratePoCRequest {
  selectedPains: string[];
  autoConfig: PoCSpec['autoConfig'];
  adjustments: PoCSpec['adjustments'];
  sampleInput: string;
}

// バリデーション
function validateRequest(body: unknown): body is GeneratePoCRequest {
  if (!body || typeof body !== 'object') return false;

  const req = body as Record<string, unknown>;

  if (!Array.isArray(req.selectedPains) || req.selectedPains.length === 0) {
    return false;
  }

  if (!req.autoConfig || typeof req.autoConfig !== 'object') {
    return false;
  }

  if (!req.adjustments || typeof req.adjustments !== 'object') {
    return false;
  }

  if (typeof req.sampleInput !== 'string' || req.sampleInput.trim() === '') {
    return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    if (!validateRequest(body)) {
      const errorResponse: ErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: '入力内容が不正です。必須項目を確認してください。',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const spec: PoCSpec = {
      selectedPains: body.selectedPains,
      autoConfig: body.autoConfig,
      adjustments: body.adjustments,
      sampleInput: body.sampleInput,
    };

    // PoC生成
    const pocService = getPoCService();
    const result = await pocService.generatePoC(spec);

    // フロントエンドが期待する形式で返す
    const response = {
      pocId: result.pocId,
      html: result.html,
      meta: {
        selectedPains: spec.selectedPains,
        shareToken: result.meta?.shareToken,
        createdAt: result.meta?.createdAt || new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Failed to generate PoC:', error);

    // Claude API エラー判定
    if (error instanceof Error && error.message.includes('API')) {
      const errorResponse: ErrorResponse = {
        error: 'API_ERROR',
        message: 'AI処理中にエラーが発生しました。しばらく待ってから再度お試しください。',
      };
      return NextResponse.json(errorResponse, { status: 503 });
    }

    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'サーバーエラーが発生しました。',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
