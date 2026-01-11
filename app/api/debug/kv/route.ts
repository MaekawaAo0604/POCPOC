/**
 * GET /api/debug/kv
 * KVのデバッグ用エンドポイント（開発環境のみ）
 */
import { NextResponse } from 'next/server';
import { kv, KEYS } from '@/lib/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 本番環境では無効
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const keys = await kv.keys('poc:*');
    const results: Record<string, unknown> = {};

    for (const key of keys) {
      if (key.includes('share')) continue;

      const data = await kv.get(key);
      results[key] = {
        raw: data,
        hasFeedback: !!(data as Record<string, unknown>)?.feedback,
        feedbackData: (data as Record<string, unknown>)?.feedback,
      };
    }

    return NextResponse.json({
      totalKeys: keys.length,
      pocKeys: Object.keys(results).length,
      data: results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
