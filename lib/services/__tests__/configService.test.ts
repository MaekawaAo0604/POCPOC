import {
  getPainConfig,
  getPainsByCategory,
  getAutoConfig,
} from '../configService';

describe('ConfigService', () => {
  describe('getPainConfig', () => {
    it('should return all pain categories', () => {
      const config = getPainConfig();
      expect(config.categories).toBeDefined();
      expect(config.categories.length).toBeGreaterThanOrEqual(6);
      expect(config.categories.length).toBeLessThanOrEqual(8);
    });

    it('should have valid structure for each category', () => {
      const config = getPainConfig();
      config.categories.forEach((category) => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.description).toBeDefined();
        expect(category.pains).toBeDefined();
        expect(category.pains.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should have valid autoConfig for each pain', () => {
      const config = getPainConfig();
      config.categories.forEach((category) => {
        category.pains.forEach((pain) => {
          expect(pain.autoConfig).toBeDefined();
          expect(pain.autoConfig.hypothesisFeatures.length).toBeGreaterThanOrEqual(2);
          expect(pain.autoConfig.hypothesisFeatures.length).toBeLessThanOrEqual(5);
          expect(pain.autoConfig.recommendedOutputs.length).toBeGreaterThan(0);
          expect(pain.autoConfig.kpiTarget).toBeDefined();
          expect(pain.autoConfig.rationale).toBeDefined();
        });
      });
    });
  });

  describe('getPainsByCategory', () => {
    it('should return pains for a valid category', () => {
      const pains = getPainsByCategory('customer_support');
      expect(pains).toBeDefined();
      expect(pains.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid category', () => {
      const pains = getPainsByCategory('invalid_category');
      expect(pains).toEqual([]);
    });

    it('should return pains with correct structure', () => {
      const pains = getPainsByCategory('sales');
      pains.forEach((pain) => {
        expect(pain.id).toBeDefined();
        expect(pain.name).toBeDefined();
        expect(pain.autoConfig).toBeDefined();
      });
    });
  });

  describe('getAutoConfig', () => {
    it('should return combined autoConfig for single pain', () => {
      const config = getAutoConfig(['cs_response_time']);
      expect(config).not.toBeNull();
      expect(config!.hypothesisFeatures.length).toBeGreaterThan(0);
      expect(config!.recommendedOutputs.length).toBeGreaterThan(0);
      expect(config!.kpiTarget).toBeDefined();
      expect(config!.rationale).toBeDefined();
    });

    it('should combine autoConfigs for multiple pains', () => {
      const config = getAutoConfig(['cs_response_time', 'cs_quality_variance']);
      expect(config).not.toBeNull();
      // Should have unique hypothesis features from both pains
      expect(config!.hypothesisFeatures.length).toBeGreaterThan(0);
      // Should have unique output types from both pains
      expect(config!.recommendedOutputs.length).toBeGreaterThan(0);
    });

    it('should return null for empty pain list', () => {
      const config = getAutoConfig([]);
      expect(config).toBeNull();
    });

    it('should return null for invalid pain ids', () => {
      const config = getAutoConfig(['invalid_pain_id']);
      expect(config).toBeNull();
    });

    it('should combine rationales when multiple pains selected', () => {
      const config = getAutoConfig(['cs_response_time', 'cs_quality_variance']);
      expect(config).toBeDefined();
      expect(config?.rationale).toContain('対応時間');
    });
  });
});
