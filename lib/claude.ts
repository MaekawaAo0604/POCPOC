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
以下の仕様に基づいて、**入力と出力が体験できるインタラクティブなHTMLデモページ**を生成してください。

## 仮説機能（このPoCで検証したい機能）
${featuresSection}

## ${kpiSection}

## 根拠
${autoConfig.rationale}

${scenarioSection}
${toneSection}
${styleSection}
${notesSection}

## サンプル入力（デフォルト値として使用）
「${sampleInput}」

## 必須要件：インタラクティブなデモUI

生成するHTMLは以下の構成にしてください：

### 1. 入力エリア
- テキストエリア（複数行入力可能）
- サンプル入力をデフォルト値として表示
- 「AI処理を実行」ボタン

### 2. 出力エリア
- 処理結果を表示するエリア
- 最初は非表示または「ここに結果が表示されます」と表示

### 3. JavaScript動作
- ボタンクリックで入力テキストを取得
- **ローディング表示**（「処理中...」やスピナー）を2-3秒表示
- 入力内容に基づいた**それらしいAI処理結果**を生成して表示
- 結果は仮説機能に沿った形式で表示（要約、分類、回答ドラフトなど）

### 4. 処理ロジック（JavaScript内で実装）
- 入力テキストを解析して、それっぽい結果を生成
- 例：キーワード抽出、文章の長さに応じた要約、定型的な分類結果など
- 完全なAIではないが、**デモとして説得力のある結果**を返す

## 出力形式の要件
1. **standalone HTML**: 単一のHTMLファイルとして完結
2. **外部リソース禁止**: 外部スクリプト、CDN、画像は一切不可
3. **インラインスタイル/スクリプト**: CSS/JSはすべてインライン
4. **モダンなデザイン**: 見栄えの良いUI（グラデーション、カードデザイン、適切な余白）
5. **レスポンシブ**: モバイルでも見やすい
6. **日本語対応**: すべて日本語で

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
