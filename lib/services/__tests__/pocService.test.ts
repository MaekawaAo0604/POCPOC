import type { PoCSpec, PoCData } from '@/types';

// KVモック
jest.mock('@/lib/kv', () => ({
  kv: {
    set: jest.fn(),
    get: jest.fn(),
  },
  KEYS: {
    poc: (id: string) => `poc:${id}`,
    share: (token: string) => `share:${token}`,
    feedbacks: 'feedbacks',
  },
  DEFAULT_TTL_SECONDS: 86400,
}));

// Claude APIモック
jest.mock('@/lib/claude', () => ({
  claudeApi: {
    generateHtml: jest.fn(),
  },
}));

// ID生成モック
jest.mock('@/lib/utils/idGenerator', () => ({
  generatePocId: jest.fn(() => 'test-poc-id-123'),
  generateShareToken: jest.fn(() => 'test-share-token-456'),
}));

// HTMLサニタイザーモック
jest.mock('@/lib/utils/htmlSanitizer', () => ({
  sanitizeHtml: jest.fn((html: string) => ({
    html,
    isSafe: true,
    warnings: [],
  })),
}));

// モック後にインポート
import {
  PoCService,
  createPoCService,
} from '../pocService';
import { kv } from '@/lib/kv';
import { claudeApi } from '@/lib/claude';

// モック関数への参照
const mockKv = kv as jest.Mocked<typeof kv>;
const mockClaudeApi = claudeApi as jest.Mocked<typeof claudeApi>;

