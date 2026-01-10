'use client';

import type { PoCResult as PoCResultType } from '@/types';
import { PoCViewer, ShareButton } from '@/components/viewer';
import { FeedbackForm } from '@/components/feedback';
import { Button } from '@/components/ui';

interface PoCResultProps {
  result: PoCResultType;
  onReset: () => void;
}

export function PoCResult({ result, onReset }: PoCResultProps) {
  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            PoC生成完了
          </h1>
          <p className="text-gray-500 mt-1">
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
