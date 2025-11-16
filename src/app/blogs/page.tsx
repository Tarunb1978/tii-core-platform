'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

interface BlogPreview {
  id: string;
  title: string;
  slug: string;
  blog_image: string;
  excerpt: string;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const user = useAuth();
  const supabase = createClient();

  // Fetch blogs (same pattern as IdeasForumPage)
  useEffect(() => {
    async function fetchBlogs() {
      setLoading(true);
      try {
        let token: string | null = null;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
        }

        const res = await fetch('/api/fetchBlogs', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const json = await res.json();

        if (!res.ok) {
          console.error('Failed to fetch blogs:', res.status, json);
          throw new Error(json.error || json.details || `Failed to fetch blogs: ${res.status}`);
        }

        const fetchedBlogs = Array.isArray(json.blogs) ? json.blogs : [];
        setBlogs(fetchedBlogs);

      } catch (err) {
        console.error('Error fetching blogs:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load blogs';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchBlogs();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Investment Insights
          </h1>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500 text-sm">
            Loading blogs...
          </div>
        ) : error ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-red-500 text-sm">
            {error}
          </div>
        ) : blogs.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-500 text-sm">
            No blogs available at the moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <Link 
                key={blog.id} 
                href={`/blogs/${blog.slug}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-200"
              >
                <div className="relative w-full aspect-[1000/500] bg-gray-100">
                  {(() => {
                    const IMAGE_BASE = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BASE;
                    const imageSrc = blog.blog_image
                      ? `${IMAGE_BASE}${blog.blog_image}`
                      : "/placeholder-blog.jpg"; // fall back if missing
                    
                    return (
                      <Image
                        src={imageSrc}
                        alt={blog.title}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    );
                  })()}
                </div>
                <div className="p-6">
                  <h2 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
                    {blog.title}
                  </h2>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {blog.excerpt}
                  </p>
                  <span className="text-blue-600 text-xs font-medium hover:underline">
                    Read More →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

