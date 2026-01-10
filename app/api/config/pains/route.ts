/**
 * GET /api/config/pains
 * ペイン設定マスタデータを取得
 */
import { NextResponse } from 'next/server';
import { getPainConfig } from '@/lib/services/configService';

export async function GET() {
  try {
    const config = getPainConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Failed to get pain config:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}
