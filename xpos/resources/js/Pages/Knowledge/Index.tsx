import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import SearchBar from '@/Components/Knowledge/SearchBar';
import CategoryCard from '@/Components/Knowledge/CategoryCard';
import ArticleCard from '@/Components/Knowledge/ArticleCard';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  article_count?: number;
}

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
  category?: Category;
}

interface KnowledgeIndexProps {
  categories: Category[];
  featured_articles: Article[];
}

export default function KnowledgeIndex({ categories, featured_articles }: KnowledgeIndexProps) {
  const { t } = useTranslation('knowledge');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      window.location.href = `/knowledge/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={t('title', 'Knowledge Base')} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12 px-4 rounded-lg mb-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">{t('hero_title', 'Welcome to Knowledge Base')}</h1>
          <p className="text-xl text-blue-100 mb-6">
            {t('hero_subtitle', 'Find answers, tutorials, and guides to help you get the most out of our platform')}
          </p>
          <SearchBar onSearch={handleSearch} placeholder={t('search_placeholder', 'Search knowledge base...')} />
        </div>
      </div>

      {/* Featured Articles Section */}
      {featured_articles.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('featured_articles', 'Featured Articles')}</h2>
            <Link
              href="/knowledge/articles"
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              {t('view_all', 'View All')} →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured_articles.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('browse_categories', 'Browse by Category')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/knowledge/categories/${category.slug}`}
              className="block group"
            >
              <CategoryCard category={category} />
            </Link>
          ))}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{t('cant_find_answer', "Can't find the answer you're looking for?")}</h3>
        <p className="text-gray-600 mb-4">
          {t('contact_support', 'Contact our support team for additional help')}
        </p>
        <a
          href="https://xpos.az/az/support"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {t('contact_support_btn', 'Contact Support')}
        </a>
      </div>
    </AuthenticatedLayout>
  );
}
