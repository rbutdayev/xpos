import React, { useState } from 'react';

interface HelpfulnessVotingProps {
  articleId: number;
  initialHelpfulCount: number;
  initialUnhelpfulCount: number;
}

export default function HelpfulnessVoting({
  articleId,
  initialHelpfulCount,
  initialUnhelpfulCount,
}: HelpfulnessVotingProps) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [unhelpfulCount, setUnhelpfulCount] = useState(initialUnhelpfulCount);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVote = async (type: 'helpful' | 'unhelpful') => {
    if (voted || loading) return;

    setLoading(true);
    try {
      const endpoint = type === 'helpful'
        ? `/api/knowledge/articles/${articleId}/helpful`
        : `/api/knowledge/articles/${articleId}/unhelpful`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHelpfulCount(data.data.helpful_count);
        setUnhelpfulCount(data.data.unhelpful_count);
        setVoted(true);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => handleVote('helpful')}
        disabled={voted || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          voted
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-green-100 text-green-700 hover:bg-green-200 active:scale-95'
        }`}
      >
        <span>👍</span>
        <span>{helpfulCount}</span>
      </button>

      <button
        onClick={() => handleVote('unhelpful')}
        disabled={voted || loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          voted
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-red-100 text-red-700 hover:bg-red-200 active:scale-95'
        }`}
      >
        <span>👎</span>
        <span>{unhelpfulCount}</span>
      </button>

      {voted && (
        <span className="text-sm text-gray-600">
          Thank you for your feedback!
        </span>
      )}
    </div>
  );
}
