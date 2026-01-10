import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import ArticleCard from '@/Components/Knowledge/ArticleCard';
import SearchBar from '@/Components/Knowledge/SearchBar';

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

interface KnowledgeSearchResultsProps {
  query?: string;
  articles: {
    data: Article[];
    links: {
      first: string;
      last: string;
      prev?: string;
      next?: string;
    };
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      path: string;
      per_page: number;
      to: number;
      total: number;
    };
  };
}

export default function KnowledgeSearchResults({ query = '', articles = { data: [], meta: { current_page: 1, from: 0, last_page: 1, path: '', per_page: 12, to: 0, total: 0 }, links: { first: '', last: '' } } }: KnowledgeSearchResultsProps) {
  const { t } = useTranslation('knowledge');
  const [searchQuery, setSearchQuery] = useState(query);

  const handleSearch = (newQuery: string) => {
    setSearchQuery(newQuery);
    if (newQuery.trim()) {
      router.get('/knowledge/search', { q: newQuery }, { preserveState: false });
    }
  };

  return (
    <AuthenticatedLayout>
      <Head title={`${t('search', 'Search')} - ${query}`} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/knowledge" className="hover:text-blue-600">
          {t('knowledge_base', 'Knowledge Base')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{t('search_results', 'Search Results')}</span>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('search_results', 'Search Results')}</h1>
        <SearchBar
          onSearch={handleSearch}
          placeholder={t('search_placeholder', 'Search knowledge base...')}
          initialValue={query}
        />
      </div>

      {/* Results Summary */}
      {query && articles?.meta && (
        <div className="mb-6 text-gray-600">
          <p>
            {articles.meta.total > 0
              ? t('found_results', `Found {{count}} results for "{{query}}"`, {
                  count: articles.meta.total,
                  query: query,
                })
              : t('no_results_for_query', `No results found for "{{query}}"`, { query })}
          </p>
        </div>
      )}

      {/* Results */}
      {articles?.data && articles.data.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {articles?.meta && articles.meta.last_page > 1 && (
            <div className="flex justify-center gap-2 mb-8">
              {articles.links.prev && (
                <Link
                  href={`${articles.links.prev}&q=${encodeURIComponent(query)}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('previous', 'Previous')}
                </Link>
              )}
              <span className="px-4 py-2 text-gray-600">
                {t('page', 'Page')} {articles.meta.current_page} {t('of', 'of')} {articles.meta.last_page}
              </span>
              {articles.links.next && (
                <Link
                  href={`${articles.links.next}&q=${encodeURIComponent(query)}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('next', 'Next')}
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">
            {query
              ? t('no_articles', 'No articles found matching your search')
              : t('enter_search_query', 'Enter a search query to find articles')}
          </p>
          <Link
            href="/knowledge"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            {t('browse_categories', 'Browse Categories')} →
          </Link>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
