'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Badge } from '@/components/ui';

interface PoCListItem {
  pocId: string;
  selectedPains: string[];
  createdAt: string;
  shareToken?: string;
}

export default function HistoryPage() {
  const [pocs, setPocs] = useState<PoCListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<{ keysFound: number; pocKeysFound: number } | null>(null);

  useEffect(() => {
    async function fetchPocs() {
      try {
        const response = await fetch('/api/poc/list');
        if (!response.ok) throw new Error('取得に失敗');
        const data = await response.json();
        setPocs(data.pocs || []);
        setDebug(data.debug || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchPocs();
  }, []);

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">生成履歴</h1>
          <Link href="/">
            <Button>新規作成</Button>
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-6">
            {error}
          </div>
        )}

        {debug && (
          <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 text-sm mb-6">
            Debug: KVキー数={debug.keysFound}, PoCキー数={debug.pocKeysFound}
          </div>
        )}

        {pocs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500 mb-4">まだPoCが生成されていません</p>
              <Link href="/">
                <Button>最初のPoCを作成</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pocs.map((poc) => (
              <Card key={poc.pocId} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-sm text-gray-500">
                          {poc.pocId}
                        </span>
                        {poc.shareToken && (
                          <Badge variant="success">共有済み</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {poc.selectedPains.map((pain) => (
                          <Badge key={pain} variant="default">
                            {pain}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500">
                        作成: {new Date(poc.createdAt).toLocaleString('ja-JP')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/poc/${poc.pocId}`}>
                        <Button variant="secondary" size="sm">
                          表示
                        </Button>
                      </Link>
                      {poc.shareToken && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/poc/${poc.shareToken}`
                            );
                            alert('共有リンクをコピーしました');
                          }}
                        >
                          リンクコピー
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
