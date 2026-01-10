import { generatePocId, generateShareToken } from '../idGenerator';

describe('idGenerator', () => {
  describe('generatePocId', () => {
    it('should generate a string ID', () => {
      const id = generatePocId();
      expect(typeof id).toBe('string');
    });

    it('should generate IDs with reasonable length', () => {
      const id = generatePocId();
      // nanoid default is 21 characters, but we might customize
      expect(id.length).toBeGreaterThanOrEqual(10);
      expect(id.length).toBeLessThanOrEqual(30);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generatePocId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate URL-safe IDs', () => {
      const id = generatePocId();
      // URL-safe characters: alphanumeric, underscore, hyphen
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  describe('generateShareToken', () => {
    it('should generate a string token', () => {
      const token = generateShareToken();
      expect(typeof token).toBe('string');
    });

    it('should generate tokens with sufficient length for security', () => {
      const token = generateShareToken();
      // Share tokens should be longer for security
      expect(token.length).toBeGreaterThanOrEqual(20);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateShareToken());
      }
      expect(tokens.size).toBe(100);
    });

    it('should generate URL-safe tokens', () => {
      const token = generateShareToken();
      expect(token).toMatch(/^[a-zA-Z0-9_-]+$/);
    });

    it('should be different from pocId', () => {
      const pocId = generatePocId();
      const shareToken = generateShareToken();
      expect(pocId).not.toBe(shareToken);
    });
  });
});
