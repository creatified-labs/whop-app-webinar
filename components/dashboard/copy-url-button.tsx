'use client';

import { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyUrlButtonProps {
  slug: string;
}

export function CopyUrlButton({ slug }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/webinar/${slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-2 p-2 text-gray-11 transition-colors hover:bg-gray-a3 hover:text-gray-12"
      title={copied ? 'Copied!' : 'Copy URL'}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-11" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

export function WebinarUrl({ slug }: { slug: string }) {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <code className="flex-1 truncate rounded-1 bg-gray-a3 px-3 py-1.5 text-2 text-gray-12">
      {origin ? `${origin}/webinar/${slug}` : `/webinar/${slug}`}
    </code>
  );
}
