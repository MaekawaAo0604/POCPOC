import { sanitizeHtml } from '../htmlSanitizer';

describe('HtmlSanitizer', () => {
  describe('外部スクリプト検出・除去', () => {
    it('should detect and remove external script tags', () => {
      const html = `
        <html>
          <script src="https://malicious.com/script.js"></script>
          <body>Hello</body>
        </html>
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'external_script')).toBe(true);
      expect(result.html).not.toContain('src="https://malicious.com');
    });

    it('should allow inline scripts without src', () => {
      const html = `
        <html>
          <script>console.log('safe');</script>
          <body>Hello</body>
        </html>
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.filter((v) => v.type === 'external_script').length).toBe(0);
      expect(result.html).toContain("console.log('safe')");
    });
  });

  describe('fetch/XHR/WebSocket検出', () => {
    it('should detect fetch calls', () => {
      const html = `
        <script>
          fetch('https://api.example.com/data')
            .then(res => res.json());
        </script>
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'network_call')).toBe(true);
      expect(result.violations.some((v) => v.description.includes('fetch'))).toBe(true);
    });

    it('should detect XMLHttpRequest', () => {
      const html = `
        <script>
          const xhr = new XMLHttpRequest();
          xhr.open('GET', 'https://api.example.com');
        </script>
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'network_call')).toBe(true);
    });

    it('should detect WebSocket', () => {
      const html = `
        <script>
          const ws = new WebSocket('wss://socket.example.com');
        </script>
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'network_call')).toBe(true);
    });

    it('should detect navigator.sendBeacon', () => {
      const html = `
        <script>
          navigator.sendBeacon('/log', data);
        </script>
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'network_call')).toBe(true);
    });
  });

  describe('外部リソース参照検出', () => {
    it('should detect external image sources', () => {
      const html = `
        <img src="https://external.com/image.png" />
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'external_resource')).toBe(true);
    });

    it('should detect external stylesheet links', () => {
      const html = `
        <link rel="stylesheet" href="https://cdn.example.com/style.css" />
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.some((v) => v.type === 'external_resource')).toBe(true);
    });

    it('should allow relative paths', () => {
      const html = `
        <img src="/images/local.png" />
        <link rel="stylesheet" href="./style.css" />
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.filter((v) => v.type === 'external_resource').length).toBe(0);
    });

    it('should allow data URIs', () => {
      const html = `
        <img src="data:image/png;base64,iVBORw0KGgo..." />
      `;
      const result = sanitizeHtml(html);
      expect(result.violations.filter((v) => v.type === 'external_resource').length).toBe(0);
    });
  });

  describe('安全なHTML通過', () => {
    it('should pass safe HTML unchanged', () => {
      const html = `
        <div>
          <h1>タイトル</h1>
          <p>本文テキスト</p>
          <button onclick="handleClick()">クリック</button>
        </div>
      `;
      const result = sanitizeHtml(html);
      expect(result.isSafe).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should pass HTML with inline styles', () => {
      const html = `
        <div style="color: red; background: blue;">
          <span style="font-weight: bold;">テキスト</span>
        </div>
      `;
      const result = sanitizeHtml(html);
      expect(result.isSafe).toBe(true);
    });

    it('should pass HTML with internal script', () => {
      const html = `
        <script>
          function handleClick() {
            alert('Clicked!');
          }
        </script>
        <button onclick="handleClick()">Click me</button>
      `;
      const result = sanitizeHtml(html);
      expect(result.isSafe).toBe(true);
    });
  });

  describe('isSafeフラグ', () => {
    it('should be false when external scripts detected', () => {
      const html = `<script src="https://evil.com/hack.js"></script>`;
      const result = sanitizeHtml(html);
      expect(result.isSafe).toBe(false);
    });

    it('should be false when network calls detected', () => {
      const html = `<script>fetch('/api')</script>`;
      const result = sanitizeHtml(html);
      expect(result.isSafe).toBe(false);
    });

    it('should be true when only external resources detected (warning level)', () => {
      const html = `<img src="https://example.com/image.png" />`;
      const result = sanitizeHtml(html);
      // 外部リソースは警告のみで、isSafeはtrue（sandbox iframeで安全）
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.isSafe).toBe(true);
    });
  });
});
