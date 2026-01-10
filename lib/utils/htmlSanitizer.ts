/**
 * 違反タイプ
 */
export type ViolationType =
  | 'external_script'
  | 'network_call'
  | 'external_resource';

/**
 * 検出された違反
 */
export interface Violation {
  type: ViolationType;
  description: string;
  location?: string;
}

/**
 * サニタイズ結果
 */
export interface SanitizeResult {
  /** サニタイズ後のHTML */
  html: string;
  /** 検出された違反リスト */
  violations: Violation[];
  /** 安全かどうか (external_script/network_callがない場合true) */
  isSafe: boolean;
}

/**
 * HTML検証・サニタイズ - 外部通信コードを検出・除去
 */
export function sanitizeHtml(html: string): SanitizeResult {
  const violations: Violation[] = [];
  let sanitized = html;

  // 1. 外部スクリプト検出・除去
  // <script src="...">...</script> パターン
  const scriptSrcPattern =
    /<script[^>]*\ssrc\s*=\s*["'][^"']*["'][^>]*>[\s\S]*?<\/script>/gi;
  const scriptMatches = html.match(scriptSrcPattern);
  if (scriptMatches && scriptMatches.length > 0) {
    scriptMatches.forEach((match) => {
      violations.push({
        type: 'external_script',
        description: '外部スクリプト参照を検出・除去しました',
        location: match.substring(0, 100),
      });
    });
    sanitized = sanitized.replace(
      scriptSrcPattern,
      '<!-- removed: external script -->'
    );
  }

  // 2. fetch/XHR/WebSocket検出
  const networkPatterns = [
    { pattern: /fetch\s*\(/gi, name: 'fetch' },
    { pattern: /XMLHttpRequest/gi, name: 'XMLHttpRequest' },
    { pattern: /new\s+WebSocket/gi, name: 'WebSocket' },
    { pattern: /navigator\.sendBeacon/gi, name: 'sendBeacon' },
  ];

  networkPatterns.forEach(({ pattern, name }) => {
    if (pattern.test(html)) {
      violations.push({
        type: 'network_call',
        description: `${name}による外部通信コードを検出しました`,
      });
    }
  });

  // 3. 外部リソース参照検出 (http/https URL)
  // src="https://..." or href="https://..." パターン
  const externalResourcePattern =
    /(src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi;
  let match;
  // パターンをリセットしてから使用
  externalResourcePattern.lastIndex = 0;
  while ((match = externalResourcePattern.exec(html)) !== null) {
    violations.push({
      type: 'external_resource',
      description: `外部リソース参照を検出しました: ${match[2]}`,
    });
  }

  // isSafeの判定: external_script, network_call がなければtrue
  // external_resourceはsandbox iframeで安全なので警告のみ
  const criticalViolations = violations.filter(
    (v) => v.type === 'external_script' || v.type === 'network_call'
  );
  const isSafe = criticalViolations.length === 0;

  return {
    html: sanitized,
    violations,
    isSafe,
  };
}
