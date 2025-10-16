import { ReactNode } from 'react';

interface SettingsCardProps {
    children: ReactNode;
    className?: string;
}

export default function SettingsCard({ children, className = '' }: SettingsCardProps) {
    return (
        <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
            {children}
        </div>
    );
}