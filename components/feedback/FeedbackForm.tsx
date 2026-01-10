'use client';

import { useState } from 'react';
import type {
  UserRating,
  PositiveType,
  BlockerType,
  FeedbackData,
  EmbeddedFeedback,
} from '@/types';
import {
  POSITIVE_LABELS,
  BLOCKER_LABELS,
  USER_RATING_LABELS,
} from '@/types';
import { Button, Card, CardContent, CardHeader, CardTitle, Textarea } from '@/components/ui';
import { cn } from '@/lib/utils';

interface FeedbackFormProps {
  pocId: string;
  selectedPains: string[];
  existingFeedback?: EmbeddedFeedback;
  onSubmitSuccess?: () => void;
}

// スコアから表示情報を取得
function getScoreDisplay(score: number): { label: string; emoji: string; color: string } {
  if (score >= 2.5) return { label: '高評価', emoji: '😊', color: 'text-green-600' };
  if (score >= 1.5) return { label: '普通', emoji: '😐', color: 'text-yellow-600' };
  return { label: '低評価', emoji: '😕', color: 'text-red-500' };
}

export function FeedbackForm({
  pocId,
  selectedPains,
  existingFeedback,
  onSubmitSuccess,
}: FeedbackFormProps) {
  const [userRating, setUserRating] = useState<UserRating | null>(null);
  const [positives, setPositives] = useState<PositiveType[]>([]);
  const [blockers, setBlockers] = useState<BlockerType[]>([]);
  const [freeComment, setFreeComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(!existingFeedback);

  const togglePositive = (value: PositiveType) => {
    setPositives((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : [...prev, value]
    );
  };

  const toggleBlocker = (value: BlockerType) => {
    setBlockers((prev) =>
      prev.includes(value)
        ? prev.filter((b) => b !== value)
        : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!userRating) {
      setError('評価を選択してください');
      return;
    }

    setLoading(true);
    setError(null);

    const feedbackData: FeedbackData = {
      pocId,
      selectedPains,
      userRating,
      positives,
      blockers,
      freeComment,
    };

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      });

      if (!response.ok) {
        throw new Error('フィードバックの送信に失敗しました');
      }

      setSubmitted(true);
      onSubmitSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  // 既存フィードバックのサマリー表示
  const renderExistingSummary = () => {
    if (!existingFeedback || existingFeedback.count === 0) return null;

    const scoreDisplay = getScoreDisplay(existingFeedback.weightedScore);

    return (
      <Card className="border-blue-200 bg-blue-50 mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 text-lg">評価サマリー</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 加重平均スコア */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{scoreDisplay.emoji}</span>
            <div>
              <span className={`text-2xl font-bold ${scoreDisplay.color}`}>
                {existingFeedback.weightedScore.toFixed(1)}
              </span>
              <span className="text-gray-500 text-sm ml-1">/ 3.0</span>
              <p className="text-sm text-gray-600">
                {existingFeedback.count}件の評価（{scoreDisplay.label}）
              </p>
            </div>
          </div>

          {/* 最新の評価一覧（最大3件） */}
          {existingFeedback.entries.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">最近の評価</h4>
              <div className="space-y-2">
                {existingFeedback.entries.slice(0, 3).map((entry, index) => (
                  <div key={index} className="bg-white p-2 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <span>{RATING_EMOJIS[entry.userRating]}</span>
                      <span className="text-gray-700">{USER_RATING_LABELS[entry.userRating]}</span>
                      <span className="text-gray-400 text-xs ml-auto">
                        {new Date(entry.feedbackAt).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                    {entry.freeComment && (
                      <p className="text-gray-500 mt-1 text-xs">{entry.freeComment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 追加評価ボタン */}
          {!showForm && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              追加で評価する
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (submitted) {
    return (
      <>
        {renderExistingSummary()}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-800">
              フィードバックありがとうございます
            </h3>
            <p className="mt-2 text-sm text-green-600">
              いただいたご意見は今後の改善に活用させていただきます
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  // フォームを表示しない場合（既存フィードバックがあり、追加評価ボタンが押されていない）
  if (!showForm && existingFeedback) {
    return renderExistingSummary();
  }

  return (
    <>
      {renderExistingSummary()}
      <Card>
        <CardHeader>
          <CardTitle>
            {existingFeedback ? '追加フィードバック' : 'フィードバック'}
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-6">
        {/* 評価 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            このPoCはいかがでしたか？
            <span className="text-red-500">*</span>
          </h4>
          <div className="flex gap-3">
            {(Object.entries(USER_RATING_LABELS) as [UserRating, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUserRating(value)}
                  className={cn(
                    'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                    userRating === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl mb-1 block">
                    {RATING_EMOJIS[value]}
                  </span>
                  <span className="text-sm">{label}</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* 良かった点 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            良かった点（複数選択可）
          </h4>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(POSITIVE_LABELS) as [PositiveType, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => togglePositive(value)}
                  className={cn(
                    'px-4 py-2 rounded-full border transition-all text-sm',
                    positives.includes(value)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* 引っかかった点 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            引っかかった点（複数選択可）
          </h4>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(BLOCKER_LABELS) as [BlockerType, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleBlocker(value)}
                  className={cn(
                    'px-4 py-2 rounded-full border transition-all text-sm',
                    blockers.includes(value)
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* 一言コメント */}
        <div>
          <Textarea
            label="一言コメント（任意）"
            placeholder="ご意見・ご感想があればお聞かせください"
            value={freeComment}
            onChange={(e) => setFreeComment(e.target.value)}
            rows={3}
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">
            {error}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          loading={loading}
          disabled={!userRating}
          className="w-full"
        >
          フィードバックを送信
        </Button>
      </CardContent>
      </Card>
    </>
  );
}

const RATING_EMOJIS: Record<UserRating, string> = {
  helpful: '😊',
  meh: '😐',
  unknown: '🤔',
};
