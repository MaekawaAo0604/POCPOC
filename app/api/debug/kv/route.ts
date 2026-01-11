/**
 * GET /api/debug/kv
 * KVのデバッグ用エンドポイント（開発環境のみ）
 */
import { NextResponse } from 'next/server';
import { kv, KEYS } from '@/lib/kv';
import type { PoCData, EmbeddedFeedback } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 本番環境では無効
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // pocキーとfeedbackキーの両方を取得
    const pocKeys = await kv.keys('poc:*');
    const feedbackKeys = await kv.keys('feedback:*');

    const results: Record<string, unknown> = {};

    for (const key of pocKeys) {
      if (key.includes('share')) continue;

      const data = await kv.get<PoCData>(key);
      const pocId = data?.pocId;

      // 別キーからフィードバックを取得
      const feedbackData = pocId ? await kv.get<EmbeddedFeedback>(KEYS.feedback(pocId)) : null;

      results[key] = {
        pocId,
        createdAt: data?.createdAt,
        // 旧: PoCデータに埋め込まれたフィードバック（互換性のため残す）
        embeddedFeedback: data?.feedback,
        // 新: 別キーのフィードバック
        separateFeedback: feedbackData,
        separateFeedbackKey: pocId ? KEYS.feedback(pocId) : null,
      };
    }

    return NextResponse.json({
      totalPocKeys: pocKeys.filter(k => !k.includes('share')).length,
      totalFeedbackKeys: feedbackKeys.length,
      feedbackKeys,
      data: results,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
