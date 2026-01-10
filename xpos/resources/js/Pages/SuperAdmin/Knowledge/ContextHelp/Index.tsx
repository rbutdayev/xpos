import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { useTranslation } from 'react-i18next';

interface Article {
  id: number;
  title: string;
}

interface ContextHelp {
  id: number;
  key: string;
  article?: Article;
  is_active: boolean;
  created_at: string;
}

interface PaginationData {
  data: ContextHelp[];
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

interface KnowledgeContextHelpIndexProps {
  contextHelps: PaginationData;
}

export default function KnowledgeContextHelpIndex({ contextHelps = { data: [], meta: { last_page: 1, from: 0, to: 0, total: 0, current_page: 1, path: '', per_page: 20 }, links: { first: '', last: '' } } }: KnowledgeContextHelpIndexProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [search, setSearch] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    window.location.href = `/admin/knowledge/context-help?${params.toString()}`;
  };

  return (
    <SuperAdminLayout title={t('knowledge:manage_context_help', 'Manage Context Help')}>
      <Head title={t('knowledge:manage_context_help', 'Manage Context Help')} />

      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          {t('knowledge:context_help_description', 'Manage contextual help tooltips')}
        </p>

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
              className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              {t('knowledge:articles', 'Articles')}
            </Link>
            <Link
              href="/admin/knowledge/context-help"
              className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
            >
              {t('knowledge:context_help', 'Context Help')}
            </Link>
          </div>

          <div>
        {/* Create Button */}
        <div className="flex justify-end mb-6">
          <Link
            href="/admin/knowledge/context-help/create"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t('common:create', 'Create New')}
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('knowledge:search_context_key', 'Search by context key...')}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
            <button
              onClick={handleSearch}
              className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common:search', 'Search')}
            </button>
          </div>
        </div>

        {/* Context Help List */}
        {contextHelps?.data && contextHelps.data.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:context_key', 'Context Key')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:linked_article', 'Linked Article')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common:status', 'Status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common:actions', 'Actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contextHelps.data.map((contextHelp) => (
                  <tr key={contextHelp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{contextHelp.key}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('common:created', 'Created')}: {new Date(contextHelp.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {contextHelp.article ? (
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full inline-block">
                          {contextHelp.article.title}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t('knowledge:no_article_linked', 'No article linked')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          contextHelp.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {contextHelp.is_active
                          ? t('common:active', 'Active')
                          : t('common:inactive', 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/knowledge/context-help/${contextHelp.id}/edit`}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {t('common:edit', 'Edit')}
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(t('common:confirm_delete', 'Are you sure you want to delete this?'))) {
                            router.delete(`/admin/knowledge/context-help/${contextHelp.id}`);
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
            {contextHelps?.meta?.last_page > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('common:showing', 'Showing')} {contextHelps?.meta?.from} {t('common:to', 'to')}{' '}
                  {contextHelps?.meta?.to} {t('common:of', 'of')} {contextHelps?.meta?.total}{' '}
                  {t('knowledge:context_helps', 'context helps')}
                </span>
                <div className="flex gap-2">
                  {contextHelps?.links?.prev && (
                    <Link
                      href={contextHelps.links.prev}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {t('common:previous', 'Previous')}
                    </Link>
                  )}
                  {contextHelps?.links?.next && (
                    <Link
                      href={contextHelps.links.next}
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
              {t('knowledge:no_context_helps', 'No context help mappings found')}
            </p>
            <Link
              href="/admin/knowledge/context-help/create"
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              {t('knowledge:create_first_context_help', 'Create the first context help mapping')} →
            </Link>
          </div>
        )}
      </div>
      </div>
    </SuperAdminLayout>
  );
}
