/**
 * POST /api/poc/[id]/share
 * 共有リンク生成エンドポイント
 */
import { NextRequest, NextResponse } from 'next/server';
import { getPoCService } from '@/lib/services/pocService';
import type { ErrorResponse, ShareResponse } from '@/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
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

    try {
      const shareUrl = await pocService.createShareToken(id);

      const response: ShareResponse = {
        shareUrl,
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'PoC not found') {
        const errorResponse: ErrorResponse = {
          error: 'NOT_FOUND',
          message: 'このPoCは存在しないか、期限切れです。',
        };
        return NextResponse.json(errorResponse, { status: 410 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to create share token:', error);

    const errorResponse: ErrorResponse = {
      error: 'INTERNAL_ERROR',
      message: 'サーバーエラーが発生しました。',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
