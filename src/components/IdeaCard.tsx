'use client';

import { Heart, Bookmark, MessageSquare, ArrowUp, Send, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/authProvider';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';
import { Building2 } from 'lucide-react'

// New data types based on updated schema
type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  user_name?: string;
};

type StockDetails = {
  eps?: number;
  market?: string;
  currency?: string;
  pe_ratio?: number;
  annual_revenue?: number;
};

type Idea = {
  id: string;
  user_id?: string;
  data: {
    title: string;
    ticker: string;
    market_cap: string; // 'Large' | 'Mid' | 'Small' (string per API)
    week52_low?: number;
    week52_high?: number;
    word_count?: number;
    description: string; // HTML
    company_name: string;
    target_price?: number;
    current_price?: number;
    position_type?: string; // Long/Short
    investment_horizon?: string; // e.g., '6 Months'
    submission_timestamp?: string; // ISO
  };
  stock_details?: StockDetails | null;
  status?: string;
  created_at?: string;
  likes_count?: number;
  bookmarks_count?: number;
  discussions_count?: number;
  idea_discussion?: Comment[];
};

interface IdeaCardProps {
  idea: Idea;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showBreadcrumb?: boolean;
  disabledNavigate?: boolean;
  onBlockedNavigate?: () => void;
  onIdeaUpdate?: (updatedIdea: Idea) => void;
}

const API_URL_ACTIONS = process.env.NEXT_PUBLIC_API_URL_ACTIONS || '';
const API_URL_COMMENTS = process.env.NEXT_PUBLIC_API_URL || '';

