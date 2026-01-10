'use client';

import type { PoCResult as PoCResultType } from '@/types';
import { PoCViewer, ShareButton } from '@/components/viewer';
import { FeedbackForm } from '@/components/feedback';
import { Button, Card, Badge } from '@/components/ui';
import { getPainConfig } from '@/lib/services/configService';

interface PoCResultProps {
  result: PoCResultType;
  onReset: () => void;
}

// ペインIDから名前を取得
function getPainNames(painIds: string[]): { id: string; name: string; category: string }[] {
  const config = getPainConfig();
  const painResults: { id: string; name: string; category: string }[] = [];

  for (const painId of painIds) {
    for (const category of config.categories) {
      const pain = category.pains.find(p => p.id === painId);
      if (pain) {
        painResults.push({
          id: painId,
          name: pain.name,
          category: category.name,
        });
        break;
      }
    }
  }

  return painResults;
}

export function PoCResult({ result, onReset }: PoCResultProps) {
  const pains = getPainNames(result.meta.selectedPains);
  const kpi = result.meta.autoConfig?.kpiTarget;
  const features = result.meta.autoConfig?.hypothesisFeatures || [];

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            PoC生成完了
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            ID: {result.pocId}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ShareButton pocId={result.pocId} shareToken={result.meta.shareToken} />
          <Button variant="secondary" onClick={onReset}>
            新しいPoCを作成
          </Button>
        </div>
      </div>

      {/* PoC概要カード */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="space-y-4">
          {/* 対象ペイン */}
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-2">対象の課題</h2>
            <div className="flex flex-wrap gap-2">
              {pains.map((pain) => (
                <Badge key={pain.id} variant="info" className="text-sm">
                  {pain.category}: {pain.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* KPI目標 */}
          {kpi && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">目標KPI</h2>
              <p className="text-xl font-bold text-blue-700">
                {kpi.metric} {kpi.value}{kpi.unit}
              </p>
            </div>
          )}

          {/* 検証機能 */}
          {features.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-2">検証する機能</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {features.map((feature, i) => (
                  <li key={i} className="text-sm">{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* PoC表示 */}
      <PoCViewer html={result.html} title="生成されたPoC" />

      {/* フィードバック */}
      <FeedbackForm
        pocId={result.pocId}
        selectedPains={result.meta.selectedPains}
      />
    </div>
  );
}
