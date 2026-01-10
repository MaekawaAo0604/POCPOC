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
    // KVからpoc:*キーを検索 (SCANベースのkeys)
    let keys: string[] = [];

    try {
      // @vercel/kvのkeysはSCANベースで動作
      keys = await kv.keys('poc:*');
      console.log('Found keys:', keys);
    } catch (keysError) {
      console.error('keys() error:', keysError);
      // keysが使えない場合はscanを試す
      try {
        const scanResult = await kv.scan(0, { match: 'poc:*', count: 100 });
        keys = scanResult[1] as string[];
        console.log('Scan result keys:', keys);
      } catch (scanError) {
        console.error('scan() error:', scanError);
      }
    }

    // 共有トークンのキーを除外 (poc:xxxのみ、share:xxxは除外)
    const pocKeys = keys.filter(key => key.startsWith('poc:') && !key.includes('share'));
    console.log('Filtered pocKeys:', pocKeys);

    // 各PoCのデータを取得
    const pocList: PoCListItem[] = [];

    for (const key of pocKeys) {
      try {
        const data = await kv.get(key);
        console.log(`Data for ${key}:`, data ? 'found' : 'null');
        if (data && typeof data === 'object') {
          const pocData = data as Record<string, unknown>;
          pocList.push({
            pocId: pocData.pocId as string,
            selectedPains: pocData.selectedPains as string[] || [],
            createdAt: pocData.createdAt as string || '',
            shareToken: pocData.shareToken as string | undefined,
          });
        }
      } catch (getError) {
        console.error(`Error getting ${key}:`, getError);
      }
    }

    // 作成日時で降順ソート
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
