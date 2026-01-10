import type { FeedbackData } from '@/types';

// KVモック
jest.mock('@/lib/kv', () => ({
  kv: {
    lpush: jest.fn(),
    lrange: jest.fn(),
  },
  KEYS: {
    poc: (id: string) => `poc:${id}`,
    share: (token: string) => `share:${token}`,
    feedbacks: 'feedbacks',
  },
}));

// ID生成モック
jest.mock('@/lib/utils/idGenerator', () => ({
  generatePocId: jest.fn(() => 'test-feedback-id-123'),
}));

// モック後にインポート
import {
  FeedbackService,
  createFeedbackService,
} from '../feedbackService';
import { kv } from '@/lib/kv';

const mockKv = kv as jest.Mocked<typeof kv>;

describe('FeedbackService', () => {
  let service: FeedbackService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = createFeedbackService();
  });

  describe('saveFeedback', () => {
    const mockFeedbackData: FeedbackData = {
      pocId: 'poc-123',
      selectedPains: ['cs_response_time'],
      userRating: 'helpful',
      positives: ['time', 'quality'],
      blockers: [],
      freeComment: 'とても良いPoCでした',
    };

    it('should save feedback to KV with generated ID', async () => {
      mockKv.lpush.mockResolvedValue(1 as never);

      await service.saveFeedback(mockFeedbackData);

      expect(mockKv.lpush).toHaveBeenCalledWith(
        'feedbacks',
        expect.stringContaining('"feedbackId":"test-feedback-id-123"')
      );
    });

    it('should include all feedback fields', async () => {
      mockKv.lpush.mockResolvedValue(1 as never);

      await service.saveFeedback(mockFeedbackData);

      const call = mockKv.lpush.mock.calls[0];
      const savedData = JSON.parse(call[1] as string);

      expect(savedData.pocId).toBe('poc-123');
      expect(savedData.selectedPains).toEqual(['cs_response_time']);
      expect(savedData.userRating).toBe('helpful');
      expect(savedData.positives).toEqual(['time', 'quality']);
      expect(savedData.blockers).toEqual([]);
      expect(savedData.freeComment).toBe('とても良いPoCでした');
    });

    it('should include createdAt timestamp', async () => {
      mockKv.lpush.mockResolvedValue(1 as never);

      await service.saveFeedback(mockFeedbackData);

      const call = mockKv.lpush.mock.calls[0];
      const savedData = JSON.parse(call[1] as string);

      expect(savedData.createdAt).toBeDefined();
      expect(new Date(savedData.createdAt)).toBeInstanceOf(Date);
    });

    it('should throw error when KV save fails', async () => {
      mockKv.lpush.mockRejectedValue(new Error('KV Error'));

      await expect(service.saveFeedback(mockFeedbackData)).rejects.toThrow('KV Error');
    });

    it('should handle feedback with blockers', async () => {
      mockKv.lpush.mockResolvedValue(1 as never);

      const feedbackWithBlockers: FeedbackData = {
        ...mockFeedbackData,
        userRating: 'meh',
        positives: [],
        blockers: ['complexity', 'security'],
      };

      await service.saveFeedback(feedbackWithBlockers);

      const call = mockKv.lpush.mock.calls[0];
      const savedData = JSON.parse(call[1] as string);

      expect(savedData.userRating).toBe('meh');
      expect(savedData.blockers).toEqual(['complexity', 'security']);
    });
  });

  describe('getFeedbacks', () => {
    const mockStoredFeedbacks: string[] = [
      JSON.stringify({
        feedbackId: 'fb-1',
        pocId: 'poc-1',
        selectedPains: ['cs_response_time'],
        userRating: 'positive',
        positives: ['accurate'],
        blockers: [],
        freeComment: 'Good',
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
      JSON.stringify({
        feedbackId: 'fb-2',
        pocId: 'poc-2',
        selectedPains: ['sales_proposal'],
        userRating: 'neutral',
        positives: [],
        blockers: [],
        freeComment: 'OK',
        createdAt: '2024-01-02T00:00:00.000Z',
      }),
    ];

    it('should return parsed feedbacks from KV', async () => {
      mockKv.lrange.mockResolvedValue(mockStoredFeedbacks as never);

      const result = await service.getFeedbacks();

      expect(result).toHaveLength(2);
      expect(result[0].feedbackId).toBe('fb-1');
      expect(result[1].feedbackId).toBe('fb-2');
    });

    it('should call lrange with default limit', async () => {
      mockKv.lrange.mockResolvedValue([] as never);

      await service.getFeedbacks();

      expect(mockKv.lrange).toHaveBeenCalledWith('feedbacks', 0, 99);
    });

    it('should call lrange with custom limit', async () => {
      mockKv.lrange.mockResolvedValue([] as never);

      await service.getFeedbacks(50);

      expect(mockKv.lrange).toHaveBeenCalledWith('feedbacks', 0, 49);
    });

    it('should return empty array when no feedbacks', async () => {
      mockKv.lrange.mockResolvedValue([] as never);

      const result = await service.getFeedbacks();

      expect(result).toEqual([]);
    });

    it('should throw error when KV fetch fails', async () => {
      mockKv.lrange.mockRejectedValue(new Error('KV Error'));

      await expect(service.getFeedbacks()).rejects.toThrow('KV Error');
    });
  });

  describe('getFeedbacksByPocId', () => {
    const mockStoredFeedbacks: string[] = [
      JSON.stringify({
        feedbackId: 'fb-1',
        pocId: 'poc-target',
        selectedPains: ['cs_response_time'],
        userRating: 'positive',
        positives: ['accurate'],
        blockers: [],
        freeComment: 'Good',
        createdAt: '2024-01-01T00:00:00.000Z',
      }),
      JSON.stringify({
        feedbackId: 'fb-2',
        pocId: 'poc-other',
        selectedPains: ['sales_proposal'],
        userRating: 'neutral',
        positives: [],
        blockers: [],
        freeComment: 'OK',
        createdAt: '2024-01-02T00:00:00.000Z',
      }),
      JSON.stringify({
        feedbackId: 'fb-3',
        pocId: 'poc-target',
        selectedPains: ['cs_quality_variance'],
        userRating: 'positive',
        positives: ['fast'],
        blockers: [],
        freeComment: 'Great',
        createdAt: '2024-01-03T00:00:00.000Z',
      }),
    ];

    it('should return only feedbacks for specified pocId', async () => {
      mockKv.lrange.mockResolvedValue(mockStoredFeedbacks as never);

      const result = await service.getFeedbacksByPocId('poc-target');

      expect(result).toHaveLength(2);
      expect(result[0].pocId).toBe('poc-target');
      expect(result[1].pocId).toBe('poc-target');
    });

    it('should return empty array when no matching feedbacks', async () => {
      mockKv.lrange.mockResolvedValue(mockStoredFeedbacks as never);

      const result = await service.getFeedbacksByPocId('poc-nonexistent');

      expect(result).toEqual([]);
    });
  });
});