export default function IdeaCard({
  idea,
  showBackButton = false,
  showBreadcrumb = false,
  disabledNavigate = false,
  onBlockedNavigate,
  onIdeaUpdate
}: IdeaCardProps) {
  const router = useRouter();
  const user = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const d = idea.data || ({} as Idea['data']);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(idea.likes_count ?? 0);
  const [bookmarksCount, setBookmarksCount] = useState(idea.bookmarks_count ?? 0);
  const [discussionsCount, setDiscussionsCount] = useState(idea.discussions_count ?? 0);
  const [isLoading, setIsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [authorName, setAuthorName] = useState<string | null>(null);
  const [commentUserNames, setCommentUserNames] = useState<Record<string, string>>({});

  // Helpers
  const getInitials = (name?: string | null) => {
    const n = (name || '').trim();
    if (!n) return 'ME';
    return n.split(' ').filter(Boolean).map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };

  function formatISTDateTime(utcDate: string | undefined) {
      if (!utcDate) return "";
  
      // Ensure UTC by appending Z if not present
      const normalizedDate = utcDate.endsWith("Z") ? utcDate : utcDate + "Z";

      return new Date(normalizedDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
    });
  }


  // Fetch submitter profile name
  useEffect(() => {
  const fetchAuthor = async () => {
    if (!idea.user_id) return;

    try {
      const { data, error } = await supabase
        .from("app_user") // ✅ use app_user instead of profiles
        .select("id, name, email") // check exact column names in app_user
        .eq("id", idea.user_id)
        .single();

      if (error) {
        console.error("Error fetching author profile:", error);
        setAuthorName(null);
      } else {
        setAuthorName(data?.name || data?.email || "Market Expert");
      }
    } catch (err) {
      console.error("Author fetch error:", err);
      setAuthorName(null);
    }
  };

  fetchAuthor();
}, [idea.user_id, supabase]);



  // Fetch like/bookmark state for current user
  useEffect(() => {
    const fetchUserActions = async () => {
      if (!user || !user.currentUser?.access_token) return;
      try {
        const res = await fetch(`${API_URL_ACTIONS}/self`, {
          headers: {
            Authorization: `Bearer ${user.currentUser.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.likes?.includes(idea.id)) setIsLiked(true);
          if (data.bookmarks?.includes(idea.id)) setIsBookmarked(true);
        } else {
          console.error('Failed to fetch user actions:', await res.text());
        }
      } catch (err) {
        console.error('Error fetching user actions:', err);
      }
    };
    fetchUserActions();
  }, [idea.id, user?.currentUser?.access_token, user]);

  // Fetch comments and commenters' names when expanded
  useEffect(() => {
  const fetchComments = async () => {
    if (!showComments) return;
    setIsLoadingComments(true);

    try {
      const res = await fetch(`${API_URL_COMMENTS}/${idea.id}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const fetchedComments: Comment[] = data?.idea?.idea_discussion || [];
      setComments(fetchedComments);

      // Collect unique IDs
      const uniqueUserIds = [...new Set(fetchedComments.map(c => c.user_id).filter(Boolean))];

      if (uniqueUserIds.length) {
        const { data: users, error } = await supabase
          .from("app_user") // ✅ use app_user
          .select("id, name, email")
          .in("id", uniqueUserIds);

        if (!error && users) {
          const map: Record<string, string> = {};
          users.forEach(user => {
            map[user.id] = user.name || user.email || "User";
          });
          setCommentUserNames(map);
        }
      }

    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  fetchComments();
}, [showComments, idea.id, supabase]);


  const handleCardClick = () => {
    if (showBackButton) return;
    if (disabledNavigate) {
      if (onBlockedNavigate) onBlockedNavigate();
      return;
    }
    router.push(`/ideas-forum/${idea.id}`);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabledNavigate) {
      if (onBlockedNavigate) onBlockedNavigate();
      return;
    }
    router.push(`/ideas-forum/${idea.id}`);
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments(!showComments);
  };

  const handleLike = async () => {
    if (!user || !user.currentUser?.access_token) {
      toast.error('Please log in to interact with ideas.');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL_ACTIONS}/${idea.id}/like`, {
        method,
        headers: {
          'Authorization': `Bearer ${user.currentUser.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const newLikedState = !isLiked;
        setIsLiked(newLikedState);
        setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
        if (onIdeaUpdate) {
          onIdeaUpdate({
            ...idea,
            likes_count: newLikedState ? (likesCount + 1) : (likesCount - 1),
          });
        }
        toast.success(newLikedState ? 'Idea liked!' : 'Idea unliked!');
      } else {
        toast.error('Failed to update like status');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || !user.currentUser?.access_token) {
      toast.error('Please log in to interact with ideas.');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL_ACTIONS}/${idea.id}/bookmark`, {
        method,
        headers: {
          'Authorization': `Bearer ${user.currentUser.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const newBookmarkedState = !isBookmarked;
        setIsBookmarked(newBookmarkedState);
        setBookmarksCount(prev => newBookmarkedState ? prev + 1 : prev - 1);
        if (onIdeaUpdate) {
          onIdeaUpdate({
            ...idea,
            bookmarks_count: newBookmarkedState ? (bookmarksCount + 1) : (bookmarksCount - 1),
          });
        }
        toast.success(newBookmarkedState ? 'Idea bookmarked!' : 'Bookmark removed!');
      } else {
        toast.error('Failed to update bookmark status');
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update bookmark status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComment = async () => {
    if (!user || !user.currentUser?.access_token) {
      toast.error('Please log in to interact with ideas.');
      return;
    }
    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL_ACTIONS}/${idea.id}/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.currentUser.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (response.ok) {
        setCommentText('');
        setDiscussionsCount(prev => prev + 1);
        if (onIdeaUpdate) {
          onIdeaUpdate({
            ...idea,
            discussions_count: (discussionsCount + 1),
          });
        }
        if (showComments) {
          const res = await fetch(`${API_URL_COMMENTS}/${idea.id}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const fetchedComments = data?.idea?.idea_discussion || [];
            setComments(fetchedComments);
          }
        }
        toast.success('Comment added successfully!');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${
        !showBackButton ? 'cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {getInitials(authorName)}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {authorName || 'Market Expert'}
              </div>
              <div className="text-sm text-gray-500">
                {formatISTDateTime(d.submission_timestamp || idea.created_at)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {d.position_type || 'Position Type'}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {d.market_cap || 'Market'} Cap
            </span>
            <button 
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked 
                  ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                  : 'hover:bg-gray-100 text-gray-400'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              disabled={isLoading}
            >
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation */}
        {showBreadcrumb && (
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="flex items-center gap-1 hover:text-gray-700 transition-colors">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/ideas-forum" className="hover:text-gray-700 transition-colors">
              Ideas Forum
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{d.ticker}</span>
          </div>
        )}

        {/* Title */}
        <div className="mb-3">
          <h1 
            className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleTitleClick}
          >
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{d.company_name}</span>
            </div>
          </h1>
        </div>

        {/* Description (HTML) - Always show full content */}
        <div className="mb-4">
          <div
            className="prose max-w-none prose-img:rounded-lg prose-img:border prose-img:border-gray-100"
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: d.description || '' }}
          />
        </div>

        {/* Stock Details */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{d.ticker}</span>
            <span className="text-lg font-semibold text-gray-900">
              ₹{d.current_price ?? 'N/A'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Timeline Horizon</div>
            <div className="font-medium text-gray-900">{d.investment_horizon || 'Long Term'}</div>
          </div>
        </div>

        {/* Engagement Metrics */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              className={`flex items-center gap-2 transition-colors ${
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-600 hover:text-red-500'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              disabled={isLoading}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <button 
              className={`flex items-center gap-2 transition-colors ${
                showComments 
                  ? 'text-blue-600 hover:text-blue-700' 
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={handleCommentClick}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{discussionsCount}</span>
            </button>
            
          </div>
          
          {/* Show More Details Link - Hidden on details page */}
          {!disabledNavigate && !showBackButton && (
            <div className="text-right">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline hover:no-underline transition-all duration-200 flex items-center gap-1 ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
              >
                <span>Show More Details</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Discussion Section */}
      {showComments && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Discussion for {d.ticker}
            </h3>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {discussionsCount} messages
            </span>
          </div>

          {/* Discussion Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['Earnings Analysis', 'Technical Charts', 'Sector Comparison', 'Risk Assessment', 'Price Targets'].map((tag) => (
              <button
                key={tag}
                className="px-3 py-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm rounded-full transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Comments Display */}
          {isLoadingComments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((comment) => {
                const displayName = commentUserNames[comment.user_id] || 'User';
                return (
                  <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-xs">
                        {getInitials(displayName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {displayName}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatISTDateTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Input */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={`Discuss ${d.ticker}...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleComment();
                }
              }}
            />
            <button 
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={(e) => {
                e.stopPropagation();
                handleComment();
              }}
              disabled={isLoading || !commentText.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}