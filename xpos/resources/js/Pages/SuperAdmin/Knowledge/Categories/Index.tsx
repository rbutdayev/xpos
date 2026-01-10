import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { useTranslation } from 'react-i18next';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  article_count?: number;
}

interface PaginationData {
  data: Category[];
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

interface KnowledgeCategoriesIndexProps {
  categories: PaginationData;
}

export default function KnowledgeCategoriesIndex({ categories = { data: [], meta: { last_page: 1, from: 0, to: 0, total: 0, current_page: 1, path: '', per_page: 20 }, links: { first: '', last: '' } } }: KnowledgeCategoriesIndexProps) {
  const { t } = useTranslation(['knowledge', 'common']);

  return (
    <SuperAdminLayout title={t('knowledge:manage_categories', 'Manage Categories')}>
      <Head title={t('knowledge:manage_categories', 'Manage Categories')} />

          {/* Knowledge Base Navigation Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            <Link
              href="/admin/knowledge/categories"
              className="px-4 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
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
              className="px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300 transition-colors"
            >
              {t('knowledge:context_help', 'Context Help')}
            </Link>
          </div>

      <div>
        {/* Create Button */}
        <div className="flex justify-end mb-6">
          <Link
            href="/admin/knowledge/categories/create"
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {t('common:create', 'Create New')}
          </Link>
        </div>

        {/* Categories List */}
        {categories?.data && categories.data.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('common:name', 'Name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:description', 'Description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {t('knowledge:articles', 'Articles')}
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
                {categories.data.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {category.icon && <span className="text-2xl">{category.icon}</span>}
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 line-clamp-1">
                        {category.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {category.article_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          category.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {category.is_active
                          ? t('common:active', 'Active')
                          : t('common:inactive', 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/admin/knowledge/categories/${category.id}/edit`}
                        className="text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {t('common:edit', 'Edit')}
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(t('common:confirm_delete', 'Are you sure you want to delete this?'))) {
                            router.delete(`/admin/knowledge/categories/${category.id}`);
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
            {categories?.meta?.last_page > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {t('common:showing', 'Showing')} {categories?.meta?.from} {t('common:to', 'to')}{' '}
                  {categories?.meta?.to} {t('common:of', 'of')} {categories?.meta?.total}{' '}
                  {t('knowledge:categories', 'categories')}
                </span>
                <div className="flex gap-2">
                  {categories?.links?.prev && (
                    <Link
                      href={categories.links.prev}
                      className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {t('common:previous', 'Previous')}
                    </Link>
                  )}
                  {categories?.links?.next && (
                    <Link
                      href={categories.links.next}
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
              {t('knowledge:no_categories', 'No categories found')}
            </p>
            <Link
              href="/admin/knowledge/categories/create"
              className="text-slate-600 hover:text-slate-800 font-medium"
            >
              {t('knowledge:create_first_category', 'Create the first category')} →
            </Link>
          </div>
        )}
      </div>
    </SuperAdminLayout>
  );
}
