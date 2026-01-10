import type {
  PainConfig,
  PainDetail,
  AutoConfig,
  OutputType,
} from '@/types/pain';
import painsData from '@/config/pains.json';

/**
 * ペインマスタ全体を取得
 */
export function getPainConfig(): PainConfig {
  return painsData as PainConfig;
}

/**
 * カテゴリIDから具体ペイン一覧を取得
 */
export function getPainsByCategory(categoryId: string): PainDetail[] {
  const config = getPainConfig();
  const category = config.categories.find((c) => c.id === categoryId);
  return category?.pains ?? [];
}

/**
 * ペインIDから単一のPainDetailを取得
 */
function findPainById(painId: string): PainDetail | undefined {
  const config = getPainConfig();
  for (const category of config.categories) {
    const pain = category.pains.find((p) => p.id === painId);
    if (pain) return pain;
  }
  return undefined;
}

/**
 * 複数のペインIDから自動設定を合成
 * - hypothesisFeatures: 重複排除して結合
 * - recommendedOutputs: 重複排除して結合
 * - kpiTarget: 最初のペインのものを使用
 * - rationale: 結合して表示
 */
export function getAutoConfig(painIds: string[]): AutoConfig | null {
  if (painIds.length === 0) return null;

  const pains = painIds
    .map((id) => findPainById(id))
    .filter((p): p is PainDetail => p !== undefined);

  if (pains.length === 0) return null;

  // 仮説を重複排除して結合
  const hypothesisSet = new Set<string>();
  pains.forEach((pain) => {
    pain.autoConfig.hypothesisFeatures.forEach((h) => hypothesisSet.add(h));
  });

  // 出力タイプを重複排除して結合
  const outputSet = new Set<OutputType>();
  pains.forEach((pain) => {
    pain.autoConfig.recommendedOutputs.forEach((o) => outputSet.add(o));
  });

  // 根拠を結合（ペインごとに改行で区切る）
  const rationales = pains.map((pain) => {
    return `【${pain.name}】${pain.autoConfig.rationale}`;
  });

  // KPIは最初のペインのものを使用（複数ペインの場合は主要なものを優先）
  const primaryKpi = pains[0].autoConfig.kpiTarget;

  return {
    hypothesisFeatures: Array.from(hypothesisSet),
    recommendedOutputs: Array.from(outputSet),
    kpiTarget: primaryKpi,
    rationale: rationales.join('\n'),
  };
}
