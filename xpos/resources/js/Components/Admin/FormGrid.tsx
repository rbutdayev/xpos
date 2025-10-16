import { ReactNode } from 'react';

interface FormGridProps {
    children: ReactNode;
    columns?: 1 | 2 | 3;
    className?: string;
}

export default function FormGrid({ 
    children, 
    columns = 2,
    className = ''
}: FormGridProps) {
    const gridClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3'
    };

    return (
        <div className={`grid ${gridClasses[columns]} gap-6 ${className}`}>
            {children}
        </div>
    );
}