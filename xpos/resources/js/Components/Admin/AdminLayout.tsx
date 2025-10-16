import { ReactNode } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface AdminLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
    actions?: ReactNode;
    tabs?: {
        id: string;
        name: string;
        icon?: React.ComponentType<{ className?: string }>;
        current?: boolean;
        onClick?: () => void;
    }[];
}

export default function AdminLayout({ 
    title, 
    description, 
    children, 
    actions,
    tabs 
}: AdminLayoutProps) {
    return (
        <AuthenticatedLayout>
            <Head title={title} />
            
            <div className="mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                            {description && (
                                <p className="mt-2 text-gray-600">{description}</p>
                            )}
                        </div>
                        {actions && (
                            <div className="flex items-center space-x-3">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {tabs && tabs.length > 0 && (
                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => {
                                const IconComponent = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={tab.onClick}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                                            tab.current
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {IconComponent && <IconComponent className="h-5 w-5" />}
                                        <span>{tab.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}

                {/* Content */}
                {children}
            </div>
        </AuthenticatedLayout>
    );
}