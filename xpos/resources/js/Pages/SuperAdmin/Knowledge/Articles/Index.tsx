import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminNav from '@/Components/SuperAdminNav';
import { useTranslation } from 'react-i18next';

interface Category {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  type: string;
  is_published: boolean;
  is_featured: boolean;
  category: Category;
  view_count: number;
  created_at: string;
}

interface PaginationData {
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
}

interface KnowledgeArticlesIndexProps {
  articles: PaginationData;
  categories: Category[];
}

export default function KnowledgeArticlesIndex({ articles = { data: [], meta: { last_page: 1, from: 0, to: 0, total: 0, current_page: 1, path: '', per_page: 20 }, links: { first: '', last: '' } }, categories = [] }: KnowledgeArticlesIndexProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleFilter = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (selectedCategory) params.append('category_id', selectedCategory);
    window.location.href = `/admin/knowledge/articles?${params.toString()}`;
  };

  const typeLabel = {
    faq: 'FAQ',
    guide: t('knowledge:type_guide', 'Guide'),
    tutorial: t('knowledge:type_tutorial', 'Tutorial'),
    documentation: t('knowledge:type_documentation', 'Documentation'),
    troubleshooting: t('knowledge:type_troubleshooting', 'Troubleshooting'),
  };

  return (
    <>
      <Head title={t('knowledge:manage_articles', 'Manage Articles')} />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {t('knowledge:manage_articles', 'Manage Articles')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('knowledge:articles_description', 'Manage knowledge base articles')}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <SuperAdminNav activePage="/admin/knowledge" />

          {/* Knowledge Base Navigation Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <Link
              href="/admin/knowledge/categories"
              className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              {t('knowledge:categories', 'Categories')}
            </Link>
            <Link
              href="/admin/knowledge/articles"
              className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              {t('knowledge:articles', 'Articles')}
            </Link>
            <Link
              href="/admin/knowledge/context-help"
              className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              {t('knowledge:context_help', 'Context Help')}
            </Link>
          </div>

          <div>
        {/* Create Button */}
        <div className="flex justify-end mb-6">
          <Link
            href="/admin/knowledge/articles/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t('common:create', 'Create New')}
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common:search', 'Search')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('knowledge:all_categories', 'All Categories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common:filter', 'Filter')}
            </button>
          </div>
        </div>

        {/* Articles List */}
        {articles?.data && articles.data.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common:title', 'Title')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:category', 'Category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:type', 'Type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common:status', 'Status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:views', 'Views')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common:actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {articles.data.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-gray-900">{article.title}</p>
                          <p className="text-xs text-gray-500">{article.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {article.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeLabel[article.type as keyof typeof typeLabel] || article.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            article.is_published
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {article.is_published
                            ? t('common:published', 'Published')
                            : t('common:draft', 'Draft')}
                        </span>
                        {article.is_featured && (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⭐ {t('knowledge:featured', 'Featured')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {article.view_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/knowledge/articles/${article.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        {t('common:edit', 'Edit')}
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(t('common:confirm_delete', 'Are you sure you want to delete this?'))) {
                            router.delete(`/admin/knowledge/articles/${article.id}`);
                          }
                        }}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        {t('common:delete', 'Delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {articles?.meta?.last_page > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('common:showing', 'Showing')} {articles?.meta?.from} {t('common:to', 'to')}{' '}
                  {articles?.meta?.to} {t('common:of', 'of')} {articles?.meta?.total}{' '}
                  {t('knowledge:articles', 'articles')}
                </span>
                <div className="flex gap-2">
                  {articles?.links?.prev && (
                    <Link
                      href={articles.links.prev}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {t('common:previous', 'Previous')}
                    </Link>
                  )}
                  {articles?.links?.next && (
                    <Link
                      href={articles.links.next}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {t('common:next', 'Next')}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-4">
              {t('knowledge:no_articles', 'No articles found')}
            </p>
            <Link
              href="/admin/knowledge/articles/create"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('knowledge:create_first_article', 'Create the first article')} →
            </Link>
          </div>
        )}
      </div>
        </div>
      </div>
    </>
  );
}
