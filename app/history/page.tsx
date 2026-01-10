'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, Button, Badge, Select } from '@/components/ui';
import { getPainConfig } from '@/lib/services/configService';
import type { AutoConfig, UserRating } from '@/types';

interface PoCListItem {
  pocId: string;
  selectedPains: string[];
  autoConfig?: AutoConfig;
  createdAt: string;
  shareToken?: string;
  feedback?: {
    userRating: UserRating;
  };
}

type SortOption = 'newest' | 'oldest' | 'rating-good' | 'rating-bad' | 'no-feedback';

// ペインIDから名前を取得
function getPainNames(painIds: string[]): string[] {
  const config = getPainConfig();
  const names: string[] = [];

  for (const painId of painIds) {
    for (const category of config.categories) {
      const pain = category.pains.find(p => p.id === painId);
      if (pain) {
        names.push(pain.name);
        break;
      }
    }
  }

  return names;
}

// 評価の表示
const RATING_DISPLAY: Record<UserRating, { label: string; emoji: string; color: string }> = {
  helpful: { label: '役に立った', emoji: '👍', color: 'text-green-600' },
  meh: { label: '微妙', emoji: '😐', color: 'text-yellow-600' },
  unknown: { label: 'わからない', emoji: '🤔', color: 'text-gray-500' },
};

// 評価のソート優先度
const RATING_PRIORITY: Record<UserRating, number> = {
  helpful: 3,
  meh: 2,
  unknown: 1,
};

export default function HistoryPage() {
  const [pocs, setPocs] = useState<PoCListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    async function fetchPocs() {
      try {
        const response = await fetch('/api/poc/list');
        if (!response.ok) throw new Error('取得に失敗');
        const data = await response.json();
        setPocs(data.pocs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラー');
      } finally {
        setLoading(false);
      }
    }
    fetchPocs();
  }, []);

  // ソート済みリスト
  const sortedPocs = useMemo(() => {
    const sorted = [...pocs];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'rating-good':
        sorted.sort((a, b) => {
          const ratingA = a.feedback ? RATING_PRIORITY[a.feedback.userRating] : 0;
          const ratingB = b.feedback ? RATING_PRIORITY[b.feedback.userRating] : 0;
          return ratingB - ratingA;
        });
        break;
      case 'rating-bad':
        sorted.sort((a, b) => {
          const ratingA = a.feedback ? RATING_PRIORITY[a.feedback.userRating] : 0;
          const ratingB = b.feedback ? RATING_PRIORITY[b.feedback.userRating] : 0;
          return ratingA - ratingB;
        });
        break;
      case 'no-feedback':
        sorted.sort((a, b) => {
          if (!a.feedback && b.feedback) return -1;
          if (a.feedback && !b.feedback) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
    }

    return sorted;
  }, [pocs, sortBy]);

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
          <>
            {/* ソートオプション */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-gray-600">並び替え:</span>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-48"
                options={[
                  { value: 'newest', label: '新しい順' },
                  { value: 'oldest', label: '古い順' },
                  { value: 'rating-good', label: '評価が良い順' },
                  { value: 'rating-bad', label: '評価が悪い順' },
                  { value: 'no-feedback', label: '未評価を優先' },
                ]}
              />
              <span className="text-sm text-gray-400 ml-auto">
                {pocs.length}件
              </span>
            </div>

            <div className="space-y-4">
              {sortedPocs.map((poc) => {
                const painNames = getPainNames(poc.selectedPains);
                const kpi = poc.autoConfig?.kpiTarget;
                const rating = poc.feedback?.userRating;
                const ratingDisplay = rating ? RATING_DISPLAY[rating] : null;

                return (
                  <Card key={poc.pocId} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {/* タイトル（ペイン名） */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {painNames.length > 0 ? painNames.join(' / ') : 'PoC'}
                            </h3>
                            {/* 評価バッジ */}
                            {ratingDisplay ? (
                              <span className={`text-sm ${ratingDisplay.color}`}>
                                {ratingDisplay.emoji} {ratingDisplay.label}
                              </span>
                            ) : (
                              <Badge variant="default" className="text-xs">未評価</Badge>
                            )}
                          </div>

                          {/* KPI目標 */}
                          {kpi && (
                            <p className="text-sm text-blue-600 font-medium mb-2">
                              目標: {kpi.metric} {kpi.value}{kpi.unit}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-xs text-gray-400">
                              {poc.pocId}
                            </span>
                            {poc.shareToken && (
                              <Badge variant="success">共有済み</Badge>
                            )}
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
                                  `${window.location.origin}/poc/${poc.pocId}?share=${poc.shareToken}`
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
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
