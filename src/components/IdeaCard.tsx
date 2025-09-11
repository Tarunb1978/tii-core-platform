'use client';

import { Heart, Bookmark, MessageSquare, ArrowUp, Send, ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/authProvider';
import toast from 'react-hot-toast';

type Idea = {
  id: string;
  data: {
    company_name: string;
    symbol: string;
    main_idea: string;
    long_or_short?: string;
    submitter_name?: string;
    submitted_date?: string;
    number_of_likes?: number;
    stock_price_today?: number;
    stock_price_at_submission?: number;
    fifty_two_wk_high?: number;
    fifty_two_wk_low?: number;
    last_12_months_eps?: number;
    last_12_months_revenues_m?: number;
    long_term_debt_m?: number;
  };
  likes_count?: number;
  bookmarks_count?: number;
  discussions_count?: number;
  created_at?: string;
  status?: string;
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

const API_URL_ACTIONS =
  process.env.NEXT_PUBLIC_API_URL_ACTIONS || '';

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
  const d = idea.data || ({} as Idea['data']);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(idea.likes_count ?? d.number_of_likes ?? 0);
  const [bookmarksCount, setBookmarksCount] = useState(idea.bookmarks_count ?? 0);
  const [discussionsCount, setDiscussionsCount] = useState(idea.discussions_count ?? 0);
  const [isLoading, setIsLoading] = useState(false);

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

          // check if this idea is in user's likes/bookmarks
          if (data.likes?.includes(idea.id)) {
            setIsLiked(true);
          }
          if (data.bookmarks?.includes(idea.id)) {
            setIsBookmarked(true);
          }
        } else {
          console.error('Failed to fetch user actions:', await res.text());
        }
      } catch (err) {
        console.error('Error fetching user actions:', err);
      }
    };

    fetchUserActions();
  }, [idea.id, user?.currentUser?.access_token]);

  const handleCardClick = () => {
    if (showBackButton) return;
    if (disabledNavigate) {
      if (onBlockedNavigate) {
        onBlockedNavigate();
      }
      return;
    }
    router.push(`/ideas-forum/${idea.id}`);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabledNavigate) {
      if (onBlockedNavigate) {
        onBlockedNavigate();
      }
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

    // Debug: Log token info (remove in production)
    console.log('Using access token:', user.currentUser.access_token.substring(0, 20) + '...');

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
        
        // Update parent component
        if (onIdeaUpdate) {
          onIdeaUpdate({
            ...idea,
            likes_count: newLikedState ? likesCount + 1 : likesCount - 1,
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
        
        // Update parent component
        if (onIdeaUpdate) {
          onIdeaUpdate({
            ...idea,
            bookmarks_count: newBookmarkedState ? bookmarksCount + 1 : bookmarksCount - 1,
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
        body: JSON.stringify({
          content: commentText.trim(),
        }),
      });

      if (response.ok) {
        setCommentText('');
        setDiscussionsCount(prev => prev + 1);
        
        // Update parent component
        if (onIdeaUpdate) {
          onIdeaUpdate({
            ...idea,
            discussions_count: discussionsCount + 1,
          });
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

  // Truncate text for preview
  const getTruncatedText = (text: string, maxLength: number = 300) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  const shouldShowReadMore = d.main_idea && d.main_idea.length > 300;
  
  // Calculate market cap category based on stock price and other factors
  const getMarketCapCategory = () => {
    const price = d.stock_price_today || d.stock_price_at_submission || 0;
    if (price > 500) return 'Large Cap';
    if (price > 200) return 'Mid Cap';
    return 'Small Cap';
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMonths = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (diffInMonths < 1) return 'Recently';
    if (diffInMonths === 1) return '1 month ago';
    return `${diffInMonths} months ago`;
  };

  // Get author initials
  const getAuthorInitials = (name?: string) => {
    if (!name) return 'ME';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Extract timeline from main idea (look for patterns like "3-5 years", "2-3 years", etc.)
  const extractTimeline = (idea?: string) => {
    if (!idea) return 'Long Term'; // guard clause if undefined/null
    const timelineMatch = idea.match(/(\d+-\d+)\s*years?/i);
    return timelineMatch ? `${timelineMatch[1]} Years` : 'Long Term';
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${
        !showBackButton ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Header Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {getAuthorInitials(d.submitter_name)}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {d.submitter_name || 'Market Expert'}
              </div>
              <div className="text-sm text-gray-500">
                {formatDate(d.submitted_date)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              {getMarketCapCategory()}
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
            <span className="text-gray-900 font-medium">{d.symbol}</span>
          </div>
        )}

        {/* Title */}
        <div className="mb-3">
          <h1 
            className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleTitleClick}
          >
            {d.company_name} - Wealth Creation Opportunity ({extractTimeline(d.main_idea)})
          </h1>
        </div>

        {/* Main Idea */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {shouldShowReadMore && !isExpanded 
              ? getTruncatedText(d.main_idea) 
              : d.main_idea
            }
          </p>
          {shouldShowReadMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-2 transition-colors"
            >
              {isExpanded ? 'Read Less' : 'Read More'}
            </button>
          )}
        </div>

        {/* Stock Details */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{d.symbol}</span>
            <span className="text-lg font-semibold text-gray-900">
              ₹{d.stock_price_today || d.stock_price_at_submission || 'N/A'}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Timeline Horizon</div>
            <div className="font-medium text-gray-900">{extractTimeline(d.main_idea)}</div>
          </div>
        </div>

        {/* Engagement Metrics */}
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
          <button 
            className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Discussion Section */}
      {showComments && (
        <div className="p-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Discussion for {d.symbol}
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

          {/* Empty Discussion State */}
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No messages yet. Start the conversation!</p>
          </div>

          {/* Comment Input */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={`Discuss ${d.symbol}...`}
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