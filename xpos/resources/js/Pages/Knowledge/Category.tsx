import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import ArticleCard from '@/Components/Knowledge/ArticleCard';
import SearchBar from '@/Components/Knowledge/SearchBar';
import {
  RocketLaunchIcon,
  ChartBarIcon,
  ShoppingCartIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  PrinterIcon,
  UserIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  QuestionMarkCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
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

interface KnowledgeCategoryProps {
  category: Category;
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
  filters?: {
    type?: string;
    difficulty?: string;
  };
}

// Map icon names to Heroicons components
const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  'rocket': RocketLaunchIcon,
  'chart-bar': ChartBarIcon,
  'shopping-cart': ShoppingCartIcon,
  'box': CubeIcon,
  'warehouse': BuildingStorefrontIcon,
  'users': UserGroupIcon,
  'sliders-h': Cog6ToothIcon,
  'print': PrinterIcon,
  'user-cog': UserIcon,
  'crown': SparklesIcon,
  'tools': WrenchScrewdriverIcon,
  'money-bill-wave': BanknotesIcon,
  'life-ring': QuestionMarkCircleIcon,
  'plug': LinkIcon,
};

export default function KnowledgeCategory({ category, articles = { data: [], meta: { current_page: 1, from: 0, last_page: 1, path: '', per_page: 12, to: 0, total: 0 }, links: { first: '', last: '' } }, filters = {} }: KnowledgeCategoryProps) {
  const { t } = useTranslation('knowledge');
  const [selectedType, setSelectedType] = useState(filters.type || '');
  const [selectedDifficulty, setSelectedDifficulty] = useState(filters.difficulty || '');
  const IconComponent = category.icon ? iconMap[category.icon] : null;

  const handleFilterChange = () => {
    const params = new URLSearchParams();
    if (selectedType) params.append('type', selectedType);
    if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
    window.location.href = `/knowledge/categories/${category.slug}?${params.toString()}`;
  };

  const articleTypes = [
    { value: 'faq', label: 'FAQ' },
    { value: 'guide', label: t('type_guide', 'Guide') },
    { value: 'tutorial', label: t('type_tutorial', 'Tutorial') },
    { value: 'documentation', label: t('type_documentation', 'Documentation') },
    { value: 'troubleshooting', label: t('type_troubleshooting', 'Troubleshooting') },
  ];

  const difficultyLevels = [
    { value: 'beginner', label: t('difficulty_beginner', 'Beginner') },
    { value: 'intermediate', label: t('difficulty_intermediate', 'Intermediate') },
    { value: 'advanced', label: t('difficulty_advanced', 'Advanced') },
  ];

  return (
    <AuthenticatedLayout>
      <Head title={category.name} />

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center text-sm text-gray-600">
        <Link href="/knowledge" className="hover:text-blue-600">
          {t('knowledge_base', 'Knowledge Base')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{category.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {IconComponent && <IconComponent className="w-16 h-16 text-blue-600" />}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
            {category.description && <p className="text-gray-600 mt-2">{category.description}</p>}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">{t('filters', 'Filters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('article_type', 'Article Type')}
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">{t('all_types', 'All Types')}</option>
              {articleTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('difficulty_level', 'Difficulty Level')}
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <option value="">{t('all_levels', 'All Levels')}</option>
              {difficultyLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleFilterChange}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t('apply_filters', 'Apply Filters')}
            </button>
          </div>
        </div>
      </div>

      {/* Articles */}
      {articles?.data && articles.data.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {articles.data.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {articles?.meta && articles.meta.last_page > 1 && (
            <div className="flex justify-center gap-2">
              {articles.links.prev && (
                <Link
                  href={articles.links.prev}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('previous', 'Previous')}
                </Link>
              )}
              <span className="px-4 py-2 text-gray-600">
                {t('page', 'Page')} {articles.meta.current_page} {t('of', 'of')} {articles.meta.last_page}
              </span>
              {articles.links.next && (
                <Link
                  href={articles.links.next}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('next', 'Next')}
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">{t('no_articles', 'No articles found in this category')}</p>
          <Link
            href="/knowledge"
            className="text-slate-600 hover:text-slate-800 font-medium"
          >
            {t('back_to_knowledge', 'Back to Knowledge Base')} →
          </Link>
        </div>
      )}
    </AuthenticatedLayout>
  );
}
