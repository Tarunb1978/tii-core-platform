import sanitize from 'sanitize-html';

/**
 * Sanitizes blog HTML content and automatically styles links
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string with styled links
 */
export function sanitizeBlogContent(html: string): string {
  return sanitize(html, {
    allowedTags: [
      'p', 'br', 'strong', 'em', 'u', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'a', 'img', 
      'blockquote', 'code', 'pre', 'div', 'span'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'class'],
      'img': ['src', 'alt', 'title', 'width', 'height']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      'a': (tagName, attribs) => {
        return {
          tagName: 'a',
          attribs: {
            ...attribs,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'text-blue-600 hover:text-blue-800 underline font-medium'
          }
        };
      }
    }
  });
}

