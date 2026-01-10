'use client';

import { useRef, useEffect } from 'react';
import { Card } from '@/components/ui';

interface PoCViewerProps {
  html: string;
  title?: string;
}

export function PoCViewer({ html, title }: PoCViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && html) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;

      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  return (
    <Card className="overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
      )}
      <div className="relative">
        <iframe
          ref={iframeRef}
          className="w-full min-h-[500px] border-0"
          title="PoC Preview"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </Card>
  );
}
