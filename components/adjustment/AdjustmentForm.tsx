'use client';

import type { Adjustments } from '@/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Textarea,
} from '@/components/ui';

interface AdjustmentFormProps {
  adjustments: Adjustments;
  onAdjustmentsChange: (adjustments: Adjustments) => void;
}

const TONE_OPTIONS = [
  { value: '', label: '指定なし' },
  { value: 'business', label: 'ビジネス（フォーマル）' },
  { value: 'casual', label: 'カジュアル（親しみやすい）' },
  { value: 'technical', label: '技術的（専門的）' },
];

const OUTPUT_STYLE_OPTIONS = [
  { value: '', label: '指定なし' },
  { value: 'detailed', label: '詳細（網羅的に説明）' },
  { value: 'concise', label: '簡潔（要点のみ）' },
  { value: 'step-by-step', label: 'ステップバイステップ' },
];

export function AdjustmentForm({
  adjustments,
  onAdjustmentsChange,
}: AdjustmentFormProps) {
  const updateField = <K extends keyof Adjustments>(
    field: K,
    value: Adjustments[K]
  ) => {
    onAdjustmentsChange({
      ...adjustments,
      [field]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          調整オプション（任意）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          label="シナリオ/ユースケース"
          placeholder="例：ECサイトの問い合わせ対応、社内ヘルプデスク"
          value={adjustments.scenario}
          onChange={(e) => updateField('scenario', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="トーン"
            options={TONE_OPTIONS}
            value={adjustments.tone}
            onChange={(e) => updateField('tone', e.target.value)}
          />

          <Select
            label="出力スタイル"
            options={OUTPUT_STYLE_OPTIONS}
            value={adjustments.outputStyle}
            onChange={(e) => updateField('outputStyle', e.target.value)}
          />
        </div>

        <Textarea
          label="追加の指示"
          placeholder="例：チャット形式で表示してほしい、特定の業界用語を使ってほしい"
          value={adjustments.additionalNotes}
          onChange={(e) => updateField('additionalNotes', e.target.value)}
          rows={3}
        />
      </CardContent>
    </Card>
  );
}
