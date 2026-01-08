import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import SuperAdminNav from '@/Components/SuperAdminNav';
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

interface Article {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  type: string;
  difficulty_level?: string;
  tags?: string[];
  is_published: boolean;
  is_featured: boolean;
  knowledge_category_id: number;
  translations: Translation[];
}

interface KnowledgeArticlesEditProps {
  article: Article;
  categories: Category[];
  languages: Language;
}

export default function KnowledgeArticlesEdit({ article = { id: 0, knowledge_category_id: 0, title: '', content: '', excerpt: '', type: 'guide', difficulty_level: 'beginner', tags: [], is_published: false, is_featured: false, translations: [] }, categories = [], languages = { en: 'English', az: 'Azərbaycanca' } }: KnowledgeArticlesEditProps) {
  const { t } = useTranslation(['knowledge', 'common']);
  const [formData, setFormData] = useState({
    knowledge_category_id: article?.knowledge_category_id?.toString() || '',
    title: article?.title || '',
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    type: article?.type || 'guide',
    difficulty_level: article?.difficulty_level || 'beginner',
    tags: Array.isArray(article?.tags) ? article.tags : [],
    is_published: article?.is_published ?? false,
    is_featured: article?.is_featured ?? false,
    translations: article?.translations || [],
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

    router.put(`/admin/knowledge/articles/${article?.id}`, formData as any, {
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
    <>
      <Head title={t('knowledge:edit_article', 'Edit Article')} />

      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">
                {t('knowledge:edit_article', 'Edit Article')}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {t('knowledge:edit_article_description', 'Edit knowledge base article')}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation */}
          <SuperAdminNav activePage="/admin/knowledge" />

          <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/admin/knowledge/articles" className="text-blue-600 hover:text-blue-800 font-medium">
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                  className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? t('common:saving', 'Saving...') : t('common:save_changes', 'Save Changes')}
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
        </div>
      </div>
    </>
  );
}
