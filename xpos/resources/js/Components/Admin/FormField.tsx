import { ReactNode } from 'react';

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
    description?: string;
    className?: string;
}

export default function FormField({ 
    label, 
    required, 
    error, 
    children, 
    description,
    className = ''
}: FormFieldProps) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {description && (
                <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
            <div className="mt-1">
                {children}
            </div>
            {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
            )}
        </div>
    );
}