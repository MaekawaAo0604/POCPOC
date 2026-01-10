'use client';

import { useEffect, useState } from 'react';
import type { PainConfig } from '@/types';
import { PainCategoryCard } from './PainCategoryCard';

interface PainSelectorProps {
  selectedPains: string[];
  onSelectionChange: (painIds: string[]) => void;
  maxSelection?: number;
}

export function PainSelector({
  selectedPains,
  onSelectionChange,
  maxSelection = 3,
}: PainSelectorProps) {
  const [config, setConfig] = useState<PainConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch('/api/config/pains');
        if (!response.ok) {
          throw new Error('設定の取得に失敗しました');
        }
        const data = await response.json();
        setConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  const handlePainToggle = (painId: string) => {
    const isSelected = selectedPains.includes(painId);

    if (isSelected) {
      onSelectionChange(selectedPains.filter((id) => id !== painId));
    } else {
      if (selectedPains.length >= maxSelection) {
        return;
      }
      onSelectionChange([...selectedPains, painId]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          課題を選択してください（最大{maxSelection}件）
        </p>
        <p className="text-sm font-medium text-blue-600">
          {selectedPains.length}/{maxSelection}件選択中
        </p>
      </div>

      <div className="space-y-3">
        {config.categories.map((category) => (
          <PainCategoryCard
            key={category.id}
            category={category}
            selectedPains={selectedPains}
            onPainToggle={handlePainToggle}
          />
        ))}
      </div>

      {selectedPains.length >= maxSelection && (
        <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          選択上限に達しました。他の課題を選択するには、選択済みの課題を解除してください。
        </p>
      )}
    </div>
  );
}
