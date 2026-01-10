'use client';

import { Card, CardContent, CardHeader, CardTitle, Textarea } from '@/components/ui';

interface SampleInputFormProps {
  sampleInput: string;
  onSampleInputChange: (value: string) => void;
}

export function SampleInputForm({
  sampleInput,
  onSampleInputChange,
}: SampleInputFormProps) {
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          サンプル入力
          <span className="text-red-500">*</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="AIに処理させたいサンプルデータを入力してください。&#10;例：お客様からの問い合わせ内容、営業提案書の元テキスト など"
          value={sampleInput}
          onChange={(e) => onSampleInputChange(e.target.value)}
          rows={6}
          className="font-mono text-sm"
        />
        <p className="mt-2 text-xs text-gray-500">
          ※ 実際のデータに近いサンプルを入力すると、より効果的なPoCが生成されます
        </p>
      </CardContent>
    </Card>
  );
}
