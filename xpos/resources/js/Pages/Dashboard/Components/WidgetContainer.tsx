import { ReactNode } from 'react';

interface WidgetContainerProps {
    children: ReactNode;
    className?: string;
    loading?: boolean;
    error?: string | null;
}

export default function WidgetContainer({ 
    children, 
    className = '', 
    loading = false,
    error = null 
}: WidgetContainerProps) {
    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
                <div className="text-center py-8">
                    <div className="text-red-500 mb-2">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>
                    <p className="text-sm text-gray-500">Widget yüklənmədi</p>
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-3 bg-gray-300 rounded"></div>
                        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                        <div className="h-3 bg-gray-300 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            {children}
        </div>
    );
}