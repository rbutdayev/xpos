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
}

interface KnowledgeCategoriesCreateProps {
  parentCategories: Category[];
}

export default function KnowledgeCategoriesCreate({ parentCategories = [] }: KnowledgeCategoriesCreateProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    parent_id: '',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    router.post('/admin/knowledge/categories', formData, {
      onError: (errors) => {
        setErrors(errors as Record<string, string>);
        setLoading(false);
      },
      onSuccess: () => {
        setLoading(false);
      },
    });
  };

  const commonEmojis = ['📚', '📖', '🎓', '❓', '🔧', '💡', '⚙️', '📊', '🛒', '👥'];

  return (
    <SuperAdminLayout title={t('knowledge:create_category', 'Create Category')}>
      <Head title={t('knowledge:create_category', 'Create Category')} />

      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          {t('knowledge:create_category_description', 'Create a new knowledge base category')}
        </p>
          {/* Navigation */}

          <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/admin/knowledge/categories" className="text-slate-600 hover:text-slate-800 font-medium">
            ← {t('common:back', 'Back')}
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          {/* Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('common:name', 'Name')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Getting Started"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('knowledge:description', 'Description')}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Brief description of this category"
              rows={3}
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Icon */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('knowledge:icon', 'Icon (Emoji)')}
            </label>
            <div className="flex gap-2 mb-3">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, icon: emoji }))}
                  className={`text-2xl p-2 border rounded-lg transition-all ${
                    formData.icon === emoji ? 'border-slate-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="icon"
              value={formData.icon}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                errors.icon ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Or paste any emoji"
              maxLength={10}
            />
            {errors.icon && <p className="text-red-500 text-sm mt-1">{errors.icon}</p>}
          </div>

          {/* Parent Category */}
          {parentCategories.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('knowledge:parent_category', 'Parent Category')}
              </label>
              <select
                name="parent_id"
                value={formData.parent_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                <option value="">{t('knowledge:no_parent', 'No parent (Top level)')}</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? t('common:creating', 'Creating...') : t('knowledge:create_category', 'Create Category')}
            </button>
            <Link
              href="/admin/knowledge/categories"
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
