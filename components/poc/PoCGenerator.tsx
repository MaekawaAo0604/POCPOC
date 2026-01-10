'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Adjustments, AutoConfig, PoCResult } from '@/types';
import { PainSelector } from '@/components/pain-selector';
import { AutoConfigDisplay } from '@/components/auto-config';
import { AdjustmentForm, SampleInputForm } from '@/components/adjustment';
import { Button, Card, CardContent } from '@/components/ui';

interface PoCGeneratorProps {
  onGenerated: (result: PoCResult) => void;
}

const INITIAL_ADJUSTMENTS: Adjustments = {
  scenario: '',
  tone: '',
  outputStyle: '',
  additionalNotes: '',
};

export function PoCGenerator({ onGenerated }: PoCGeneratorProps) {
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [autoConfig, setAutoConfig] = useState<AutoConfig | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustments>(INITIAL_ADJUSTMENTS);
  const [sampleInput, setSampleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AutoConfig取得
  const fetchAutoConfig = useCallback(async (painIds: string[]) => {
    if (painIds.length === 0) {
      setAutoConfig(null);
      return;
    }

    setConfigLoading(true);
    try {
      const response = await fetch('/api/config/pains');
      if (!response.ok) throw new Error('設定の取得に失敗');

      const config = await response.json();

      // 選択されたペインのAutoConfigを結合
      const selectedAutoConfigs: AutoConfig[] = [];
      for (const category of config.categories) {
        for (const pain of category.pains) {
          if (painIds.includes(pain.id)) {
            selectedAutoConfigs.push(pain.autoConfig);
          }
        }
      }

      if (selectedAutoConfigs.length === 0) {
        setAutoConfig(null);
        return;
      }

      // 結合処理
      const combined: AutoConfig = {
        hypothesisFeatures: Array.from(
          new Set(selectedAutoConfigs.flatMap((c) => c.hypothesisFeatures))
        ),
        recommendedOutputs: Array.from(
          new Set(selectedAutoConfigs.flatMap((c) => c.recommendedOutputs))
        ),
        kpiTarget: selectedAutoConfigs[0].kpiTarget,
        rationale: selectedAutoConfigs.map((c) => c.rationale).join(' '),
      };

      setAutoConfig(combined);
    } catch (err) {
      console.error('AutoConfig fetch error:', err);
    } finally {
      setConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutoConfig(selectedPains);
  }, [selectedPains, fetchAutoConfig]);

  const handleGenerate = async () => {
    if (selectedPains.length === 0) {
      setError('課題を選択してください');
      return;
    }

    if (!sampleInput.trim()) {
      setError('サンプル入力を入力してください');
      return;
    }

    if (!autoConfig) {
      setError('AutoConfigの取得に失敗しました');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/poc/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedPains,
          autoConfig,
          adjustments,
          sampleInput,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'PoC生成に失敗しました');
      }

      const result: PoCResult = await response.json();
      onGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = selectedPains.length > 0 && sampleInput.trim() && autoConfig;

  return (
    <div className="space-y-6">
      {/* Step 1: ペイン選択 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Step 1: 課題を選択
        </h2>
        <PainSelector
          selectedPains={selectedPains}
          onSelectionChange={setSelectedPains}
          maxSelection={3}
        />
      </section>

      {/* AutoConfig表示 */}
      {selectedPains.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            AI仮説（自動生成）
          </h2>
          <AutoConfigDisplay config={autoConfig} loading={configLoading} />
        </section>
      )}

      {/* Step 2: サンプル入力 */}
      {selectedPains.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 2: サンプル入力
          </h2>
          <SampleInputForm
            sampleInput={sampleInput}
            onSampleInputChange={setSampleInput}
          />
        </section>
      )}

      {/* Step 3: 調整オプション */}
      {selectedPains.length > 0 && sampleInput && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Step 3: 調整オプション（任意）
          </h2>
          <AdjustmentForm
            adjustments={adjustments}
            onAdjustmentsChange={setAdjustments}
          />
        </section>
      )}

      {/* 生成ボタン */}
      {selectedPains.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {error && (
              <p className="mb-4 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <Button
              size="lg"
              onClick={handleGenerate}
              loading={loading}
              disabled={!canGenerate}
              className="w-full"
            >
              {loading ? 'PoCを生成中...' : 'PoCを生成する'}
            </Button>

            {!canGenerate && !loading && (
              <p className="mt-3 text-sm text-gray-500 text-center">
                {!sampleInput.trim()
                  ? 'サンプル入力を入力してください'
                  : '課題を選択してください'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