describe('PoCService', () => {
  let service: PoCService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createPoCService();
  });

  describe('generatePoC', () => {
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
        rationale: 'テスト根拠',
      },
      adjustments: {
        scenario: 'カスタムシナリオ',
        tone: 'カジュアル',
        outputStyle: 'シンプル',
        additionalNotes: '',
      },
      sampleInput: 'サンプル入力テキスト',
    };

    it('should generate PoC and save to KV', async () => {
      const mockHtml = '<div>Generated PoC HTML</div>';
      mockClaudeApi.generateHtml.mockResolvedValue(mockHtml);
      mockKv.set.mockResolvedValue('OK' as never);

      const result = await service.generatePoC(mockSpec);

      expect(result).toBeDefined();
      expect(result.pocId).toBe('test-poc-id-123');
      expect(result.html).toBe(mockHtml);
      expect(result.meta).toBeDefined();
      expect(result.meta.selectedPains).toEqual(['cs_response_time']);
    });

    it('should call Claude API with spec', async () => {
      mockClaudeApi.generateHtml.mockResolvedValue('<div>HTML</div>');
      mockKv.set.mockResolvedValue('OK' as never);

      await service.generatePoC(mockSpec);

      expect(mockClaudeApi.generateHtml).toHaveBeenCalledWith(mockSpec);
    });

    it('should save PoC data to KV with TTL', async () => {
      mockClaudeApi.generateHtml.mockResolvedValue('<div>HTML</div>');
      mockKv.set.mockResolvedValue('OK' as never);

      await service.generatePoC(mockSpec);

      expect(mockKv.set).toHaveBeenCalledWith(
        'poc:test-poc-id-123',
        expect.objectContaining({
          pocId: 'test-poc-id-123',
          selectedPains: ['cs_response_time'],
          generatedHtml: '<div>HTML</div>',
        }),
        { ex: 86400 }
      );
    });

    it('should include createdAt timestamp', async () => {
      mockClaudeApi.generateHtml.mockResolvedValue('<div>HTML</div>');
      mockKv.set.mockResolvedValue('OK' as never);

      const result = await service.generatePoC(mockSpec);

      expect(result.meta.createdAt).toBeDefined();
      expect(new Date(result.meta.createdAt)).toBeInstanceOf(Date);
    });

    it('should sanitize HTML from Claude API', async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { sanitizeHtml } = require('@/lib/utils/htmlSanitizer');
      const unsafeHtml = '<div><script src="http://evil.com"></script></div>';
      mockClaudeApi.generateHtml.mockResolvedValue(unsafeHtml);
      mockKv.set.mockResolvedValue('OK' as never);

      await service.generatePoC(mockSpec);

      expect(sanitizeHtml).toHaveBeenCalledWith(unsafeHtml);
    });

    it('should throw error when Claude API fails', async () => {
      mockClaudeApi.generateHtml.mockRejectedValue(new Error('API Error'));

      await expect(service.generatePoC(mockSpec)).rejects.toThrow('API Error');
    });

    it('should throw error when KV save fails', async () => {
      mockClaudeApi.generateHtml.mockResolvedValue('<div>HTML</div>');
      mockKv.set.mockRejectedValue(new Error('KV Error'));

      await expect(service.generatePoC(mockSpec)).rejects.toThrow('KV Error');
    });
  });

  describe('getPoC', () => {
    it('should return PoC data when exists', async () => {
      const mockPoCData: PoCData = {
        pocId: 'existing-poc-id',
        selectedPains: ['cs_response_time'],
        autoConfig: {
          hypothesisFeatures: [],
          recommendedOutputs: [],
          kpiTarget: { metric: 'test', value: 10, unit: '%' },
          rationale: 'test',
        },
        adjustments: {
          scenario: '',
          tone: '',
          outputStyle: '',
          additionalNotes: '',
        },
        sampleInput: 'sample',
        generatedHtml: '<div>HTML</div>',
        createdAt: '2024-01-01T00:00:00.000Z',
      };
      mockKv.get.mockResolvedValue(mockPoCData as never);

      const result = await service.getPoC('existing-poc-id');

      expect(result).toEqual(mockPoCData);
      expect(mockKv.get).toHaveBeenCalledWith('poc:existing-poc-id');
    });

    it('should return null when PoC not found (TTL expired)', async () => {
      mockKv.get.mockResolvedValue(null as never);

      const result = await service.getPoC('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createShareToken', () => {
    const mockPoCData: PoCData = {
      pocId: 'existing-poc-id',
      selectedPains: ['cs_response_time'],
      autoConfig: {
        hypothesisFeatures: [],
        recommendedOutputs: [],
        kpiTarget: { metric: 'test', value: 10, unit: '%' },
        rationale: 'test',
      },
      adjustments: {
        scenario: '',
        tone: '',
        outputStyle: '',
        additionalNotes: '',
      },
      sampleInput: 'sample',
      generatedHtml: '<div>HTML</div>',
      createdAt: '2024-01-01T00:00:00.000Z',
    };

    beforeEach(() => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';
    });

    it('should create share token and return share URL', async () => {
      mockKv.get.mockResolvedValue(mockPoCData as never);
      mockKv.set.mockResolvedValue('OK' as never);

      const shareUrl = await service.createShareToken('existing-poc-id');

      expect(shareUrl).toBe('https://example.com/poc/existing-poc-id?share=test-share-token-456');
    });

    it('should save share token to KV', async () => {
      mockKv.get.mockResolvedValue(mockPoCData as never);
      mockKv.set.mockResolvedValue('OK' as never);

      await service.createShareToken('existing-poc-id');

      expect(mockKv.set).toHaveBeenCalledWith(
        'share:test-share-token-456',
        'existing-poc-id',
        { ex: 86400 }
      );
    });

    it('should update PoC data with share token', async () => {
      mockKv.get.mockResolvedValue(mockPoCData as never);
      mockKv.set.mockResolvedValue('OK' as never);

      await service.createShareToken('existing-poc-id');

      expect(mockKv.set).toHaveBeenCalledWith(
        'poc:existing-poc-id',
        expect.objectContaining({
          shareToken: 'test-share-token-456',
        }),
        { ex: 86400 }
      );
    });

    it('should throw error when PoC not found', async () => {
      mockKv.get.mockResolvedValue(null as never);

      await expect(service.createShareToken('non-existent-id')).rejects.toThrow('PoC not found');
    });
  });

  describe('getPoCByShareToken', () => {
    it('should return PoC data by share token', async () => {
      const mockPoCData: PoCData = {
        pocId: 'poc-id',
        selectedPains: [],
        autoConfig: {
          hypothesisFeatures: [],
          recommendedOutputs: [],
          kpiTarget: { metric: 'test', value: 10, unit: '%' },
          rationale: 'test',
        },
        adjustments: {
          scenario: '',
          tone: '',
          outputStyle: '',
          additionalNotes: '',
        },
        sampleInput: '',
        generatedHtml: '<div>HTML</div>',
        createdAt: '2024-01-01T00:00:00.000Z',
        shareToken: 'valid-share-token',
      };

      mockKv.get
        .mockResolvedValueOnce('poc-id' as never)  // share token -> poc id
        .mockResolvedValueOnce(mockPoCData as never);  // poc id -> data

      const result = await service.getPoCByShareToken('valid-share-token');

      expect(result).toEqual(mockPoCData);
      expect(mockKv.get).toHaveBeenCalledWith('share:valid-share-token');
    });

    it('should return null when share token not found', async () => {
      mockKv.get.mockResolvedValue(null as never);

      const result = await service.getPoCByShareToken('invalid-token');

      expect(result).toBeNull();
    });

    it('should return null when PoC not found for share token', async () => {
      mockKv.get
        .mockResolvedValueOnce('poc-id' as never)  // share token exists
        .mockResolvedValueOnce(null as never);  // but PoC expired

      const result = await service.getPoCByShareToken('valid-but-expired-token');

      expect(result).toBeNull();
    });
  });
});
