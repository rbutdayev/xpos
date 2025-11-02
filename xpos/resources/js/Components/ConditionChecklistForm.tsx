import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface ChecklistItem {
    id: string;
    label_az: string;
    label_en: string;
    type: 'boolean' | 'select' | 'text' | 'textarea';
    options_az?: string[];
    options_en?: string[];
    required?: boolean;
    critical?: boolean;
}

interface ConditionChecklistFormProps {
    checklist: ChecklistItem[];
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    language?: 'az' | 'en';
}

export default function ConditionChecklistForm({
    checklist,
    values,
    onChange,
    language = 'az'
}: ConditionChecklistFormProps) {

    const handleChange = (id: string, value: any) => {
        onChange({
            ...values,
            [id]: value
        });
    };

    const renderField = (item: ChecklistItem) => {
        const label = language === 'az' ? item.label_az : item.label_en;
        const value = values[item.id];

        switch (item.type) {
            case 'boolean':
                return (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center space-x-3">
                            {item.critical && (
                                <span className="text-red-500 text-xs font-semibold">KRİTİK</span>
                            )}
                            <label className="text-sm font-medium text-gray-900">
                                {label}
                                {item.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                type="button"
                                onClick={() => handleChange(item.id, true)}
                                className={`p-2 rounded-lg transition-colors ${
                                    value === true
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                                <CheckCircleIcon className="h-6 w-6" />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleChange(item.id, false)}
                                className={`p-2 rounded-lg transition-colors ${
                                    value === false
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                                <XCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                );

            case 'select':
                const options = language === 'az' ? item.options_az : item.options_en;
                return (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            {label}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select
                            value={value || ''}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={item.required}
                        >
                            <option value="">Seçin</option>
                            {options?.map((option, index) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                );

            case 'text':
                return (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            {label}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <input
                            type="text"
                            value={value || ''}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={item.required}
                        />
                    </div>
                );

            case 'textarea':
                return (
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-900">
                            {label}
                            {item.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            value={value || ''}
                            onChange={(e) => handleChange(item.id, e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required={item.required}
                        />
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-4">
            {checklist.map((item) => (
                <div key={item.id}>
                    {renderField(item)}
                </div>
            ))}
        </div>
    );
}
