import { useState, FormEventHandler } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    DocumentTextIcon,
    ArrowLeftIcon,
    CheckIcon,
    XMarkIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';

interface RentalTemplate {
    id?: number;
    name: string;
    rental_category: string;
    terms_and_conditions_az: string;
    terms_and_conditions_en: string;
    damage_liability_terms_az: string;
    damage_liability_terms_en: string;
    condition_checklist: any[];
    is_active: boolean;
    is_default: boolean;
    require_photos: boolean;
    min_photos: number;
    notes: string;
}

interface Category {
    value: string;
    label: string;
}

interface Props {
    template: RentalTemplate | null;
    categories: Category[];
}

export default function Form({ template, categories }: Props) {
    const [activeTab, setActiveTab] = useState<'az' | 'en'>('az');
    const [optionsEditState, setOptionsEditState] = useState<Record<string, { az?: string; en?: string }>>({});
    const isEditing = !!template;

    // Add stable _key to existing checklist items
    const initializeChecklist = (checklist: any[]) => {
        return checklist.map((item, index) => ({
            ...item,
            _key: item._key || item.id || `existing_${index}_${Date.now()}`,
        }));
    };

    const formData: any = {
        name: template?.name || '',
        rental_category: template?.rental_category || (categories.length > 0 ? categories[0].value : ''),
        terms_and_conditions_az: template?.terms_and_conditions_az || '',
        terms_and_conditions_en: template?.terms_and_conditions_en || '',
        damage_liability_terms_az: template?.damage_liability_terms_az || '',
        damage_liability_terms_en: template?.damage_liability_terms_en || '',
        condition_checklist: initializeChecklist(template?.condition_checklist || []),
        is_active: template?.is_active ?? true,
        is_default: template?.is_default ?? false,
        require_photos: template?.require_photos ?? true,
        min_photos: template?.min_photos || 2,
        notes: template?.notes || '',
    };

    const { data, setData: setDataOriginal, post, put, processing, errors } = useForm(formData);
    const setData = setDataOriginal as any;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Clean up internal _key field from checklist items before submitting
        const cleanedData = {
            ...data,
            condition_checklist: data.condition_checklist.map((item: any) => {
                const { _key, ...cleanItem } = item;
                return cleanItem;
            }),
        };

        if (isEditing && template) {
            router.put(`/rental-templates/${template.id}`, cleanedData);
        } else {
            router.post('/rental-templates', cleanedData);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={isEditing ? 'Şablonu Düzəlt' : 'Yeni Şablon'} />

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.get('/rental-templates')}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Geri
                    </button>
                    <div className="flex items-center">
                        <DocumentTextIcon className="w-8 h-8 text-gray-400 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {isEditing ? 'Şablonu Düzəlt' : 'Yeni Şablon'}
                            </h1>
                            <p className="text-sm text-gray-600">
                                İcarə müqavilə şablonunu konfiqurasiya edin
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Əsas Məlumat
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Şablon Adı <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Kateqoriya <span className="text-red-500">*</span>
                                </label>
                                {categories.length > 0 ? (
                                    <select
                                        value={data.rental_category}
                                        onChange={(e) => setData('rental_category', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.value} value={cat.value}>
                                                {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md border border-red-200">
                                        Heç bir icarə kateqoriyası tapılmadı. Zəhmət olmasa əvvəlcə{' '}
                                        <a href="/rental-categories" className="font-medium underline hover:text-red-800">
                                            icarə kateqoriyası yaradın
                                        </a>
                                        .
                                    </div>
                                )}
                                {errors.rental_category && (
                                    <p className="mt-1 text-sm text-red-600">{errors.rental_category}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                    Aktiv
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    checked={data.is_default}
                                    onChange={(e) => setData('is_default', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                                    Default Şablon
                                </label>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="require_photos"
                                    checked={data.require_photos}
                                    onChange={(e) => setData('require_photos', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="require_photos" className="ml-2 block text-sm text-gray-700">
                                    Foto Tələb Et
                                </label>
                            </div>
                        </div>

                        {data.require_photos && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Foto Sayı
                                </label>
                                <input
                                    type="number"
                                    value={data.min_photos}
                                    onChange={(e) => setData('min_photos', parseInt(e.target.value) || 0)}
                                    min="0"
                                    max="20"
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        )}

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Qeydlər
                            </label>
                            <textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Language Tabs - Enterprise Style */}
                    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                        <div className="p-1">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                                <nav className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('az')}
                                        className={`
                                            relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                            font-medium text-sm transition-all duration-200 ease-in-out
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                            ${activeTab === 'az'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <span className="font-semibold">Azərbaycan dili</span>
                                        {activeTab === 'az' && (
                                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('en')}
                                        className={`
                                            relative flex items-center gap-2.5 px-5 py-3 rounded-md
                                            font-medium text-sm transition-all duration-200 ease-in-out
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                                            ${activeTab === 'en'
                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                                            }
                                        `}
                                    >
                                        <span className="font-semibold">English</span>
                                        {activeTab === 'en' && (
                                            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                                        )}
                                    </button>
                                </nav>
                            </div>
                        </div>

                        <div className="p-6">
                            {activeTab === 'az' ? (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Şərtlər və Qaydalar (AZ) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.terms_and_conditions_az}
                                            onChange={(e) => setData('terms_and_conditions_az', e.target.value)}
                                            rows={10}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                            placeholder="Markdown formatında yaza bilərsiniz..."
                                            required
                                        />
                                        {errors.terms_and_conditions_az && (
                                            <p className="mt-1 text-sm text-red-600">{errors.terms_and_conditions_az}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Zərər Məsuliyyəti Şərtləri (AZ) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.damage_liability_terms_az}
                                            onChange={(e) => setData('damage_liability_terms_az', e.target.value)}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                            placeholder="Markdown formatında yaza bilərsiniz..."
                                            required
                                        />
                                        {errors.damage_liability_terms_az && (
                                            <p className="mt-1 text-sm text-red-600">{errors.damage_liability_terms_az}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Terms and Conditions (EN)
                                        </label>
                                        <textarea
                                            value={data.terms_and_conditions_en}
                                            onChange={(e) => setData('terms_and_conditions_en', e.target.value)}
                                            rows={10}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                            placeholder="You can write in Markdown format..."
                                        />
                                        {errors.terms_and_conditions_en && (
                                            <p className="mt-1 text-sm text-red-600">{errors.terms_and_conditions_en}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Damage Liability Terms (EN)
                                        </label>
                                        <textarea
                                            value={data.damage_liability_terms_en}
                                            onChange={(e) => setData('damage_liability_terms_en', e.target.value)}
                                            rows={6}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                            placeholder="You can write in Markdown format..."
                                        />
                                        {errors.damage_liability_terms_en && (
                                            <p className="mt-1 text-sm text-red-600">{errors.damage_liability_terms_en}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Condition Checklist Builder */}
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Vəziyyət Yoxlama Siyahısı
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Kirayə zamanı yoxlanılacaq sahələri müəyyən edin
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    const timestamp = Date.now();
                                    const newItem = {
                                        id: '',
                                        label_az: '',
                                        label_en: '',
                                        type: 'boolean',
                                        required: false,
                                        critical: false,
                                        _key: `new_${timestamp}`, // Internal key for React
                                    };
                                    setData('condition_checklist', [...data.condition_checklist, newItem]);
                                }}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                            >
                                <PlusIcon className="h-4 w-4 mr-1" />
                                Sahə Əlavə Et
                            </button>
                        </div>

                        {data.condition_checklist.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>Heç bir yoxlama sahəsi əlavə edilməyib.</p>
                                <p className="text-sm mt-1">Yuxarıdakı düyməyə klikləyərək sahə əlavə edin.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data.condition_checklist.map((item: any, index: number) => (
                                    <div key={item._key || item.id || `item-${index}`} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-sm font-medium text-gray-700">
                                                Sahə {index + 1}
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newChecklist = data.condition_checklist.filter((_: any, i: number) => i !== index);
                                                    setData('condition_checklist', newChecklist);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* ID */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ID (unikal) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.id || ''}
                                                    onChange={(e) => {
                                                        const newChecklist = [...data.condition_checklist];
                                                        newChecklist[index] = { ...item, id: e.target.value };
                                                        setData('condition_checklist', newChecklist);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="no_damage, buttons_intact, clean_condition"
                                                    required
                                                />
                                                <p className="mt-1 text-xs text-gray-500">
                                                    İngilis hərfləri və alt xətt işarəsi istifadə edin
                                                </p>
                                            </div>

                                            {/* Type */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Növ <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={item.type}
                                                    onChange={(e) => {
                                                        const newChecklist = [...data.condition_checklist];
                                                        newChecklist[index] = { ...item, type: e.target.value };
                                                        setData('condition_checklist', newChecklist);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                >
                                                    <option value="boolean">Bəli/Xeyr</option>
                                                    <option value="text">Qısa mətn</option>
                                                    <option value="textarea">Uzun mətn</option>
                                                    <option value="select">Seçim (dropdown)</option>
                                                    <option value="number">Rəqəm</option>
                                                </select>
                                            </div>

                                            {/* Label AZ */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Etiket (AZ) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.label_az}
                                                    onChange={(e) => {
                                                        const newChecklist = [...data.condition_checklist];
                                                        newChecklist[index] = { ...item, label_az: e.target.value };
                                                        setData('condition_checklist', newChecklist);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Zədə yoxdur"
                                                    required
                                                />
                                            </div>

                                            {/* Label EN */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Etiket (EN)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={item.label_en || ''}
                                                    onChange={(e) => {
                                                        const newChecklist = [...data.condition_checklist];
                                                        newChecklist[index] = { ...item, label_en: e.target.value };
                                                        setData('condition_checklist', newChecklist);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="No damage"
                                                />
                                            </div>

                                            {/* Options for Select type */}
                                            {item.type === 'select' && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Seçimlər (AZ) - vergüllə ayırın
                                                        </label>
                                                        <textarea
                                                            value={
                                                                optionsEditState[`${index}_az`]?.az !== undefined
                                                                    ? optionsEditState[`${index}_az`].az
                                                                    : (item.options_az ? item.options_az.join(', ') : '')
                                                            }
                                                            onChange={(e) => {
                                                                setOptionsEditState(prev => ({
                                                                    ...prev,
                                                                    [`${index}_az`]: { az: e.target.value }
                                                                }));
                                                            }}
                                                            onBlur={(e) => {
                                                                const value = e.target.value;
                                                                const newChecklist = [...data.condition_checklist];
                                                                newChecklist[index] = {
                                                                    ...item,
                                                                    options_az: value.split(',').map((s: string) => s.trim()).filter((s: string) => s),
                                                                };
                                                                setData('condition_checklist', newChecklist);
                                                                setOptionsEditState(prev => {
                                                                    const newState = { ...prev };
                                                                    delete newState[`${index}_az`];
                                                                    return newState;
                                                                });
                                                            }}
                                                            rows={2}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Mükəmməl, Yaxşı, Orta, Pis"
                                                        />
                                                        {item.options_az && item.options_az.length > 0 && !optionsEditState[`${index}_az`] && (
                                                            <p className="mt-1 text-xs text-green-600">
                                                                ✓ {item.options_az.length} seçim: {item.options_az.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Seçimlər (EN) - comma separated
                                                        </label>
                                                        <textarea
                                                            value={
                                                                optionsEditState[`${index}_en`]?.en !== undefined
                                                                    ? optionsEditState[`${index}_en`].en
                                                                    : (item.options_en ? item.options_en.join(', ') : '')
                                                            }
                                                            onChange={(e) => {
                                                                setOptionsEditState(prev => ({
                                                                    ...prev,
                                                                    [`${index}_en`]: { en: e.target.value }
                                                                }));
                                                            }}
                                                            onBlur={(e) => {
                                                                const value = e.target.value;
                                                                const newChecklist = [...data.condition_checklist];
                                                                newChecklist[index] = {
                                                                    ...item,
                                                                    options_en: value.split(',').map((s: string) => s.trim()).filter((s: string) => s),
                                                                };
                                                                setData('condition_checklist', newChecklist);
                                                                setOptionsEditState(prev => {
                                                                    const newState = { ...prev };
                                                                    delete newState[`${index}_en`];
                                                                    return newState;
                                                                });
                                                            }}
                                                            rows={2}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Perfect, Good, Average, Poor"
                                                        />
                                                        {item.options_en && item.options_en.length > 0 && !optionsEditState[`${index}_en`] && (
                                                            <p className="mt-1 text-xs text-green-600">
                                                                ✓ {item.options_en.length} options: {item.options_en.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {/* Min/Max for Number type */}
                                            {item.type === 'number' && (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Minimum dəyər
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.min || ''}
                                                            onChange={(e) => {
                                                                const newChecklist = [...data.condition_checklist];
                                                                newChecklist[index] = { ...item, min: parseInt(e.target.value) || 0 };
                                                                setData('condition_checklist', newChecklist);
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Maksimum dəyər
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={item.max || ''}
                                                            onChange={(e) => {
                                                                const newChecklist = [...data.condition_checklist];
                                                                newChecklist[index] = { ...item, max: parseInt(e.target.value) || 100 };
                                                                setData('condition_checklist', newChecklist);
                                                            }}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Checkboxes */}
                                        <div className="flex items-center space-x-6 mt-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`required_${index}`}
                                                    checked={item.required || false}
                                                    onChange={(e) => {
                                                        const newChecklist = [...data.condition_checklist];
                                                        newChecklist[index] = { ...item, required: e.target.checked };
                                                        setData('condition_checklist', newChecklist);
                                                    }}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`required_${index}`} className="ml-2 block text-sm text-gray-700">
                                                    Mütləq doldurulmalıdır
                                                </label>
                                            </div>
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`critical_${index}`}
                                                    checked={item.critical || false}
                                                    onChange={(e) => {
                                                        const newChecklist = [...data.condition_checklist];
                                                        newChecklist[index] = { ...item, critical: e.target.checked };
                                                        setData('condition_checklist', newChecklist);
                                                    }}
                                                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`critical_${index}`} className="ml-2 block text-sm text-gray-700">
                                                    Kritik sahə
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {errors.condition_checklist && (
                            <p className="mt-2 text-sm text-red-600">{errors.condition_checklist}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => router.get('/rental-templates')}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                        >
                            <XMarkIcon className="w-4 h-4 mr-2" />
                            Ləğv Et
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 flex items-center disabled:opacity-50"
                        >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            {processing ? 'Saxlanılır...' : 'Saxla'}
                        </button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
