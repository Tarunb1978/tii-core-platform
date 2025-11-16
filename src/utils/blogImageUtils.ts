// src/utils/blogImageUtils.ts

/**
 * Transforms image URLs in blog_content HTML to full Supabase storage URLs
 * Converts: /storage/v1/object/public/blog-images/covers/Snap 1.webp
 * To: https://acsobefarzmetevcseal.supabase.co/storage/v1/object/public/blog-images/covers/Snap%201.webp
 * 
 * This ensures images in blog content (like Snap 1, Snap 2) display correctly
 * by constructing the full Supabase storage URL with proper URL encoding.
 */
export function transformImageUrlsInHTML(html: string): string {
  if (!html) return html;
  
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!SUPABASE_URL) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not set, returning original HTML');
    return html;
  }

  // Remove trailing slash from Supabase URL if present
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');

  // Replace storage paths in img tags
  // Matches: src="/storage/v1/object/public/..." or src='/storage/v1/object/public/...'
  const transformedHtml = html.replace(
    /src=(["'])(\/storage\/v1\/object\/public\/[^"']+)\1/gi,
    (match, quote, fullPath) => {
      // Skip if already a full URL (http/https)
      if (fullPath.startsWith('http://') || fullPath.startsWith('https://')) {
        return match;
      }
      
      // Construct full URL: baseUrl + fullPath
      const fullUrl = `${baseUrl}${fullPath}`;
      
      // Encode the URL properly - encodeURI handles spaces and special characters
      // "Snap 1.webp" becomes "Snap%201.webp" (space -> %20, then 1)
      const encodedUrl = encodeURI(fullUrl);
      
      // Debug logging (remove in production if needed)
      console.log('Transforming image URL - Original:', fullPath);
      console.log('Transforming image URL - Full URL:', fullUrl);
      console.log('Transforming image URL - Encoded:', encodedUrl);
      
      return `src="${encodedUrl}"`;
    }
  );
  
  return transformedHtml;
}

