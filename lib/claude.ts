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

  // 機能をJSON配列として準備
  const featuresArray = JSON.stringify(autoConfig.hypothesisFeatures);

  return `あなたはAI PoC（Proof of Concept）デモを生成するアシスタントです。
以下の仕様に基づいて、**実際のAI APIを呼び出すインタラクティブなHTMLデモページ**を生成してください。

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

## 必須要件：実際のAI APIを呼び出すデモUI

### 1. レイアウト構成
- **ヘッダー**: デモのタイトルとKPI目標を表示
- **入力エリア**: 大きなテキストエリア（min-height: 200px）、サンプル入力をデフォルト値に
- **実行ボタン**: 目立つデザインの「AI処理を実行」ボタン
- **出力エリア**: 結果表示用の広いエリア（min-height: 300px）

### 2. 重要：API呼び出しの実装

以下のJavaScriptコードを**必ずそのまま**使用してください：

\`\`\`javascript
async function processWithAI() {
  const input = document.getElementById('inputText').value;
  const outputArea = document.getElementById('outputArea');
  const button = document.getElementById('processButton');

  if (!input.trim()) {
    alert('テキストを入力してください');
    return;
  }

  // ローディング表示
  button.disabled = true;
  button.textContent = '処理中...';
  outputArea.innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner"></div><p>AIが処理中です...</p></div>';

  try {
    const response = await fetch('/api/demo/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: input,
        context: {
          features: ${featuresArray},
          scenario: '${adjustments.scenario || ''}',
          tone: '${adjustments.tone || 'ビジネス'}'
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      outputArea.innerHTML = '<div style="color:red;padding:20px;">エラー: ' + data.error + '</div>';
    } else {
      // 結果を整形して表示
      const formatted = data.result.replace(/\\n/g, '<br>');
      outputArea.innerHTML = '<div style="padding:20px;line-height:1.8;white-space:pre-wrap;">' + formatted + '</div>';
    }
  } catch (error) {
    outputArea.innerHTML = '<div style="color:red;padding:20px;">通信エラーが発生しました</div>';
  } finally {
    button.disabled = false;
    button.textContent = 'AI処理を実行';
  }
}
\`\`\`

### 3. CSSスピナーアニメーション（必須）
\`\`\`css
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
\`\`\`

### 4. HTML要素のID（必須）
- テキストエリア: id="inputText"
- 実行ボタン: id="processButton" onclick="processWithAI()"
- 出力エリア: id="outputArea"

## 出力形式の要件
1. **standalone HTML**: 単一ファイルで完結
2. **外部リソース禁止**: CDN、外部画像は不可
3. **インラインCSS/JS**: すべてインラインで記述
4. **大きく見やすいUI**: フォントサイズ16px以上、十分な余白
5. **モダンなデザイン**: グラデーション背景、カードデザイン、シャドウ
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
