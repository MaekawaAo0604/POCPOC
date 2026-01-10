'use client';

import { useState } from 'react';
import type { PainCategory, PainDetail } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { cn } from '@/lib/utils';

interface PainCategoryCardProps {
  category: PainCategory;
  selectedPains: string[];
  onPainToggle: (painId: string) => void;
}

export function PainCategoryCard({
  category,
  selectedPains,
  onPainToggle,
}: PainCategoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedCount = category.pains.filter((p) =>
    selectedPains.includes(p.id)
  ).length;

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer',
        selectedCount > 0 && 'border-blue-500 bg-blue-50/50'
      )}
    >
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {category.name}
              {selectedCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                  {selectedCount}件選択
                </span>
              )}
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          </div>
          <svg
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-2">
            {category.pains.map((pain) => (
              <PainItem
                key={pain.id}
                pain={pain}
                isSelected={selectedPains.includes(pain.id)}
                onToggle={() => onPainToggle(pain.id)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface PainItemProps {
  pain: PainDetail;
  isSelected: boolean;
  onToggle: () => void;
}

function PainItem({ pain, isSelected, onToggle }: PainItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
            isSelected
              ? 'border-blue-500 bg-blue-500'
              : 'border-gray-300'
          )}
        >
          {isSelected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{pain.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{pain.description}</p>
        </div>
      </div>
    </button>
  );
}
