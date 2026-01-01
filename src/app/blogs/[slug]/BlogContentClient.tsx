'use client';

import { sanitizeBlogContent } from '@/lib/sanitize';

interface BlogContentClientProps {
  html: string;
}

export default function BlogContentClient({ html }: BlogContentClientProps) {
  const sanitizedHtml = sanitizeBlogContent(html);

  return (
    <div 
      className="prose prose-sm max-w-none prose-a:text-blue-600 prose-a:hover:text-blue-800 prose-a:underline prose-a:font-medium prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-blockquote:text-gray-600 prose-blockquote:border-blue-200 prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-100 prose-pre:text-gray-800"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}

