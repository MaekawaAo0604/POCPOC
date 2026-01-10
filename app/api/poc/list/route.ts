/**
 * GET /api/poc/list
 * 生成されたPoC一覧を取得（フィードバック情報含む）
 *
 * フィードバックはPoCデータに直接埋め込まれているため、
 * 別途フィードバックリストを取得する必要はない
 */
import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';
import type { AutoConfig, UserRating, EmbeddedFeedback } from '@/types';

// 動的ルートとして強制
export const dynamic = 'force-dynamic';

interface PoCListItem {
  pocId: string;
  selectedPains: string[];
  autoConfig?: AutoConfig;
  createdAt: string;
  shareToken?: string;
  // フィードバック情報（PoCデータから直接取得）
  feedback?: {
    userRating: UserRating;
  };
}

export async function GET() {
  try {
    // KVからpoc:*キーを検索 (SCANベースのkeys)
    let keys: string[] = [];

    try {
      keys = await kv.keys('poc:*');
    } catch (keysError) {
      console.error('keys() error:', keysError);
      try {
        const scanResult = await kv.scan(0, { match: 'poc:*', count: 100 });
        keys = scanResult[1] as string[];
      } catch (scanError) {
        console.error('scan() error:', scanError);
      }
    }

    // 共有トークンのキーを除外
    const pocKeys = keys.filter(key => key.startsWith('poc:') && !key.includes('share'));

    // 各PoCのデータを取得
    const pocList: PoCListItem[] = [];

    for (const key of pocKeys) {
      try {
        const data = await kv.get(key);
        if (data && typeof data === 'object') {
          const pocData = data as Record<string, unknown>;
          const embeddedFeedback = pocData.feedback as EmbeddedFeedback | undefined;

          pocList.push({
            pocId: pocData.pocId as string,
            selectedPains: pocData.selectedPains as string[] || [],
            autoConfig: pocData.autoConfig as AutoConfig | undefined,
            createdAt: pocData.createdAt as string || '',
            shareToken: pocData.shareToken as string | undefined,
            // フィードバックはPoCデータから直接取得
            feedback: embeddedFeedback ? {
              userRating: embeddedFeedback.userRating,
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
