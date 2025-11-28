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

                {/* Tabs - Enterprise Style Navigation */}
                {tabs && tabs.length > 0 && (
                    <div className="mb-8">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            <nav className="flex flex-wrap gap-1">
                                {tabs.map((tab) => {
                                    const IconComponent = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={tab.onClick}
                                            className={`
                                                relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                                font-medium text-sm transition-all duration-200 ease-in-out
                                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                                ${tab.current
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                                }
                                            `}
                                        >
                                            {IconComponent && (
                                                <IconComponent
                                                    className={`h-5 w-5 ${
                                                        tab.current ? 'text-white' : 'text-gray-400'
                                                    }`}
                                                />
                                            )}
                                            <span className="font-semibold">{tab.name}</span>
                                            {tab.current && (
                                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Content */}
                {children}
            </div>
        </AuthenticatedLayout>
    );
}