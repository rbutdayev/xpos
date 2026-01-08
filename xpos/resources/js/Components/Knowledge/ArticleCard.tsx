import React from 'react';
import { Link } from '@inertiajs/react';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  type: string;
  difficulty_level?: string;
  view_count: number;
  helpful_count: number;
  unhelpful_count: number;
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const typeColors: Record<string, string> = {
    faq: 'bg-blue-100 text-blue-800',
    guide: 'bg-green-100 text-green-800',
    tutorial: 'bg-purple-100 text-purple-800',
    documentation: 'bg-orange-100 text-orange-800',
    troubleshooting: 'bg-red-100 text-red-800',
  };

  const difficultyColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <Link
      href={`/knowledge/articles/${article.slug}`}
      className="block group h-full"
    >
      <div className="h-full p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200">
        {/* Header */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${typeColors[article.type] || typeColors.guide}`}>
            {article.type.toUpperCase()}
          </span>
          {article.difficulty_level && (
            <span className={`inline-block ml-2 px-3 py-1 rounded-full text-xs font-medium ${difficultyColors[article.difficulty_level] || 'bg-gray-100 text-gray-800'}`}>
              {article.difficulty_level}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {article.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {article.excerpt}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>👁 {article.view_count} views</span>
          {article.helpful_count > 0 && (
            <span>👍 {article.helpful_count} helpful</span>
          )}
        </div>
      </div>
    </Link>
  );
}
