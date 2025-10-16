import { ReactNode } from 'react';

interface DashboardGridProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'dense' | 'wide';
}

export default function DashboardGrid({ 
    children, 
    className = '', 
    variant = 'default' 
}: DashboardGridProps) {
    const getGridClasses = () => {
        switch (variant) {
            case 'dense':
                return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max';
            case 'wide':
                return 'grid grid-cols-1 lg:grid-cols-2 gap-6 auto-rows-max';
            default:
                return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 auto-rows-max';
        }
    };

    return (
        <div className={`${getGridClasses()} ${className}`}>
            {children}
        </div>
    );
}