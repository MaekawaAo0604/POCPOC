import { notFound } from 'next/navigation';
import { getPoCService } from '@/lib/services/pocService';
import { PoCViewer } from '@/components/viewer';
import { FeedbackForm } from '@/components/feedback';

// キャッシュ無効化（常に最新データを取得）
export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PoCPage({ params }: PageProps) {
  const { id } = await params;
  const pocService = getPoCService();

  // IDまたは共有トークンでPoC取得を試行
  let pocData = await pocService.getPoC(id);

  // デバッグログ
  console.log('[PoCPage] Fetched PoC:', {
    id,
    hasPocData: !!pocData,
    hasFeedback: !!pocData?.feedback,
    feedbackCount: pocData?.feedback?.count,
  });

  // IDで見つからない場合、共有トークンとして試行
  if (!pocData) {
    pocData = await pocService.getPoCByShareToken(id);
  }

  if (!pocData) {
    notFound();
  }

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            PoC プレビュー
          </h1>
          <p className="text-gray-500 mt-1">
            ID: {pocData.pocId}
          </p>
        </div>

        <PoCViewer html={pocData.generatedHtml} />

        <FeedbackForm
          pocId={pocData.pocId}
          selectedPains={pocData.selectedPains}
          existingFeedback={pocData.feedback}
        />
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return {
    title: `PoC ${id} | Sales PoC Generator`,
    description: 'AI活用PoCのプレビュー',
  };
}
