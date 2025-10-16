import { memo } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface SectionHeaderProps {
    title: string;
    isExpanded: boolean;
    onToggle: () => void;
    subtitle?: string;
    actionButton?: React.ReactNode;
}

export const SectionHeader = memo(({ 
    title, 
    isExpanded, 
    onToggle, 
    subtitle,
    actionButton 
}: SectionHeaderProps) => {
    return (
        <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
             onClick={onToggle}>
            <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                {subtitle && (
                    <span className="text-sm text-gray-500">{subtitle}</span>
                )}
            </div>
            <div className="flex items-center space-x-2">
                {actionButton && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {actionButton}
                    </div>
                )}
                {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                )}
            </div>
        </div>
    );
});