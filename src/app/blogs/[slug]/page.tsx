import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { transformImageUrlsInHTML } from '@/utils/blogImageUtils';
import BlogContentClient from './BlogContentClient';

// TypeScript interfaces for Blog data
interface BlogContent {
  html: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  blog_image: string;
  blog_content: BlogContent;
  tags: string[];
  created_at: string;
}

interface BlogResponse {
  blog: Blog;
}

interface BlogPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Fetch blog data from API
async function getBlog(slug: string): Promise<Blog> {
  const apiUrl = process.env.SUPABASE_EDGE_FUNCTION_URL;
  
  if (!apiUrl) {
    throw new Error('SUPABASE_EDGE_FUNCTION_URL environment variable is not set');
  }

  try {
    const response = await fetch(`${apiUrl}/blogs/${slug}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blog: ${response.status}`);
    }

    const data: BlogResponse = await response.json();
    return data.blog;
  } catch (error) {
    console.error('Error fetching blog:', error);
    throw error;
  }
}

// Format date to Indian locale
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BlogPage({ params }: BlogPageProps) {
  // Await params before using (Next.js 15 requirement)
  const { slug } = await params;
  let blog: Blog;

  try {
    blog = await getBlog(slug);
  } catch (error) {
    console.error('Error fetching blog:', error);
    notFound();
  }

  // Transform HTML content images (Snap 1, Snap 2, etc.) to use IMAGE_BASE
  const transformedHtml = transformImageUrlsInHTML(blog.blog_content.html);

  // Construct image source with environment variable
  const IMAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BASE;
  const imageSrc = blog.blog_image
    ? `${IMAGE_BASE}${blog.blog_image}`
    : "/placeholder-blog.jpg";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8 pt-24">
        {/* Back to Blogs Link */}
        <div className="mb-6">
          <Link 
            href="/blogs"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 text-sm font-medium"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Blogs
          </Link>
        </div>

        {/* Blog Header */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Blog Image */}
          <div className="relative w-full h-72 md:h-80 lg:h-96">
            <Image
              src={imageSrc}
              alt={blog.title}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
              priority
            />
          </div>

          {/* Blog Content */}
          <div className="p-6 md:p-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {blog.title}
            </h1>

            {/* Excerpt */}
            <p className="text-gray-600 italic text-xs mb-4 leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Published Date */}
            <div className="mb-6">
              <span className="text-sm text-gray-500">
                Published on {formatDate(blog.created_at)}
              </span>
            </div>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mb-8">
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Blog Content */}
            <BlogContentClient html={transformedHtml} />
          </div>
        </article>

        {/* Bottom Back to Blogs Link */}
        <div className="mt-8 text-center">
          <Link 
            href="/blogs"
            className="inline-flex items-center px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors duration-200"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
            Back to Blogs
          </Link>
        </div>
      </main>
    </div>
  );
}
