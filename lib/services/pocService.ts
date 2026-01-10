/**
 * PoCService - PoC生成・取得・共有機能
 *
 * Claude APIでHTML生成し、Vercel KVに保存
 */
import { kv, KEYS, DEFAULT_TTL_SECONDS } from '@/lib/kv';
import { claudeApi } from '@/lib/claude';
import { generatePocId, generateShareToken } from '@/lib/utils/idGenerator';
import { sanitizeHtml } from '@/lib/utils/htmlSanitizer';
import type { PoCSpec, PoCData, PoCResult, PoCRun } from '@/types';

export interface PoCService {
  generatePoC(spec: PoCSpec): Promise<PoCResult>;
  getPoC(pocId: string): Promise<PoCData | null>;
  createShareToken(pocId: string): Promise<string>;
  getPoCByShareToken(shareToken: string): Promise<PoCData | null>;
}

class PoCServiceImpl implements PoCService {
  /**
   * PoC生成 - Claude APIでHTML生成し、Vercel KVに保存
   * @param spec ペイン選択・自動設定・調整を含む仕様
   * @returns 生成されたPoC情報（ID、HTML、メタデータ）
   */
  async generatePoC(spec: PoCSpec): Promise<PoCResult> {
    const pocId = generatePocId();

    // Claude APIでHTML生成
    const rawHtml = await claudeApi.generateHtml(spec);

    // セキュリティチェック・サニタイズ
    const sanitized = sanitizeHtml(rawHtml);

    const pocData: PoCRun = {
      pocId,
      ...spec,
      generatedHtml: sanitized.html,
      createdAt: new Date().toISOString(),
    };

    // TTL付きで保存（デフォルト24時間）
    await kv.set(KEYS.poc(pocId), pocData, { ex: DEFAULT_TTL_SECONDS });

    return {
      pocId,
      html: sanitized.html,
      meta: pocData,
    };
  }

  /**
   * PoC取得 - IDからPoCデータを取得
   * TTL切れの場合はRedisが自動削除するためnullが返る
   */
  async getPoC(pocId: string): Promise<PoCData | null> {
    return await kv.get<PoCData>(KEYS.poc(pocId));
  }

  /**
   * 共有トークン生成 - 既存PoCに共有URLを発行
   */
  async createShareToken(pocId: string): Promise<string> {
    const poc = await this.getPoC(pocId);
    if (!poc) {
      throw new Error('PoC not found');
    }

    const shareToken = generateShareToken();

    // 共有トークン → pocId のマッピング（同じTTL）
    await kv.set(KEYS.share(shareToken), pocId, { ex: DEFAULT_TTL_SECONDS });

    // PoCデータにトークンを追加
    const updatedPoc: PoCData = {
      ...poc,
      shareToken,
    };
    await kv.set(KEYS.poc(pocId), updatedPoc, { ex: DEFAULT_TTL_SECONDS });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/poc/${pocId}?share=${shareToken}`;
  }

  /**
   * 共有トークンからPoC取得
   */
  async getPoCByShareToken(shareToken: string): Promise<PoCData | null> {
    // 共有トークンからpocIdを取得
    const pocId = await kv.get<string>(KEYS.share(shareToken));
    if (!pocId) {
      return null;
    }

    // pocIdからPoCデータを取得
    return await this.getPoC(pocId);
  }
}

// シングルトンインスタンス
let pocServiceInstance: PoCService | null = null;

export function createPoCService(): PoCService {
  return new PoCServiceImpl();
}

export function getPoCService(): PoCService {
  if (!pocServiceInstance) {
    pocServiceInstance = createPoCService();
  }
  return pocServiceInstance;
}
