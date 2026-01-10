'use client';

import type { AutoConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

interface AutoConfigDisplayProps {
  config: AutoConfig | null;
  loading?: boolean;
}

export function AutoConfigDisplay({ config, loading }: AutoConfigDisplayProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-6 bg-gray-100 rounded animate-pulse w-1/3" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-6 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-gray-500">
          <p>課題を選択すると、AI仮説が自動生成されます</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          AI仮説（自動生成）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 仮説機能 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            試す機能
          </h4>
          <div className="flex flex-wrap gap-2">
            {config.hypothesisFeatures.map((feature, index) => (
              <Badge key={index} variant="info">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* KPI目標 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            期待効果
          </h4>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">
                {config.kpiTarget.value}
              </span>
              <span className="text-blue-600">{config.kpiTarget.unit}</span>
              <span className="text-gray-600">の</span>
              <span className="font-medium text-gray-900">
                {config.kpiTarget.metric}
              </span>
            </div>
          </div>
        </div>

        {/* 推奨出力 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            推奨出力
          </h4>
          <div className="flex flex-wrap gap-2">
            {config.recommendedOutputs.map((output) => (
              <Badge key={output} variant="default">
                {OUTPUT_LABELS[output] || output}
              </Badge>
            ))}
          </div>
        </div>

        {/* 根拠 */}
        <div className="pt-4 border-t border-blue-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            根拠
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {config.rationale}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const OUTPUT_LABELS: Record<string, string> = {
  summary: '要約',
  category: 'カテゴリ分類',
  reply_draft: '回答ドラフト',
  priority: '優先度',
  sentiment: '感情分析',
};
