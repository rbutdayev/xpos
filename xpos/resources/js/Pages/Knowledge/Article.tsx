import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useTranslation } from 'react-i18next';
import HelpfulnessVoting from '@/Components/Knowledge/HelpfulnessVoting';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface RelatedArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  type: string;
}

interface ArticleTranslation {
  language: string;
  title: string;
  content: string;
  excerpt: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  type: string;
  difficulty_level?: string;
  tags?: string[];
  view_count: number;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  updated_at: string;
  category: Category;
  translations?: ArticleTranslation[];
  related_articles?: RelatedArticle[];
}

interface KnowledgeArticleProps {
  article: Article;
  related_articles?: RelatedArticle[];
}

export default function KnowledgeArticle({ article, related_articles = [] }: KnowledgeArticleProps) {
  const { t, i18n } = useTranslation('knowledge');
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    // Record view
    const recordView = async () => {
      try {
        await fetch(`/api/knowledge/articles/${article.id}/view`, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
          },
        });
      } catch (error) {
        console.error('Error recording view:', error);
      }
    };

    recordView();
  }, [article.id]);

  const getArticleContent = () => {
    if (article.translations && article.translations.length > 0) {
      const currentLang = i18n.language;
      const translation = article.translations.find((t) => t.language === currentLang);
      if (translation) {
        return translation.content;
      }
      return article.translations[0]?.content || article.content;
    }
    return article.content;
  };

  const getArticleTitle = () => {
    if (article.translations && article.translations.length > 0) {
      const currentLang = i18n.language;
      const translation = article.translations.find((t) => t.language === currentLang);
      if (translation) {
        return translation.title;
      }
      return article.translations[0]?.title || article.title;
    }
    return article.title;
  };

  const typeLabel = {
    faq: 'FAQ',
    guide: t('type_guide', 'Guide'),
    tutorial: t('type_tutorial', 'Tutorial'),
    documentation: t('type_documentation', 'Documentation'),
    troubleshooting: t('type_troubleshooting', 'Troubleshooting'),
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  return (
    <AuthenticatedLayout>
      <Head title={getArticleTitle()} />

      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-gray-600">
          <Link href="/knowledge" className="hover:text-blue-600">
            {t('knowledge_base', 'Knowledge Base')}
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/knowledge/categories/${article.category.slug}`}
            className="hover:text-blue-600"
          >
            {article.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{getArticleTitle()}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{getArticleTitle()}</h1>

          {/* Meta information */}
          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-600">
            <span>{t('article_type', 'Type')}: {typeLabel[article.type as keyof typeof typeLabel] || article.type}</span>
            {article.difficulty_level && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  difficultyColors[article.difficulty_level as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {t(`difficulty_${article.difficulty_level}`, article.difficulty_level)}
              </span>
            )}
            <span>{t('views', 'Views')}: {article.view_count}</span>
            <span>{t('last_updated', 'Updated')}: {new Date(article.updated_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg p-8 border border-gray-200 mb-8">
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: getArticleContent() }} />
        </div>

        {/* Helpfulness voting */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
          <p className="text-gray-800 font-medium mb-4">{t('was_helpful', 'Was this article helpful?')}</p>
          <HelpfulnessVoting
            articleId={article.id}
            initialHelpfulCount={article.helpful_count}
            initialUnhelpfulCount={article.unhelpful_count}
          />
        </div>

        {/* Related articles */}
        {related_articles.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('related_articles', 'Related Articles')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {related_articles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/knowledge/articles/${relatedArticle.slug}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="text-xs text-blue-600 font-medium mb-1">{relatedArticle.type.toUpperCase()}</div>
                  <h4 className="font-semibold text-gray-900 mb-2">{relatedArticle.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{relatedArticle.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-12 text-center">
          <Link
            href={`/knowledge/categories/${article.category.slug}`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← {t('back_to_category', 'Back to Category')}
          </Link>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
