'use client';

import { useState } from 'react';
import type { PoCResult } from '@/types';
import { PoCGenerator, PoCResult as PoCResultView } from '@/components/poc';

export default function Home() {
  const [result, setResult] = useState<PoCResult | null>(null);

  const handleGenerated = (pocResult: PoCResult) => {
    setResult(pocResult);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {result ? (
          <PoCResultView result={result} onReset={handleReset} />
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                AI営業デモを即座に生成
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                お客様の課題を選択し、サンプルデータを入力するだけで、
                インタラクティブなAI活用PoCを自動生成します。
              </p>
            </div>
            <PoCGenerator onGenerated={handleGenerated} />
          </>
        )}
      </div>
    </div>
  );
}
