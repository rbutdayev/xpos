import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { useTranslation } from 'react-i18next';

interface Article {
  id: number;
  title: string;
}

interface KnowledgeContextHelpCreateProps {
  articles: Article[];
}

export default function KnowledgeContextHelpCreate({ articles = [] }: KnowledgeContextHelpCreateProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [formData, setFormData] = useState({
    key: '',
    knowledge_article_id: '',
    is_active: true,
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

    router.post('/admin/knowledge/context-help', formData, {
      onError: (errors) => {
        setErrors(errors as Record<string, string>);
        setLoading(false);
      },
      onSuccess: () => {
        setLoading(false);
      },
    });
  };

  const commonContextKeys = [
    'dashboard.help',
    'products.help',
    'sales.help',
    'customers.help',
    'reports.help',
    'settings.help',
    'inventory.help',
    'suppliers.help',
    'employees.help',
    'discounts.help',
  ];

  return (
    <SuperAdminLayout title={t('knowledge:create_context_help', 'Create Context Help')}>
      <Head title={t('knowledge:create_context_help', 'Create Context Help')} />

      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          {t('knowledge:create_context_help_description', 'Create contextual help tooltip')}
        </p>

          <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/admin/knowledge/context-help" className="text-slate-600 hover:text-slate-800 font-medium">
            ← {t('common:back', 'Back')}
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Key */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('knowledge:context_key', 'Context Key')} <span className="text-red-500">*</span>
            </label>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">{t('knowledge:common_keys', 'Common keys:')}</p>
              <div className="flex flex-wrap gap-2">
                {commonContextKeys.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, key }))}
                    className={`px-3 py-1 border rounded-lg text-sm transition-colors ${
                      formData.key === key
                        ? 'border-slate-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              name="key"
              value={formData.key}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                errors.key ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., dashboard.help, products.manage"
            />
            {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
            <p className="text-xs text-gray-500 mt-1">
              {t('knowledge:key_format_hint', 'Use lowercase with dots for nested keys')}
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
              {loading ? t('common:creating', 'Creating...') : t('knowledge:create_context_help', 'Create Context Help')}
            </button>
            <Link
              href="/admin/knowledge/context-help"
              className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common:cancel', 'Cancel')}
            </Link>
          </div>
        </form>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            {t('knowledge:context_help_info', 'How Context Help Works')}
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>{t('knowledge:info_1', 'Map a feature key to help articles')}</li>
            <li>{t('knowledge:info_2', 'Display help buttons in your application using the help component')}</li>
            <li>{t('knowledge:info_3', 'Users can click to see related knowledge base articles')}</li>
            <li>{t('knowledge:info_4', 'Use the key format: "feature.section.subsection"')}</li>
          </ul>
        </div>
      </div>
      </div>
    </SuperAdminLayout>
  );
}
