import { ReactNode, memo } from 'react';

interface SettingsSectionProps {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    children: ReactNode;
    saving?: boolean;
    className?: string;
}

export const SettingsSection = memo(({ 
    title, 
    description, 
    icon: IconComponent,
    iconColor = 'text-blue-600',
    children, 
    saving,
    className = ''
}: SettingsSectionProps) => {
    return (
        <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
            <div className="flex items-center mb-4">
                {IconComponent && (
                    <IconComponent className={`w-5 h-5 mr-2 ${iconColor}`} />
                )}
                <div>
                    <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                    {description && (
                        <p className="mt-1 text-sm text-gray-600">{description}</p>
                    )}
                </div>
            </div>
            
            <div>
                {children}
            </div>
            
            {saving && (
                <div className="mt-4 flex items-center text-sm text-gray-600">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Dəyişikliklər saxlanılır...
                </div>
            )}
        </div>
    );
});

SettingsSection.displayName = 'SettingsSection';