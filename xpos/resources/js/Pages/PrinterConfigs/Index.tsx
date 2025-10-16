import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable, { Column, Action, Filter } from '@/Components/SharedDataTable';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, PrinterIcon } from '@heroicons/react/24/outline';

interface PrinterConfig {
    id: number;
    name: string;
    printer_type: string;
    ip_address: string;
    port: number;
    paper_size: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
}

interface Props {
    printerConfigs: {
        data: PrinterConfig[];
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
        printer_type?: string;
        is_active?: string;
    };
}

export default function Index({ printerConfigs, filters }: Props) {
    const [searchValue, setSearchValue] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.printer_type || '');
    const [statusFilter, setStatusFilter] = useState(filters.is_active || '');

    const handleSearch = () => {
        router.get('/printer-configs', {
            search: searchValue,
            printer_type: typeFilter,
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
        router.get('/printer-configs', {}, {
            preserveState: true,
            replace: true,
        });
    };

    const handleTestPrint = (printer: PrinterConfig) => {
        router.post(`/printer-configs/${printer.id}/test`, {}, {
            preserveState: true,
            onSuccess: () => {
                // Handle success
            }
        });
    };

    const handleDelete = (printer: PrinterConfig) => {
        if (confirm('Bu printer konfiqurasiyasını silmək istədiyinizə əminsiniz?')) {
            router.delete(`/printer-configs/${printer.id}`, {
                preserveState: true,
            });
        }
    };

    const columns: Column[] = [
        {
            key: 'name',
            label: 'Ad',
            sortable: true,
            render: (item: PrinterConfig) => (
                <div className="flex items-center">
                    <PrinterIcon className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.is_default && (
                            <div className="text-xs text-blue-600">Standart Printer</div>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'printer_type',
            label: 'Növü',
            sortable: true,
            render: (item: PrinterConfig) => (
                <span className="text-sm text-gray-900 capitalize">{item.printer_type}</span>
            )
        },
        {
            key: 'ip_address',
            label: 'IP Ünvanı',
            render: (item: PrinterConfig) => (
                <span className="text-sm text-gray-900 font-mono">{item.ip_address}:{item.port}</span>
            )
        },
        {
            key: 'paper_size',
            label: 'Kağız Ölçüsü',
            render: (item: PrinterConfig) => (
                <span className="text-sm text-gray-900">{item.paper_size}</span>
            )
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (item: PrinterConfig) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {item.is_active ? 'Aktiv' : 'Deaktiv'}
                </span>
            )
        },
        {
            key: 'created_at',
            label: 'Yaradılma Tarixi',
            sortable: true,
            render: (item: PrinterConfig) => (
                <span className="text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleDateString('az-AZ')}
                </span>
            )
        }
    ];

    const actions: Action[] = [
        {
            label: 'Bax',
            href: (item: PrinterConfig) => `/printer-configs/${item.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Redaktə Et',
            href: (item: PrinterConfig) => `/printer-configs/${item.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Test Çap',
            onClick: (item: PrinterConfig) => handleTestPrint(item),
            icon: <PrinterIcon className="w-4 h-4" />,
            variant: 'secondary',
            condition: (item: PrinterConfig) => item.is_active
        },
        {
            label: 'Sil',
            onClick: (item: PrinterConfig) => handleDelete(item),
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (item: PrinterConfig) => !item.is_default
        }
    ];

    const tableFilters: Filter[] = [
        {
            key: 'printer_type',
            type: 'dropdown',
            label: 'Printer Növü',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
                { value: '', label: 'Bütün Növlər' },
                { value: 'thermal', label: 'Termal' },
                { value: 'inkjet', label: 'Mürəkkəb Püskürdən' },
                { value: 'laser', label: 'Lazer' }
            ]
        },
        {
            key: 'is_active',
            type: 'dropdown',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
                { value: '', label: 'Bütün Statuslar' },
                { value: 'true', label: 'Aktiv' },
                { value: 'false', label: 'Deaktiv' }
            ]
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Printer Konfiqurasiyaları" />

            <div className="w-full">
                <SharedDataTable
                    data={printerConfigs}
                    columns={columns}
                    actions={actions}
                    searchValue={searchValue}
                    onSearchChange={setSearchValue}
                    searchPlaceholder="Printer axtarın..."
                    filters={tableFilters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                    title="Printer Konfiqurasiyaları"
                    subtitle="Sistemdə konfiqurasiya edilmiş printerlər"
                    createButton={{
                        label: 'Yeni Printer',
                        href: '/printer-configs/create'
                    }}
                    emptyState={{
                        title: 'Printer konfiqurasiyası tapılmadı',
                        description: 'İlk printer konfiqurasiyasını yaradın',
                        action: (
                            <a
                                href="/printer-configs/create"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                                <PlusIcon className="w-4 h-4 mr-2" />
                                İlk Printer Yarat
                            </a>
                        )
                    }}
                    fullWidth={true}
                />
            </div>
        </AuthenticatedLayout>
    );
}