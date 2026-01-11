/**
 * GET /api/poc/list
 * 生成されたPoC一覧を取得（フィードバック情報含む）
 *
 * フィードバックはPoCデータに直接埋め込まれているため、
 * 別途フィードバックリストを取得する必要はない
 */
import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import type { AutoConfig, EmbeddedFeedback } from '@/types';

// 動的ルートとして強制
export const dynamic = 'force-dynamic';

interface PoCListItem {
  pocId: string;
  selectedPains: string[];
  autoConfig?: AutoConfig;
  createdAt: string;
  shareToken?: string;
  // フィードバック情報（複数評価対応）
  feedback?: {
    weightedScore: number;
    count: number;
  };
}

export async function GET() {
  try {
    // KVからpoc:*キーを検索 (SCANベースのkeys)
    let keys: string[] = [];

    try {
      keys = await kv.keys('poc:*');
      console.log('[/api/poc/list] kv.keys result:', keys.length, 'keys', keys);
    } catch (keysError) {
      console.error('keys() error:', keysError);
      try {
        const scanResult = await kv.scan(0, { match: 'poc:*', count: 100 });
        keys = scanResult[1] as string[];
        console.log('[/api/poc/list] kv.scan result:', keys.length, 'keys', keys);
      } catch (scanError) {
        console.error('scan() error:', scanError);
      }
    }

    // 共有トークンのキーを除外
    const pocKeys = keys.filter(key => key.startsWith('poc:') && !key.includes('share'));
    console.log('[/api/poc/list] Filtered pocKeys:', pocKeys.length);

    // 各PoCのデータを取得
    const pocList: PoCListItem[] = [];

    for (const key of pocKeys) {
      try {
        const data = await kv.get(key);
        console.log('[/api/poc/list] Get key:', key, 'hasData:', !!data, 'hasFeedback:', !!(data as Record<string, unknown>)?.feedback);
        if (data && typeof data === 'object') {
          const pocData = data as Record<string, unknown>;
          const embeddedFeedback = pocData.feedback as EmbeddedFeedback | undefined;

          pocList.push({
            pocId: pocData.pocId as string,
            selectedPains: pocData.selectedPains as string[] || [],
            autoConfig: pocData.autoConfig as AutoConfig | undefined,
            createdAt: pocData.createdAt as string || '',
            shareToken: pocData.shareToken as string | undefined,
            // フィードバックはPoCデータから直接取得（複数評価対応）
            feedback: embeddedFeedback?.count ? {
              weightedScore: embeddedFeedback.weightedScore,
              count: embeddedFeedback.count,
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

    return NextResponse.json({ pocs: pocList });
  } catch (error) {
    console.error('Failed to list PoCs:', error);
    return NextResponse.json(
      { error: 'PoC一覧の取得に失敗しました', details: String(error) },
      { status: 500 }
    );
  }
}
