'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';

interface ShareButtonProps {
  pocId: string;
  shareToken?: string;
  onShareCreated?: (token: string) => void;
}

export function ShareButton({
  pocId,
  shareToken: initialToken,
  onShareCreated,
}: ShareButtonProps) {
  const [shareToken, setShareToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/poc/${pocId}/share`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('共有リンクの作成に失敗しました');
      }

      const data = await response.json();
      setShareToken(data.shareToken);
      onShareCreated?.(data.shareToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareToken) return;

    const shareUrl = `${window.location.origin}/poc/${shareToken}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('コピーに失敗しました');
    }
  };

  if (shareToken) {
    const shareUrl = `${window.location.origin}/poc/${shareToken}`;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg"
          />
          <Button
            size="sm"
            variant={copied ? 'secondary' : 'primary'}
            onClick={copyToClipboard}
          >
            {copied ? 'コピーしました' : 'コピー'}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          このリンクは24時間有効です
        </p>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="secondary"
        onClick={createShare}
        loading={loading}
        className="flex items-center gap-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        共有リンクを作成
      </Button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
