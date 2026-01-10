import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminLayout from '@/Layouts/SuperAdminLayout';
import { useTranslation } from 'react-i18next';

interface Category {
  id: number;
  name: string;
}

interface Language {
  [key: string]: string;
}

interface Translation {
  language: string;
  title: string;
  content: string;
  excerpt: string;
}

interface KnowledgeArticlesCreateProps {
  categories: Category[];
  languages: Language;
}

export default function KnowledgeArticlesCreate({ categories = [], languages = { en: 'English', az: 'Azərbaycanca' } }: KnowledgeArticlesCreateProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [formData, setFormData] = useState({
    knowledge_category_id: '',
    title: '',
    content: '',
    excerpt: '',
    type: 'guide',
    difficulty_level: 'beginner',
    tags: [] as string[],
    is_published: false,
    is_featured: false,
    translations: Object.keys(languages || {}).map((lang) => ({
      language: lang,
      title: '',
      content: '',
      excerpt: '',
    })),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTranslationChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      translations: prev.translations.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      ),
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    router.post('/admin/knowledge/articles', formData, {
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
    <SuperAdminLayout title={t('knowledge:create_article', 'Create Article')}>
      <Head title={t('knowledge:create_article', 'Create Article')} />

          <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/admin/knowledge/articles" className="text-slate-600 hover:text-slate-800 font-medium">
            ← {t('common:back', 'Back')}
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('knowledge:basic_info', 'Basic Information')}</h2>

            {/* Category */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('knowledge:category', 'Category')} <span className="text-red-500">*</span>
              </label>
              <select
                name="knowledge_category_id"
                value={formData.knowledge_category_id}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  errors.knowledge_category_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('common:select', 'Select a category')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.knowledge_category_id && (
                <p className="text-red-500 text-sm mt-1">{errors.knowledge_category_id}</p>
              )}
            </div>

            {/* Main Title */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common:title', 'Title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Article title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>

            {/* Main Content */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('common:content', 'Content')} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Article content (HTML supported)"
                rows={8}
              />
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            </div>

            {/* Excerpt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('knowledge:excerpt', 'Excerpt')}
              </label>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="Brief summary of the article"
                rows={3}
              />
            </div>
          </div>

          {/* Article Type & Difficulty */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('knowledge:article_details', 'Article Details')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('knowledge:type', 'Type')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="faq">FAQ</option>
                  <option value="guide">{t('knowledge:type_guide', 'Guide')}</option>
                  <option value="tutorial">{t('knowledge:type_tutorial', 'Tutorial')}</option>
                  <option value="documentation">{t('knowledge:type_documentation', 'Documentation')}</option>
                  <option value="troubleshooting">{t('knowledge:type_troubleshooting', 'Troubleshooting')}</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('knowledge:difficulty_level', 'Difficulty Level')}
                </label>
                <select
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <option value="beginner">{t('knowledge:difficulty_beginner', 'Beginner')}</option>
                  <option value="intermediate">{t('knowledge:difficulty_intermediate', 'Intermediate')}</option>
                  <option value="advanced">{t('knowledge:difficulty_advanced', 'Advanced')}</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('knowledge:tags', 'Tags')}
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Add a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('common:add', 'Add')}
                </button>
              </div>
              {Array.isArray(formData.tags) && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-600"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Publishing Options */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('knowledge:publish_article', 'Publish article')}
                </span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={formData.is_featured}
                  onChange={handleChange}
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-slate-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('knowledge:feature_article', 'Feature article (show on homepage)')}
                </span>
              </label>
            </div>
          </div>

          {/* Translations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('knowledge:translations', 'Translations')}</h2>

            {formData.translations.map((translation, index) => (
              <div key={translation.language} className="mb-6 pb-6 border-b border-gray-200 last:border-b-0">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {languages[translation.language]} ({translation.language.toUpperCase()})
                </h3>

                {/* Translation Title */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common:title', 'Title')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={translation.title}
                    onChange={(e) => handleTranslationChange(index, 'title', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder={`Article title in ${languages[translation.language]}`}
                  />
                </div>

                {/* Translation Content */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('common:content', 'Content')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={translation.content}
                    onChange={(e) => handleTranslationChange(index, 'content', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder={`Article content in ${languages[translation.language]}`}
                    rows={6}
                  />
                </div>

                {/* Translation Excerpt */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('knowledge:excerpt', 'Excerpt')}
                  </label>
                  <textarea
                    value={translation.excerpt}
                    onChange={(e) => handleTranslationChange(index, 'excerpt', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder={`Article excerpt in ${languages[translation.language]}`}
                    rows={3}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div className="flex gap-3 bg-white rounded-lg shadow p-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? t('common:creating', 'Creating...') : t('knowledge:create_article', 'Create Article')}
            </button>
            <Link
              href="/admin/knowledge/articles"
              className="bg-gray-300 hover:bg-gray-400 text-gray-900 px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {t('common:cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </div>
    </SuperAdminLayout>
  );
}
