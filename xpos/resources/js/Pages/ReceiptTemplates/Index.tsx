import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Action, Filter } from '@/Components/SharedDataTable';
import { 
    PlusIcon, 
    EyeIcon, 
    PencilIcon, 
    TrashIcon, 
    DocumentDuplicateIcon,
    DocumentTextIcon,
    StarIcon
} from '@heroicons/react/24/outline';

interface ReceiptTemplate {
    template_id: number;
    name: string;
    type: string;
    template_content: string;
    variables: string[] | null;
    paper_size: string;
    width_chars: number;
    is_default: boolean;
    is_active: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    receiptTemplates: {
        data: ReceiptTemplate[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    filters: {
        search?: string;
        type?: string;
        is_active?: string;
    };
}

export default function Index({ receiptTemplates, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');
    const [statusFilter, setStatusFilter] = useState(filters.is_active || '');

    const handleSearch = () => {
        router.get('/receipt-templates', {
            search: searchValue,
            type: typeFilter,
            is_active: statusFilter,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReset = () => {
        setSearchValue('');
        setTypeFilter('');
        setStatusFilter('');
        router.get('/receipt-templates', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDuplicate = (template: ReceiptTemplate) => {
        router.post(`/receipt-templates/${template.template_id}/duplicate`, {}, {
            preserveState: true,
            onSuccess: () => {
                // Success handled by flash message
            }
        });
    };

    const handleDelete = (template: ReceiptTemplate) => {
        if (confirm('Bu qəbz şablonunu silmək istədiyinizdən əminsiniz?')) {
            router.delete(`/receipt-templates/${template.template_id}`, {
                preserveState: true,
            });
        }
    };

    const columns: Column[] = [
        {
            key: 'name',
            label: 'Şablon Adı',
            sortable: true,
            render: (item: ReceiptTemplate) => (
                <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.is_default && (
                            <div className="flex items-center text-xs text-amber-600">
                                <StarIcon className="w-3 h-3 mr-1" />
                                Əsas şablon
                            </div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'type',
            label: 'Növ',
            sortable: true,
            render: (item: ReceiptTemplate) => {
                const typeLabels: Record<string, string> = {
                    'sale': 'Satış Qəbzi',
                    'return': 'Geri Qaytarma',
                    'service': 'Xidmət Qəbzi',
                    'payment': 'Ödəniş Qəbzi'
                };
                return (
                    <span className="text-sm text-gray-900">
                        {typeLabels[item.type] || item.type}
                    </span>
                );
            }
        },
        {
            key: 'paper_size',
            label: 'Kağız Ölçüsü',
            render: (item: ReceiptTemplate) => (
                <span className="text-sm text-gray-600">
                    {item.paper_size}
                </span>
            )
        },
        {
            key: 'width_chars',
            label: 'Layout',
            render: (item: ReceiptTemplate) => (
                <div className="text-xs text-gray-600">
                    <div>{item.width_chars} simvol</div>
                    <div>{item.paper_size}</div>
                </div>
            )
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            render: (item: ReceiptTemplate) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {item.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Yaradılma Tarixi',
            sortable: true,
            render: (item: ReceiptTemplate) => (
                <span className="text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleDateString('az-AZ')}
                </span>
            )
        }
    ];

    const actions: Action[] = [
        {
            label: 'Önizləmə',
            href: (item: ReceiptTemplate) => `/receipt-templates/${item.template_id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Redaktə et',
            href: (item: ReceiptTemplate) => `/receipt-templates/${item.template_id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Kopyala',
            onClick: (item: ReceiptTemplate) => handleDuplicate(item),
            icon: <DocumentDuplicateIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            onClick: (item: ReceiptTemplate) => handleDelete(item),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (item: ReceiptTemplate) => !item.is_default
        }
    ];

    const tableFilters: Filter[] = [
        {
            key: 'type',
            type: 'dropdown',
            label: 'Şablon Növü',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'sale', label: 'Satış Qəbzi' },
                { value: 'return', label: 'Geri Qaytarma' },
                { value: 'service', label: 'Xidmət Qəbzi' },
                { value: 'payment', label: 'Ödəniş Qəbzi' }
            ]
        },
        {
            key: 'is_active',
            type: 'dropdown',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: '1', label: 'Aktiv' },
                { value: '0', label: 'Qeyri-aktiv' }
            ]
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Qəbz Şablonları" />

            <div className="w-full">
                <SharedDataTable
                    data={receiptTemplates}
                    columns={columns}
                    actions={actions}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder="Şablon adı, növ və ya təsvir ilə axtarış..."
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title="Qəbz Şablonları"
                    subtitle="Sistem üçün konfiqurasiya edilmiş qəbz şablonları"
                    createButton={{
                        label: 'Yeni Şablon',
                        href: '/receipt-templates/create'
                    }}
                    emptyState={{
                        title: 'Heç bir qəbz şablonu tapılmadı',
                        description: 'Sistem üçün ilk qəbz şablonunu yaradın.',
                        action: (
                            <a
                                href="/receipt-templates/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                İlk qəbz şablonunu yaradın
                            </a>
                        )
                    }}
                    fullWidth={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}