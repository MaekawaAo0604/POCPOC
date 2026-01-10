/**
 * GET /api/poc/list
 * 生成されたPoC一覧を取得
 */
import { NextResponse } from 'next/server';
import { kv } from '@/lib/kv';

interface PoCListItem {
  pocId: string;
  selectedPains: string[];
  createdAt: string;
  shareToken?: string;
}

export async function GET() {
  try {
    // KVからpoc:*キーを検索
    const keys = await kv.keys('poc:*');

    // 共有トークンのキーを除外
    const pocKeys = keys.filter(key => !key.includes(':share:'));

    // 各PoCのデータを取得
    const pocList: PoCListItem[] = [];

    for (const key of pocKeys) {
      const data = await kv.get(key);
      if (data && typeof data === 'object') {
        const pocData = data as Record<string, unknown>;
        pocList.push({
          pocId: pocData.pocId as string,
          selectedPains: pocData.selectedPains as string[] || [],
          createdAt: pocData.createdAt as string || '',
          shareToken: pocData.shareToken as string | undefined,
        });
      }
    }

    // 作成日時で降順ソート
    pocList.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ pocs: pocList });
  } catch (error) {
    console.error('Failed to list PoCs:', error);
    return NextResponse.json(
      { error: 'PoC一覧の取得に失敗しました' },
      { status: 500 }
    );
  }
}
