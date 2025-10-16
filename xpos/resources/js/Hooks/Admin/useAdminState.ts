import { useState, useCallback } from 'react';

interface UseAdminStateReturn {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    success: string | null;
    setSuccess: (success: string | null) => void;
    clearMessages: () => void;
}

export const useAdminState = (initialTab: string = 'general'): UseAdminStateReturn => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const clearMessages = useCallback(() => {
        setError(null);
        setSuccess(null);
    }, []);

    return {
        activeTab,
        setActiveTab,
        isLoading,
        setIsLoading,
        error,
        setError,
        success,
        setSuccess,
        clearMessages
    };
};