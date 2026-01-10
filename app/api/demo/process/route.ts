/**
 * POST /api/demo/process
 * デモHTML内からClaude APIを呼び出すためのプロキシエンドポイント
 */
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface ProcessRequest {
  input: string;
  context: {
    features: string[];
    scenario?: string;
    tone?: string;
  };
}

// Anthropicクライアント
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessRequest = await request.json();

    if (!body.input || body.input.trim() === '') {
      return NextResponse.json(
        { error: '入力が空です' },
        { status: 400 }
      );
    }

    const client = getAnthropicClient();

    // 機能に基づいたプロンプト生成
    const featuresText = body.context.features?.join('、') || 'テキスト処理';
    const scenarioText = body.context.scenario || '';
    const toneText = body.context.tone || 'ビジネス';

    const prompt = `あなたはAIアシスタントです。以下の入力に対して処理を行ってください。

## 実行する機能
${featuresText}

${scenarioText ? `## シナリオ\n${scenarioText}\n` : ''}
## トーン
${toneText}

## 入力
${body.input}

## 出力形式
- 見やすく構造化されたテキストで出力
- 必要に応じて箇条書きや見出しを使用
- 日本語で回答`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (!response.content || response.content.length === 0) {
      throw new Error('Empty response');
    }

    const firstContent = response.content[0];
    if (firstContent.type !== 'text') {
      throw new Error('Non-text response');
    }

    return NextResponse.json({
      result: firstContent.text,
    });
  } catch (error) {
    console.error('Demo process error:', error);
    return NextResponse.json(
      { error: 'AI処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
