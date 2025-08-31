'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { MessageCircle, Eye, Clock, Heart, ChevronRight } from 'lucide-react';

// Types
interface Comment {
  id: string;
  author: string;
  role: string;
  avatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface Topic {
  id: string;
  title: string;
  category: string;
  isHot: boolean;
  author: string;
  role: string;
  summary: string;
  stats: {
    comments: number;
    views: number;
    lastUpdated: string;
  };
  recentComments: Comment[];
  allComments: Comment[];
}

// Mock data
const mockTopics: Topic[] = [
  {
    id: '1',
    title: 'Global Trade Wars: Impact on Indian Markets',
    category: 'Global Trade',
    isHot: true,
    author: 'Rajesh Mehta',
    role: 'Trade Expert',
    summary: 'Analyzing the ripple effects of ongoing global trade tensions on Indian stock markets and export-oriented sectors.',
    stats: {
      comments: 12,
      views: 1200,
      lastUpdated: '2 hours ago'
    },
    recentComments: [
      {
        id: 'c1',
        author: 'Priya Sharma',
        role: 'Portfolio Manager',
        avatar: 'PS',
        text: 'Great analysis! The tech sector seems most vulnerable to these trade tensions.',
        timestamp: '2 hours ago',
        likes: 12
      },
      {
        id: 'c2',
        author: 'Amit Patel',
        role: 'Retail Investor',
        avatar: 'AP',
        text: 'What about the pharmaceutical sector? They might benefit from trade diversions.',
        timestamp: '1 hour ago',
        likes: 8
      }
    ],
    allComments: [
      {
        id: 'c1',
        author: 'Priya Sharma',
        role: 'Portfolio Manager',
        avatar: 'PS',
        text: 'Great analysis! The tech sector seems most vulnerable to these trade tensions.',
        timestamp: '2 hours ago',
        likes: 12
      },
      {
        id: 'c2',
        author: 'Amit Patel',
        role: 'Retail Investor',
        avatar: 'AP',
        text: 'What about the pharmaceutical sector? They might benefit from trade diversions.',
        timestamp: '1 hour ago',
        likes: 8
      },
      {
        id: 'c3',
        author: 'Dr. Meena Iyer',
        role: 'Economist',
        avatar: 'MI',
        text: 'The currency fluctuations will also play a crucial role in this scenario.',
        timestamp: '3 hours ago',
        likes: 15
      },
      {
        id: 'c4',
        author: 'Rahul Verma',
        role: 'Export Manager',
        avatar: 'RV',
        text: 'We\'re already seeing delays in our shipments to Europe. This is concerning.',
        timestamp: '4 hours ago',
        likes: 9
      },
      {
        id: 'c5',
        author: 'Sneha Reddy',
        role: 'Trade Analyst',
        avatar: 'SR',
        text: 'The automotive sector imports will be heavily impacted. Good for domestic manufacturers.',
        timestamp: '5 hours ago',
        likes: 11
      },
      {
        id: 'c6',
        author: 'Kartik Sharma',
        role: 'Investment Advisor',
        avatar: 'KS',
        text: 'Time to diversify portfolios away from export-heavy stocks.',
        timestamp: '6 hours ago',
        likes: 7
      },
      {
        id: 'c7',
        author: 'Anjali Desai',
        role: 'Retail Investor',
        avatar: 'AD',
        text: 'What about the impact on gold prices? Safe haven demand might increase.',
        timestamp: '7 hours ago',
        likes: 13
      },
      {
        id: 'c8',
        author: 'Vikram Malhotra',
        role: 'Commodity Trader',
        avatar: 'VM',
        text: 'Gold and silver will definitely see upward pressure. Good time to accumulate.',
        timestamp: '8 hours ago',
        likes: 18
      },
      {
        id: 'c9',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'The RBI might need to intervene to stabilize the rupee.',
        timestamp: '9 hours ago',
        likes: 6
      },
      {
        id: 'c10',
        author: 'Meera Joshi',
        role: 'Financial Planner',
        avatar: 'MJ',
        text: 'This could be a good opportunity for long-term investors to buy quality stocks.',
        timestamp: '10 hours ago',
        likes: 14
      },
      {
        id: 'c11',
        author: 'Arjun Kapoor',
        role: 'Day Trader',
        avatar: 'AK',
        text: 'Volatility will be high. Perfect for swing trading opportunities.',
        timestamp: '11 hours ago',
        likes: 5
      },
      {
        id: 'c12',
        author: 'Neha Singh',
        role: 'Research Analyst',
        avatar: 'NS',
        text: 'The IT sector might actually benefit from a weaker rupee.',
        timestamp: '12 hours ago',
        likes: 16
      }
    ]
  },
  {
    id: '2',
    title: 'Market Volatility: Strategies for Uncertain Times',
    category: 'Market Volatility',
    isHot: false,
    author: 'Dr. Kavita Singh',
    role: 'Market Analyst',
    summary: 'Exploring defensive investment strategies and portfolio rebalancing approaches during high market volatility periods.',
    stats: {
      comments: 12,
      views: 890,
      lastUpdated: '4 hours ago'
    },
    recentComments: [
      {
        id: 'c3',
        author: 'Rahul Verma',
        role: 'Financial Advisor',
        avatar: 'RV',
        text: 'Diversification is key. Consider adding defensive stocks and bonds.',
        timestamp: '3 hours ago',
        likes: 15
      },
      {
        id: 'c4',
        author: 'Sneha Reddy',
        role: 'Day Trader',
        avatar: 'SR',
        text: 'I\'ve been using options strategies to hedge my positions.',
        timestamp: '2 hours ago',
        likes: 6
      }
    ],
    allComments: [
      {
        id: 'c3',
        author: 'Rahul Verma',
        role: 'Financial Advisor',
        avatar: 'RV',
        text: 'Diversification is key. Consider adding defensive stocks and bonds.',
        timestamp: '3 hours ago',
        likes: 15
      },
      {
        id: 'c4',
        author: 'Sneha Reddy',
        role: 'Day Trader',
        avatar: 'SR',
        text: 'I\'ve been using options strategies to hedge my positions.',
        timestamp: '2 hours ago',
        likes: 6
      },
      {
        id: 'c5',
        author: 'Priya Sharma',
        role: 'Portfolio Manager',
        avatar: 'PS',
        text: 'I\'ve increased my allocation to consumer staples and utilities.',
        timestamp: '4 hours ago',
        likes: 12
      },
      {
        id: 'c6',
        author: 'Amit Patel',
        role: 'Retail Investor',
        avatar: 'AP',
        text: 'What about gold ETFs? They seem to perform well during volatility.',
        timestamp: '5 hours ago',
        likes: 8
      },
      {
        id: 'c7',
        author: 'Dr. Meena Iyer',
        role: 'Economist',
        avatar: 'MI',
        text: 'The correlation between asset classes changes during volatile periods.',
        timestamp: '6 hours ago',
        likes: 14
      },
      {
        id: 'c8',
        author: 'Kartik Sharma',
        role: 'Investment Advisor',
        avatar: 'KS',
        text: 'Consider systematic investment plans to average out volatility.',
        timestamp: '7 hours ago',
        likes: 9
      },
      {
        id: 'c9',
        author: 'Anjali Desai',
        role: 'Retail Investor',
        avatar: 'AD',
        text: 'I\'m holding more cash to take advantage of dips.',
        timestamp: '8 hours ago',
        likes: 11
      },
      {
        id: 'c10',
        author: 'Vikram Malhotra',
        role: 'Tech Analyst',
        avatar: 'VM',
        text: 'Tech stocks are getting hammered. Good entry points emerging.',
        timestamp: '9 hours ago',
        likes: 16
      },
      {
        id: 'c11',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'Banking sector looks stable. Good defensive play.',
        timestamp: '10 hours ago',
        likes: 7
      },
      {
        id: 'c12',
        author: 'Meera Joshi',
        role: 'Financial Planner',
        avatar: 'MJ',
        text: 'Don\'t panic sell. Stick to your long-term strategy.',
        timestamp: '11 hours ago',
        likes: 13
      },
      {
        id: 'c13',
        author: 'Arjun Kapoor',
        role: 'Day Trader',
        avatar: 'AK',
        text: 'Volatility creates opportunities for quick profits.',
        timestamp: '12 hours ago',
        likes: 5
      },
      {
        id: 'c14',
        author: 'Neha Singh',
        role: 'Research Analyst',
        avatar: 'NS',
        text: 'Healthcare and pharma stocks are showing resilience.',
        timestamp: '13 hours ago',
        likes: 10
      }
    ]
  },
  {
    id: '3',
    title: 'Tech Stock Valuations: Bubble or Opportunity?',
    category: 'Valuation',
    isHot: true,
    author: 'Vikram Malhotra',
    role: 'Tech Analyst',
    summary: 'Deep dive into current tech stock valuations and whether they represent sustainable growth or speculative bubbles.',
    stats: {
      comments: 12,
      views: 2100,
      lastUpdated: '1 hour ago'
    },
    recentComments: [
      {
        id: 'c5',
        author: 'Arjun Kapoor',
        role: 'Tech Investor',
        avatar: 'AK',
        text: 'AI and cloud computing justify these valuations. The growth is real.',
        timestamp: '1 hour ago',
        likes: 23
      },
      {
        id: 'c6',
        author: 'Meera Iyer',
        role: 'Value Investor',
        avatar: 'MI',
        text: 'I remain skeptical. These P/E ratios are historically unprecedented.',
        timestamp: '45 minutes ago',
        likes: 18
      }
    ],
    allComments: [
      {
        id: 'c5',
        author: 'Arjun Kapoor',
        role: 'Tech Investor',
        avatar: 'AK',
        text: 'AI and cloud computing justify these valuations. The growth is real.',
        timestamp: '1 hour ago',
        likes: 23
      },
      {
        id: 'c6',
        author: 'Meera Iyer',
        role: 'Value Investor',
        avatar: 'MI',
        text: 'I remain skeptical. These P/E ratios are historically unprecedented.',
        timestamp: '45 minutes ago',
        likes: 18
      },
      {
        id: 'c7',
        author: 'Priya Sharma',
        role: 'Portfolio Manager',
        avatar: 'PS',
        text: 'The AI revolution is real, but valuations need to be justified by earnings.',
        timestamp: '2 hours ago',
        likes: 19
      },
      {
        id: 'c8',
        author: 'Amit Patel',
        role: 'Retail Investor',
        avatar: 'AP',
        text: 'I\'m waiting for a correction before entering tech stocks.',
        timestamp: '3 hours ago',
        likes: 14
      },
      {
        id: 'c9',
        author: 'Dr. Meena Iyer',
        role: 'Economist',
        avatar: 'MI',
        text: 'Interest rates will be the key factor in tech valuations.',
        timestamp: '4 hours ago',
        likes: 21
      },
      {
        id: 'c10',
        author: 'Rahul Verma',
        role: 'Financial Advisor',
        avatar: 'RV',
        text: 'Consider a mix of growth and value tech stocks.',
        timestamp: '5 hours ago',
        likes: 12
      },
      {
        id: 'c11',
        author: 'Sneha Reddy',
        role: 'Day Trader',
        avatar: 'SR',
        text: 'Tech stocks are perfect for momentum trading.',
        timestamp: '6 hours ago',
        likes: 8
      },
      {
        id: 'c12',
        author: 'Kartik Sharma',
        role: 'Investment Advisor',
        avatar: 'KS',
        text: 'The semiconductor sector looks most promising.',
        timestamp: '7 hours ago',
        likes: 16
      },
      {
        id: 'c13',
        author: 'Anjali Desai',
        role: 'Retail Investor',
        avatar: 'AD',
        text: 'What about the cybersecurity subsector?',
        timestamp: '8 hours ago',
        likes: 11
      },
      {
        id: 'c14',
        author: 'Vikram Malhotra',
        role: 'Tech Analyst',
        avatar: 'VM',
        text: 'Cybersecurity is indeed a bright spot in tech.',
        timestamp: '9 hours ago',
        likes: 25
      },
      {
        id: 'c15',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'Fintech stocks are also worth considering.',
        timestamp: '10 hours ago',
        likes: 9
      },
      {
        id: 'c16',
        author: 'Meera Joshi',
        role: 'Financial Planner',
        avatar: 'MJ',
        text: 'Diversify across different tech subsectors.',
        timestamp: '11 hours ago',
        likes: 13
      }
    ]
  },
  {
    id: '4',
    title: 'HDFC Bank: Post-Merger Analysis',
    category: 'Individual Stocks',
    isHot: false,
    author: 'Sanjay Gupta',
    role: 'Banking Analyst',
    summary: 'Comprehensive analysis of HDFC Bank\'s performance post-merger and future growth prospects.',
    stats: {
      comments: 12,
      views: 750,
      lastUpdated: '6 hours ago'
    },
    recentComments: [
      {
        id: 'c7',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'The merger synergies are starting to show. Q3 results look promising.',
        timestamp: '5 hours ago',
        likes: 9
      },
      {
        id: 'c8',
        author: 'Anjali Desai',
        role: 'Retail Investor',
        avatar: 'AD',
        text: 'What about the regulatory concerns? RBI has been strict lately.',
        timestamp: '4 hours ago',
        likes: 7
      }
    ],
    allComments: [
      {
        id: 'c7',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'The merger synergies are starting to show. Q3 results look promising.',
        timestamp: '5 hours ago',
        likes: 9
      },
      {
        id: 'c8',
        author: 'Anjali Desai',
        role: 'Retail Investor',
        avatar: 'AD',
        text: 'What about the regulatory concerns? RBI has been strict lately.',
        timestamp: '4 hours ago',
        likes: 7
      },
      {
        id: 'c9',
        author: 'Priya Sharma',
        role: 'Portfolio Manager',
        avatar: 'PS',
        text: 'The stock looks attractive at current levels.',
        timestamp: '6 hours ago',
        likes: 12
      },
      {
        id: 'c10',
        author: 'Amit Patel',
        role: 'Retail Investor',
        avatar: 'AP',
        text: 'What\'s the target price for the next quarter?',
        timestamp: '7 hours ago',
        likes: 6
      },
      {
        id: 'c11',
        author: 'Dr. Meena Iyer',
        role: 'Economist',
        avatar: 'MI',
        text: 'The banking sector consolidation is good for the economy.',
        timestamp: '8 hours ago',
        likes: 15
      },
      {
        id: 'c12',
        author: 'Rahul Verma',
        role: 'Financial Advisor',
        avatar: 'RV',
        text: 'Consider adding this to your core portfolio.',
        timestamp: '9 hours ago',
        likes: 8
      },
      {
        id: 'c13',
        author: 'Sneha Reddy',
        role: 'Day Trader',
        avatar: 'SR',
        text: 'Good for swing trading between support levels.',
        timestamp: '10 hours ago',
        likes: 5
      },
      {
        id: 'c14',
        author: 'Kartik Sharma',
        role: 'Investment Advisor',
        avatar: 'KS',
        text: 'The NPA situation has improved significantly.',
        timestamp: '11 hours ago',
        likes: 11
      },
      {
        id: 'c15',
        author: 'Vikram Malhotra',
        role: 'Tech Analyst',
        avatar: 'VM',
        text: 'Digital banking initiatives are impressive.',
        timestamp: '12 hours ago',
        likes: 13
      },
      {
        id: 'c16',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'Mobile banking adoption is at all-time high.',
        timestamp: '13 hours ago',
        likes: 10
      },
      {
        id: 'c17',
        author: 'Meera Joshi',
        role: 'Financial Planner',
        avatar: 'MJ',
        text: 'This is a solid long-term investment.',
        timestamp: '14 hours ago',
        likes: 9
      },
      {
        id: 'c18',
        author: 'Arjun Kapoor',
        role: 'Day Trader',
        avatar: 'AK',
        text: 'Watch for breakout above resistance levels.',
        timestamp: '15 hours ago',
        likes: 7
      }
    ]
  },
  {
    id: '5',
    title: 'SEBI Regulations: Impact on Retail Investors',
    category: 'Policy & Regulation',
    isHot: false,
    author: 'Adv. Ramesh Kumar',
    role: 'Legal Expert',
    summary: 'Understanding the latest SEBI regulations and how they affect retail investor rights and market participation.',
    stats: {
      comments: 12,
      views: 520,
      lastUpdated: '8 hours ago'
    },
    recentComments: [
      {
        id: 'c9',
        author: 'Kartik Sharma',
        role: 'Compliance Officer',
        avatar: 'KS',
        text: 'The new disclosure requirements are much needed for transparency.',
        timestamp: '7 hours ago',
        likes: 11
      },
      {
        id: 'c10',
        author: 'Neha Joshi',
        role: 'Investment Advisor',
        avatar: 'NJ',
        text: 'These changes will definitely improve investor confidence.',
        timestamp: '6 hours ago',
        likes: 5
      }
    ],
    allComments: [
      {
        id: 'c9',
        author: 'Kartik Sharma',
        role: 'Compliance Officer',
        avatar: 'KS',
        text: 'The new disclosure requirements are much needed for transparency.',
        timestamp: '7 hours ago',
        likes: 11
      },
      {
        id: 'c10',
        author: 'Neha Joshi',
        role: 'Investment Advisor',
        avatar: 'NJ',
        text: 'These changes will definitely improve investor confidence.',
        timestamp: '6 hours ago',
        likes: 5
      },
      {
        id: 'c11',
        author: 'Priya Sharma',
        role: 'Portfolio Manager',
        avatar: 'PS',
        text: 'The insider trading regulations are much stricter now.',
        timestamp: '8 hours ago',
        likes: 13
      },
      {
        id: 'c12',
        author: 'Amit Patel',
        role: 'Retail Investor',
        avatar: 'AP',
        text: 'How will this affect small investors like me?',
        timestamp: '9 hours ago',
        likes: 8
      },
      {
        id: 'c13',
        author: 'Dr. Meena Iyer',
        role: 'Economist',
        avatar: 'MI',
        text: 'These regulations will improve market efficiency.',
        timestamp: '10 hours ago',
        likes: 16
      },
      {
        id: 'c14',
        author: 'Rahul Verma',
        role: 'Financial Advisor',
        avatar: 'RV',
        text: 'Good for long-term market stability.',
        timestamp: '11 hours ago',
        likes: 9
      },
      {
        id: 'c15',
        author: 'Sneha Reddy',
        role: 'Day Trader',
        avatar: 'SR',
        text: 'The compliance costs might increase for brokers.',
        timestamp: '12 hours ago',
        likes: 6
      },
      {
        id: 'c16',
        author: 'Kartik Sharma',
        role: 'Compliance Officer',
        avatar: 'KS',
        text: 'Yes, but the benefits outweigh the costs.',
        timestamp: '13 hours ago',
        likes: 12
      },
      {
        id: 'c17',
        author: 'Anjali Desai',
        role: 'Retail Investor',
        avatar: 'AD',
        text: 'Will this reduce market manipulation?',
        timestamp: '14 hours ago',
        likes: 7
      },
      {
        id: 'c18',
        author: 'Vikram Malhotra',
        role: 'Tech Analyst',
        avatar: 'VM',
        text: 'Technology will help enforce these regulations.',
        timestamp: '15 hours ago',
        likes: 14
      },
      {
        id: 'c19',
        author: 'Deepak Kumar',
        role: 'Banking Professional',
        avatar: 'DK',
        text: 'The banking sector welcomes these changes.',
        timestamp: '16 hours ago',
        likes: 10
      },
      {
        id: 'c20',
        author: 'Meera Joshi',
        role: 'Financial Planner',
        avatar: 'MJ',
        text: 'This creates a level playing field for all investors.',
        timestamp: '17 hours ago',
        likes: 11
      }
    ]
  }
];

const filterOptions = ['All', 'Global Trade', 'Market Volatility', 'Valuation', 'Individual Stocks', 'Policy & Regulation'];

// Components
const TopicFilterTabs = ({ activeFilter, onFilterChange }: { activeFilter: string; onFilterChange: (filter: string) => void }) => (
  <div className="flex flex-wrap gap-2 mb-8">
    {filterOptions.map((filter) => (
      <button
        key={filter}
        onClick={() => onFilterChange(filter)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          activeFilter === filter
            ? 'bg-blue-600 text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800 border border-gray-200'
        }`}
      >
        {filter}
      </button>
    ))}
  </div>
);

const TopicCard = ({ topic }: { topic: Topic }) => {
  const [showAllComments, setShowAllComments] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{topic.title}</h3>
            {topic.isHot && (
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                🔥 Hot
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {topic.category}
            </span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-600">{topic.author}, {topic.role}</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <p className="text-gray-700 mb-4 leading-relaxed">{topic.summary}</p>

      {/* Stats Bar */}
      <div className="flex items-center gap-6 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{topic.stats.comments} comments</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{topic.stats.views} views</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Updated {topic.stats.lastUpdated}</span>
        </div>
      </div>

      {/* Comments Section */}
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {showAllComments ? 'All Discussions' : 'Recent Discussions'}
        </h4>
        
        <div className="space-y-3 mb-4">
          {(showAllComments ? topic.allComments : topic.recentComments).map((comment) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-800">
                  {comment.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{comment.author}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{comment.role}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{comment.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{comment.text}</p>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors">
                      <Heart className="w-3 h-3" />
                      <span>{comment.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Toggle Comments Button */}
        <button 
          onClick={() => setShowAllComments(!showAllComments)}
          className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {showAllComments ? (
            <>
              Show Recent Discussions Only
              <ChevronRight className="w-4 h-4 rotate-90" />
            </>
          ) : (
            <>
              View all {topic.stats.comments} comments
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function TopicOfTheWeekPage() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filteredTopics = activeFilter === 'All' 
    ? mockTopics 
    : mockTopics.filter(topic => topic.category === activeFilter);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Topic of the Week
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Explore trending investment discussions and market insights from our community of experts and investors.
          </p>
        </div>

        {/* Filter Tabs */}
        <TopicFilterTabs 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {/* Topics Grid */}
        <div className="space-y-6">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <MessageCircle className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
              <p className="text-gray-500">Try selecting a different filter or check back later for new discussions.</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {filteredTopics.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg">
              Load More Topics
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
