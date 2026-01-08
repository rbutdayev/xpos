import React from 'react';
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
  article_count?: number;
}

interface CategoryCardProps {
  category: Category;
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

export default function CategoryCard({ category }: CategoryCardProps) {
  const IconComponent = category.icon ? iconMap[category.icon] : null;

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200">
      {/* Icon */}
      {IconComponent && (
        <div className="mb-4">
          <IconComponent className="w-12 h-12 text-blue-600" />
        </div>
      )}

      {/* Name */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {category.name}
      </h3>

      {/* Description */}
      {category.description && (
        <p className="text-sm text-gray-600 mb-4">
          {category.description}
        </p>
      )}

      {/* Article Count */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-sm font-medium text-blue-600">
          {category.article_count || 0} articles
        </span>
        <span className="text-blue-600 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </div>
  );
}
