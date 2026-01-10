/**
 * GET /api/poc/list
 * 生成されたPoC一覧を取得（フィードバック情報含む）
 */
import { NextResponse } from 'next/server';
import { kv, KEYS } from '@/lib/kv';
import type { AutoConfig, UserRating, StoredFeedback } from '@/types';

// 動的ルートとして強制
export const dynamic = 'force-dynamic';

interface PoCListItem {
  pocId: string;
  selectedPains: string[];
  autoConfig?: AutoConfig;
  createdAt: string;
  shareToken?: string;
  // フィードバック情報
  feedback?: {
    userRating: UserRating;
    feedbackCount: number;
  };
}

export async function GET() {
  try {
    // KVからpoc:*キーを検索 (SCANベースのkeys)
    let keys: string[] = [];

    try {
      keys = await kv.keys('poc:*');
      console.log('Found keys:', keys);
    } catch (keysError) {
      console.error('keys() error:', keysError);
      try {
        const scanResult = await kv.scan(0, { match: 'poc:*', count: 100 });
        keys = scanResult[1] as string[];
        console.log('Scan result keys:', keys);
      } catch (scanError) {
        console.error('scan() error:', scanError);
      }
    }

    // 共有トークンのキーを除外
    const pocKeys = keys.filter(key => key.startsWith('poc:') && !key.includes('share'));
    console.log('Filtered pocKeys:', pocKeys);

    // フィードバック一覧を取得
    const feedbackMap: Map<string, StoredFeedback[]> = new Map();
    try {
      const feedbacksRaw = await kv.lrange(KEYS.feedbacks, 0, 999);
      const feedbacks = feedbacksRaw.map(f => JSON.parse(f as string) as StoredFeedback);

      // pocId別にグループ化
      for (const fb of feedbacks) {
        const existing = feedbackMap.get(fb.pocId) || [];
        existing.push(fb);
        feedbackMap.set(fb.pocId, existing);
      }
    } catch (fbError) {
      console.error('Feedback fetch error:', fbError);
    }

    // 各PoCのデータを取得
    const pocList: PoCListItem[] = [];

    for (const key of pocKeys) {
      try {
        const data = await kv.get(key);
        console.log(`Data for ${key}:`, data ? 'found' : 'null');
        if (data && typeof data === 'object') {
          const pocData = data as Record<string, unknown>;
          const pocId = pocData.pocId as string;

          // フィードバック情報を取得
          const pocFeedbacks = feedbackMap.get(pocId) || [];
          const latestFeedback = pocFeedbacks[0]; // 最新のフィードバック

          pocList.push({
            pocId,
            selectedPains: pocData.selectedPains as string[] || [],
            autoConfig: pocData.autoConfig as AutoConfig | undefined,
            createdAt: pocData.createdAt as string || '',
            shareToken: pocData.shareToken as string | undefined,
            feedback: latestFeedback ? {
              userRating: latestFeedback.userRating,
              feedbackCount: pocFeedbacks.length,
            } : undefined,
          });
        }
      } catch (getError) {
        console.error(`Error getting ${key}:`, getError);
      }
    }

    // 作成日時で降順ソート（デフォルト）
    pocList.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log('Returning pocList count:', pocList.length);
    return NextResponse.json({ pocs: pocList, debug: { keysFound: keys.length, pocKeysFound: pocKeys.length } });
  } catch (error) {
    console.error('Failed to list PoCs:', error);
    return NextResponse.json(
      { error: 'PoC一覧の取得に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
