import { useForm } from '@inertiajs/react';
import { useCallback } from 'react';

interface SettingsFormData {
    [key: string]: any;
}

interface UseSettingsOptions {
    onSuccess?: () => void;
    onError?: (errors: any) => void;
}

export const useSettings = <T extends SettingsFormData>(
    initialData: T,
    endpoint: string,
    options?: UseSettingsOptions
) => {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm<T>(initialData);

    const updateSetting = useCallback((key: keyof T, value: any) => {
        setData(prev => ({ ...prev, [key]: value }));
        clearErrors && clearErrors();
    }, []);

    const updateMultipleSettings = useCallback((settings: Partial<T>) => {
        setData(prev => ({ ...prev, ...settings }));
        clearErrors && clearErrors();
    }, []);

    const saveSetting = useCallback((key: keyof T, value: any) => {
        updateSetting(key, value);
        
        // Debounce the save operation
        setTimeout(() => {
            put(endpoint, {
                onSuccess: () => {
                    options?.onSuccess?.();
                },
                onError: (errors) => {
                    options?.onError?.(errors);
                }
            });
        }, 300);
    }, [updateSetting, put, endpoint, options]);

    const saveAllSettings = useCallback(() => {
        put(endpoint, {
            onSuccess: () => {
                options?.onSuccess?.();
            },
            onError: (errors) => {
                options?.onError?.(errors);
            }
        });
    }, [put, endpoint, options]);

    return {
        data,
        setData,
        updateSetting,
        updateMultipleSettings,
        saveSetting,
        saveAllSettings,
        processing,
        errors,
        reset,
        clearErrors
    };
};