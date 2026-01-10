import type { PoCSpec } from '@/types';

// Anthropic SDKモック
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
    },
  })),
}));

// モック後にインポート
import { claudeApi, buildPrompt } from '../claude';

describe('Claude API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
  });

  describe('buildPrompt', () => {
    const mockSpec: PoCSpec = {
      selectedPains: ['cs_response_time'],
      autoConfig: {
        hypothesisFeatures: ['問い合わせ内容の自動分類', '回答ドラフトの自動生成'],
        recommendedOutputs: ['category', 'reply_draft'],
        kpiTarget: {
          metric: '初期対応時間',
          value: 50,
          unit: '%削減',
        },
        rationale: '問い合わせ内容を自動分類し、回答ドラフトを生成することで、対応時間を大幅に短縮できます。',
      },
      adjustments: {
        scenario: 'ECサイトの問い合わせ対応',
        tone: 'ビジネス',
        outputStyle: '詳細',
        additionalNotes: 'チャット形式で表示',
      },
      sampleInput: '商品の返品について教えてください。先週購入した商品に不具合がありました。',
    };

    it('should include hypothesis features in prompt', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('問い合わせ内容の自動分類');
      expect(prompt).toContain('回答ドラフトの自動生成');
    });

    it('should include KPI target in prompt', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('初期対応時間');
      expect(prompt).toContain('50');
      expect(prompt).toContain('%削減');
    });

    it('should include sample input in prompt', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('商品の返品について教えてください');
    });

    it('should include scenario if provided', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('ECサイトの問い合わせ対応');
    });

    it('should include output style in prompt', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('詳細');
    });

    it('should include additional notes in prompt', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('チャット形式で表示');
    });

    it('should request standalone HTML', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toContain('HTML');
      expect(prompt).toMatch(/<!DOCTYPE|<html|standalone/i);
    });

    it('should request no external resources', () => {
      const prompt = buildPrompt(mockSpec);

      expect(prompt).toMatch(/外部.*禁止|external.*forbidden|インライン|inline/i);
    });
  });

  describe('generateHtml', () => {
    const mockSpec: PoCSpec = {
      selectedPains: ['cs_response_time'],
      autoConfig: {
        hypothesisFeatures: ['問い合わせ内容の自動分類'],
        recommendedOutputs: ['category', 'reply_draft'],
        kpiTarget: {
          metric: '初期対応時間',
          value: 50,
          unit: '%削減',
        },
        rationale: 'テスト',
      },
      adjustments: {
        scenario: '',
        tone: '',
        outputStyle: '',
        additionalNotes: '',
      },
      sampleInput: 'テスト入力',
    };

    it('should call Anthropic API with correct parameters', async () => {
      const mockHtml = '<!DOCTYPE html><html><body>Generated HTML</body></html>';
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: mockHtml }],
      });

      await claudeApi.generateHtml(mockSpec);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining('claude'),
          max_tokens: expect.any(Number),
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.any(String),
            }),
          ]),
        })
      );
    });

    it('should return generated HTML from API response', async () => {
      const mockHtml = '<!DOCTYPE html><html><body>Generated HTML</body></html>';
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: mockHtml }],
      });

      const result = await claudeApi.generateHtml(mockSpec);

      expect(result).toBe(mockHtml);
    });

    it('should extract HTML from markdown code block if present', async () => {
      const mockHtml = '<!DOCTYPE html><html><body>Generated HTML</body></html>';
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: '```html\n' + mockHtml + '\n```' }],
      });

      const result = await claudeApi.generateHtml(mockSpec);

      expect(result).toBe(mockHtml);
    });

    it('should throw error when API call fails', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(claudeApi.generateHtml(mockSpec)).rejects.toThrow('API Error');
    });

    it('should throw error when response has no content', async () => {
      mockCreate.mockResolvedValue({
        content: [],
      });

      await expect(claudeApi.generateHtml(mockSpec)).rejects.toThrow();
    });

    it('should throw error when response content is not text', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'image', source: {} }],
      });

      await expect(claudeApi.generateHtml(mockSpec)).rejects.toThrow();
    });
  });
});
