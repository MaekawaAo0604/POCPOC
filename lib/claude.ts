/**
 * Claude API クライアント
 *
 * PoC用HTML生成のためのClaude API統合
 */
import Anthropic from '@anthropic-ai/sdk';
import type { PoCSpec } from '@/types';

export interface ClaudeApi {
  generateHtml(spec: PoCSpec): Promise<string>;
}

// Anthropicクライアント（遅延初期化）
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

/**
 * PoCSpec からプロンプトを生成
 */
export function buildPrompt(spec: PoCSpec): string {
  const { autoConfig, adjustments, sampleInput } = spec;

  const featuresSection = autoConfig.hypothesisFeatures
    .map((f, i) => `${i + 1}. ${f}`)
    .join('\n');

  const kpiSection = `目標KPI: ${autoConfig.kpiTarget.metric} ${autoConfig.kpiTarget.value}${autoConfig.kpiTarget.unit}`;

  const scenarioSection = adjustments.scenario
    ? `想定シナリオ: ${adjustments.scenario}`
    : '';

  const toneSection = adjustments.tone
    ? `トーン: ${adjustments.tone}`
    : '';

  const styleSection = adjustments.outputStyle
    ? `出力スタイル: ${adjustments.outputStyle}`
    : '';

  const notesSection = adjustments.additionalNotes
    ? `追加指示: ${adjustments.additionalNotes}`
    : '';

  return `あなたはAI PoC（Proof of Concept）デモを生成するアシスタントです。
以下の仕様に基づいて、インタラクティブなHTMLデモページを生成してください。

## 仮説機能（このPoCで検証したい機能）
${featuresSection}

## ${kpiSection}

## 根拠
${autoConfig.rationale}

${scenarioSection}
${toneSection}
${styleSection}
${notesSection}

## サンプル入力
以下のサンプル入力に対するAI処理結果をデモとして表示してください：
「${sampleInput}」

## 出力形式の要件
1. **standalone HTML**: 単一のHTMLファイルとして完結すること
2. **外部リソース禁止**: 外部のスクリプト、スタイルシート、画像は一切使用しないこと
3. **インラインスタイル/スクリプト**: すべてのCSS/JSはインラインで記述すること
4. **レスポンシブ**: モバイルでも見やすいデザイン
5. **日本語対応**: UIテキストはすべて日本語で
6. **デモ性**: 実際のAI処理結果を模したリアルなデモ

HTMLのみを出力してください。説明やマークダウンは不要です。
<!DOCTYPE html>から始めてください。`;
}

/**
 * レスポンスからHTMLを抽出
 */
function extractHtml(text: string): string {
  // マークダウンのコードブロックから抽出
  const codeBlockMatch = text.match(/```(?:html)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // <!DOCTYPE html> または <html> から始まる場合はそのまま返す
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    return text.trim();
  }

  return text.trim();
}

/**
 * Claude APIクライアント実装
 */
export const claudeApi: ClaudeApi = {
  async generateHtml(spec: PoCSpec): Promise<string> {
    const client = getAnthropicClient();
    const prompt = buildPrompt(spec);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // レスポンス検証
    if (!response.content || response.content.length === 0) {
      throw new Error('Claude API returned empty response');
    }

    const firstContent = response.content[0];
    if (firstContent.type !== 'text') {
      throw new Error('Claude API returned non-text response');
    }

    return extractHtml(firstContent.text);
  },
};
