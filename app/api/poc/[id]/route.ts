/**
 * GET /api/poc/[id]
 * PoC取得エンドポイント
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPoCService } from '@/lib/services/pocService';
import type { ErrorResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || typeof id !== 'string') {
      const errorResponse: ErrorResponse = {
        error: 'VALIDATION_ERROR',
        message: 'PoC IDが指定されていません。',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const pocService = getPoCService();

    // 共有トークンでのアクセスかチェック
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('share');

    let pocData;

    if (shareToken) {
      // 共有トークンでの取得
      pocData = await pocService.getPoCByShareToken(shareToken);

      // トークンが有効だがPoCのIDと一致しない場合
      if (pocData && pocData.pocId !== id) {
        const errorResponse: ErrorResponse = {
          error: 'NOT_FOUND',
          message: '無効な共有リンクです。',
        };
        return NextResponse.json(errorResponse, { status: 404 });
      }
    } else {
      // 直接IDでの取得
      pocData = await pocService.getPoC(id);
    }

    if (!pocData) {
      const errorResponse: ErrorResponse = {
        error: 'NOT_FOUND',
        message: 'このPoCは存在しないか、期限切れです。',
      };
      return NextResponse.json(errorResponse, { status: 410 });
    }

    // レスポンス（顧客入力は除外）
    return NextResponse.json({
      pocId: pocData.pocId,
      html: pocData.generatedHtml,
      selectedPains: pocData.selectedPains,
      autoConfig: pocData.autoConfig,
      createdAt: pocData.createdAt,
    });
  } catch (error) {
    console.error('Failed to get PoC:', error);

    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'サーバーエラーが発生しました。',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
