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
  knowledge_article_id?: number;
  is_active: boolean;
}

interface KnowledgeContextHelpEditProps {
  contextHelp: ContextHelp;
  articles: Article[];
}

export default function KnowledgeContextHelpEdit({ contextHelp = { id: 0, key: '', knowledge_article_id: undefined, is_active: true }, articles = [] }: KnowledgeContextHelpEditProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [formData, setFormData] = useState({
    knowledge_article_id: contextHelp?.knowledge_article_id?.toString() || '',
    is_active: contextHelp?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    router.put(`/admin/knowledge/context-help/${contextHelp?.id}`, formData, {
      onError: (errors) => {
        setErrors(errors as Record<string, string>);
        setLoading(false);
      },
      onSuccess: () => {
        setLoading(false);
      },
    });
  };

  return (
    <SuperAdminLayout title={t('knowledge:edit_context_help', 'Edit Context Help')}>
      <Head title={t('knowledge:edit_context_help', 'Edit Context Help')} />

      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          {t('knowledge:edit_context_help_description', 'Edit contextual help tooltip')}
        </p>
          {/* Navigation */}

          <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/admin/knowledge/context-help" className="text-slate-600 hover:text-slate-800 font-medium">
            ← {t('common:back', 'Back')}
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Key (Read-only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('knowledge:context_key', 'Context Key')}
            </label>
            <input
              type="text"
              value={contextHelp.key}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('knowledge:key_cannot_be_changed', 'Context keys cannot be changed after creation')}
            </p>
          </div>

          {/* Article */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('knowledge:linked_article', 'Linked Article')}
            </label>
            <select
              name="knowledge_article_id"
              value={formData.knowledge_article_id}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">{t('common:select', 'Select an article (optional)')}</option>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('knowledge:article_link_hint', 'Optional: Link to an article for inline help display')}
            </p>
          </div>

          {/* Status */}
          <div className="mb-6">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-slate-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {t('knowledge:active', 'Active')}
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              {t('knowledge:active_hint', 'Inactive context help will not be displayed')}
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? t('common:saving', 'Saving...') : t('common:save_changes', 'Save Changes')}
            </button>
            <Link
              href="/admin/knowledge/context-help"
              className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common:cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </div>
      </div>
    </SuperAdminLayout>
  );
}
