import { ReactNode } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface ConfigurationFormProps {
    onSubmit: (e: React.FormEvent) => void;
    children: ReactNode;
    processing?: boolean;
    submitButtonText?: string;
    showSubmitButton?: boolean;
    actions?: ReactNode;
}

export default function ConfigurationForm({ 
    onSubmit, 
    children, 
    processing = false,
    submitButtonText = 'Ayarları Saxla',
    showSubmitButton = true,
    actions
}: ConfigurationFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-8">
            {children}
            
            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                {actions}
                {showSubmitButton && (
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50 transition-colors"
                    >
                        {processing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saxlanılır...
                            </>
                        ) : (
                            <>
                                <CheckIcon className="w-5 h-5 mr-2" />
                                {submitButtonText}
                            </>
                        )}
                    </button>
                )}
            </div>
        </form>
    );
}