import {
    UserIcon,
    TruckIcon,
    WrenchScrewdriverIcon,
    BuildingOfficeIcon,
    BuildingOffice2Icon,
    CubeIcon,
    PhoneIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon,
    CalendarIcon,
    TagIcon,
    PrinterIcon,
    DocumentTextIcon,
    DocumentDuplicateIcon,
    StarIcon,
    ExclamationTriangleIcon,
    CurrencyDollarIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    ComputerDesktopIcon,
    MapPinIcon,
    EnvelopeIcon,
    CheckBadgeIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { Column, Filter, Action } from './SharedDataTable';
import { formatQuantityWithUnit } from '@/utils/formatters';
import { formatFullDateTime } from '@/utils/dateFormatters';
import { translatePaymentMethod, getPaymentMethodColor } from '@/utils/enumTranslations';

// Role translations
const roleTranslations: Record<string, string> = {
    'account_owner': 'Hesab sahibi',
    'admin': 'Administrator',
    'branch_manager': 'Filial müdiri',
    'warehouse_manager': 'Anbar müdiri',
    'sales_staff': 'Satış işçisi',
    'cashier': 'Kassir',
    'accountant': 'Mühasib',
    'tailor': 'Usta',
    'support_user': 'Dəstək istifadəçisi',
};
import { Customer, Vehicle, ServiceRecord, Product, Supplier, Employee, Branch, GoodsReceipt } from '@/types';

// Branch Table Configuration
export const branchTableConfig = {
    columns: [
        {
            key: 'name',
            label: 'Filial adı',
            mobileLabel: 'Ad',
            sortable: true,
            render: (branch: Branch) => (
                <div className="flex items-center">
                    <BuildingOffice2Icon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {branch.name}
                        </div>
                        {branch.is_main && (
                            <div className="flex items-center text-xs text-green-600">
                                <CheckBadgeIcon className="w-3 h-3 mr-1" />
                                Əsas filial
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'contact_info',
            label: 'Əlaqə məlumatları',
            mobileLabel: 'Əlaqə',
            hideOnMobile: true,
            render: (branch: Branch) => (
                <div className="text-sm space-y-1">
                    {branch.address && (
                        <div className="flex items-start text-gray-900">
                            <MapPinIcon className="w-4 h-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                            <span className="truncate">{branch.address}</span>
                        </div>
                    )}
                    {branch.phone && (
                        <div className="flex items-center text-gray-900">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="truncate">{branch.phone}</span>
                        </div>
                    )}
                    {branch.email && (
                        <div className="flex items-center text-gray-500">
                            <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="truncate">{branch.email}</span>
                        </div>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'description',
            label: 'Təsvir',
            hideOnMobile: true,
            render: (branch: Branch) => (
                <div className="text-sm text-gray-600 max-w-xs truncate">
                    {branch.description || '-'}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (branch: Branch) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    branch.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                }`}>
                    {branch.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'created_at',
            label: 'Yaradılma tarixi',
            mobileLabel: 'Tarix',
            sortable: true,
            align: 'center',
            hideOnMobile: true,
            render: (branch: Branch) => (
                <div className="text-sm text-gray-900">
                    {branch.created_at ? new Date(branch.created_at).toLocaleDateString('az-AZ') : '-'}
                </div>
            ),
            width: '140px'
        }
    ] as Column[],

    filters: [
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' }
            ],
            className: 'min-w-[120px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Bax',
            href: (branch: Branch) => `/branches/${branch.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Düzəlt',
            href: (branch: Branch) => `/branches/${branch.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (branch: Branch) => !branch.is_main,
            onClick: (branch: Branch) => {
                if (confirm(`"${branch.name}" filialını silmək istədiyinizə əminsiniz?`)) {
                    window.location.href = `/branches/${branch.id}`;
                }
            }
        }
    ] as Action[],

    searchPlaceholder: 'Filial adı, ünvan və ya təsvir ilə axtar...',
    emptyStateTitle: 'Filial tapılmadı',
    emptyStateDescription: 'İlk filialınızı yaratmaqla başlayın.',
    createButtonText: 'Yeni Filial'
};

// Customer Table Configuration
export const customerTableConfig = {
    columns: [
        {
            key: 'name',
            label: 'Müştəri',
            sortable: true,
            render: (customer: Customer) => (
                <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {customer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {customer.customer_type_text}
                        </div>
                        {customer.tax_number && (
                            <div className="text-xs text-gray-400">
                                VÖEN: {customer.tax_number}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'contact',
            label: 'Əlaqə məlumatları',
            render: (customer: Customer) => (
                <div className="text-sm">
                    {customer.phone && (
                        <div className="flex items-center text-gray-900 mb-1">
                            <PhoneIcon className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{customer.formatted_phone}</span>
                        </div>
                    )}
                    {customer.email && (
                        <div className="text-gray-500 truncate">
                            {customer.email}
                        </div>
                    )}
                    {!customer.phone && !customer.email && (
                        <span className="text-gray-500">-</span>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'vehicles_count',
            label: 'Nəqliyyat vasitələri',
            sortable: true,
            align: 'center',
            render: (customer: Customer) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                        {customer.active_vehicles_count || 0} ədəd
                    </div>
                    <div className="text-xs text-gray-500">
                        {customer.total_service_records || 0} servis
                    </div>
                </div>
            ),
            width: '140px'
        },
        {
            key: 'last_service_date',
            label: 'Son servis',
            sortable: true,
            align: 'center',
            render: (customer: Customer) => (
                <div className="text-sm text-gray-900">
                    {customer.last_service_date ? (
                        new Date(customer.last_service_date).toLocaleDateString('az-AZ')
                    ) : (
                        <span className="text-gray-500">Servis yoxdur</span>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (customer: Customer) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {customer.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        }
    ] as Column[],

    filters: [
        {
            key: 'type',
            type: 'dropdown',
            label: 'Müştəri növü',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'individual', label: 'Fiziki şəxs' },
                { value: 'corporate', label: 'Hüquqi şəxs' },
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' },
            ],
            className: 'min-w-[120px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Bax',
            href: (customer: Customer) => `/customers/${customer.id}`,
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Düzəliş',
            href: (customer: Customer) => `/customers/${customer.id}/edit`,
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger'
        }
    ] as Omit<Action, 'onClick'>[]
};

// Vehicle Table Configuration
export const vehicleTableConfig = {
    columns: [
        {
            key: 'vehicle_info',
            label: 'Nəqliyyat vasitəsi',
            sortable: true,
            render: (vehicle: Vehicle) => (
                <div className="flex items-center">
                    <TruckIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {vehicle.formatted_plate}
                        </div>
                        <div className="text-sm text-gray-500">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </div>
                        {vehicle.vin && (
                            <div className="text-xs text-gray-400 truncate">
                                VIN: {vehicle.vin}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'customer',
            label: 'Müştəri',
            render: (vehicle: Vehicle) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {vehicle.customer?.name}
                    </div>
                    {vehicle.customer?.phone && (
                        <div className="text-gray-500">
                            {vehicle.customer.formatted_phone}
                        </div>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'engine_info',
            label: 'Motor məlumatları',
            render: (vehicle: Vehicle) => (
                <div className="text-sm">
                    <div className="text-gray-900">
                        {vehicle.engine_type || '-'}
                    </div>
                    {vehicle.mileage && (
                        <div className="text-gray-500">
                            {vehicle.mileage.toLocaleString('az-AZ')} km
                        </div>
                    )}
                </div>
            ),
            align: 'center',
            width: '140px'
        },
        {
            key: 'last_service_date',
            label: 'Son servis',
            sortable: true,
            align: 'center',
            render: (vehicle: Vehicle) => (
                <div className="text-sm text-gray-900">
                    {vehicle.last_service_date ? (
                        new Date(vehicle.last_service_date).toLocaleDateString('az-AZ')
                    ) : (
                        <span className="text-gray-500">Servis yoxdur</span>
                    )}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (vehicle: Vehicle) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    vehicle.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {vehicle.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        }
    ] as Column[]
};

// Service Records Table Configuration
export const serviceRecordTableConfig = {
    columns: [
        {
            key: 'service_number',
            label: 'Servis №',
            sortable: true,
            render: (service: ServiceRecord) => (
                <div className="flex items-center">
                    <WrenchScrewdriverIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div>
                        <div className="text-sm font-medium text-gray-900">
                            {service.service_number}
                        </div>
                        <div className="text-xs text-gray-500">
                            {new Date(service.service_date).toLocaleDateString('az-AZ')}
                        </div>
                    </div>
                </div>
            ),
            width: '140px'
        },
        {
            key: 'customer_vehicle',
            label: 'Müştəri / Nəqliyyat vasitəsi',
            render: (service: ServiceRecord) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {service.customer?.name}
                    </div>
                    <div className="text-gray-500">
                        {(service as any).customerItem ? `${(service as any).customerItem.display_name} - ${(service as any).customerItem.full_description}` : 'Məhsul yoxdur'}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'description',
            label: 'Təsvir',
            render: (service: ServiceRecord) => (
                <div className="text-sm text-gray-900 max-w-xs truncate">
                    {service.description || '-'}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'total_cost',
            label: 'Ümumi məbləğ',
            sortable: true,
            align: 'right',
            render: (service: ServiceRecord) => (
                <div className="text-sm font-medium text-gray-900">
                    {service.total_cost ? `${service.total_cost.toLocaleString('az-AZ')} ₼` : '-'}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (service: ServiceRecord) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : service.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {service.status_text}
                </span>
            ),
            width: '120px'
        }
    ] as Column[]
};

// Product Table Configuration
export const productTableConfig = {
    columns: [
        {
            key: 'product_info',
            label: 'Məhsul',
            mobileLabel: 'Ad',
            sortable: true,
            render: (product: Product) => (
                <div className="flex items-center">
                    <CubeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            SKU: {product.sku}
                        </div>
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'barcode',
            label: 'Barkod',
            mobileLabel: 'Barkod',
            hideOnMobile: true,
            render: (product: Product) => (
                <div className="text-sm text-gray-900">
                    {product.barcode || '-'}
                </div>
            ),
            width: '140px'
        },
        {
            key: 'category',
            label: 'Kateqoriya',
            mobileLabel: 'Kateqoriya',
            hideOnMobile: true,
            render: (product: Product) => (
                <div className="text-sm">
                    <TagIcon className="w-4 h-4 inline mr-1 text-gray-400" />
                    {product.category?.name || '-'}
                </div>
            ),
            width: '150px'
        },
        {
            key: 'stock_info',
            label: 'Anbar məlumatları',
            mobileLabel: 'Stok',
            align: 'center',
            render: (product: Product) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                        {formatQuantityWithUnit(product.total_stock || 0, product.unit)}
                    </div>
                    <div className="text-xs text-gray-500">
                        {product.warehouses_count || 0} anbar
                    </div>
                </div>
            ),
            width: '140px'
        },
        {
            key: 'pricing',
            label: 'Qiymətlər',
            mobileLabel: 'Qiymət',
            hideOnMobile: true,
            align: 'right',
            render: (product: Product) => (
                <div className="text-sm text-right">
                    <div className="text-gray-900">
                        Satış: {product.sale_price ? `${product.sale_price.toLocaleString('az-AZ')} ₼` : '-'}
                    </div>
                    <div className="text-gray-500">
                        Alış: {product.purchase_price ? `${product.purchase_price.toLocaleString('az-AZ')} ₼` : '-'}
                    </div>
                </div>
            ),
            width: '140px'
        },
    ] as Column[]
};

// Supplier Table Configuration
export const supplierTableConfig = {
    columns: [
        {
            key: 'supplier_info',
            label: 'Təchizatçı',
            mobileLabel: 'Ad',
            sortable: true,
            render: (supplier: Supplier) => (
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {supplier.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {supplier.contact_person}
                        </div>
                        {supplier.tax_number && (
                            <div className="text-xs text-gray-400">
                                VÖEN: {supplier.tax_number}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'contact',
            label: 'Əlaqə məlumatları',
            mobileLabel: 'Əlaqə',
            hideOnMobile: true,
            render: (supplier: Supplier) => (
                <div className="text-sm">
                    {supplier.phone && (
                        <div className="flex items-center text-gray-900 mb-1">
                            <PhoneIcon className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{supplier.formatted_phone}</span>
                        </div>
                    )}
                    {supplier.email && (
                        <div className="text-gray-500 truncate">
                            {supplier.email}
                        </div>
                    )}
                    {!supplier.phone && !supplier.email && (
                        <span className="text-gray-500">-</span>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'products_count',
            label: 'Məhsullar',
            mobileLabel: 'Məhsul',
            sortable: true,
            align: 'center',
            render: (supplier: Supplier) => (
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                        {supplier.active_products_count || 0} ədəd
                    </div>
                </div>
            ),
            width: '100px'
        },
        {
            key: 'payment_terms_days',
            label: 'Ödəniş şərtləri',
            mobileLabel: 'Ödəniş',
            hideOnMobile: true,
            align: 'center',
            render: (supplier: Supplier) => (
                <div className="text-sm text-gray-900">
                    {supplier.payment_terms_days ? `${supplier.payment_terms_days} gün` : '-'}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (supplier: Supplier) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    supplier.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {supplier.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        }
    ] as Column[]
};

// Common filter configurations
export const commonFilters = {
    status: {
        key: 'status',
        type: 'dropdown',
        label: 'Status',
        options: [
            { value: '', label: 'Bütün statuslar' },
            { value: 'active', label: 'Aktiv' },
            { value: 'inactive', label: 'Qeyri-aktiv' },
        ],
        className: 'min-w-[120px]'
    } as Omit<Filter, 'value' | 'onChange'>,

    dateRange: {
        key: 'date_from',
        type: 'date',
        label: 'Başlanğıc tarixi',
        className: 'min-w-[150px]'
    } as Omit<Filter, 'value' | 'onChange'>
};

// Common action configurations
export const commonActions = {
    view: () => ({
        label: 'Bax',
        icon: <EyeIcon className="w-4 h-4" />,
        variant: 'primary'
    } as Omit<Action, 'href' | 'onClick'>),

    edit: () => ({
        label: 'Düzəliş',
        icon: <PencilIcon className="w-4 h-4" />,
        variant: 'secondary'
    } as Omit<Action, 'href' | 'onClick'>),

    delete: {
        label: 'Sil',
        icon: <TrashIcon className="w-4 h-4" />,
        variant: 'danger'
    } as Omit<Action, 'onClick'>
};

// Employee Table Configuration
export const employeeTableConfig = {
    columns: [
        {
            key: 'name',
            label: 'İşçi',
            sortable: true,
            render: (employee: Employee) => (
                <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {employee.position || (employee.role ? roleTranslations[employee.role] || employee.role : '')}
                        </div>
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'contact',
            label: 'Əlaqə məlumatları',
            render: (employee: Employee) => (
                <div className="text-sm">
                    {employee.phone && (
                        <div className="flex items-center text-gray-900 mb-1">
                            <PhoneIcon className="w-4 h-4 mr-1" />
                            {employee.formatted_phone || employee.phone}
                        </div>
                    )}
                    {employee.email && (
                        <div className="text-gray-500 truncate">
                            {employee.email}
                        </div>
                    )}
                </div>
            ),
            className: 'min-w-[200px]'
        },
        {
            key: 'branch',
            label: 'Filial',
            sortable: true,
            render: (employee: Employee) => (
                <div className="flex items-center">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                        {employee.branch?.name || '-'}
                    </span>
                </div>
            ),
            className: 'min-w-[150px]'
        },
        {
            key: 'hire_date',
            label: 'İşə başlama',
            sortable: true,
            render: (employee: Employee) => (
                <div className="flex items-center">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                        {new Date(employee.hire_date).toLocaleDateString('az-AZ')}
                    </span>
                </div>
            ),
            className: 'min-w-[120px]'
        },
        {
            key: 'hourly_rate',
            label: 'Saatlıq məvacib',
            sortable: true,
            render: (employee: Employee) => (
                <div className="text-sm">
                    <span className="font-medium text-gray-900">
                        {employee.hourly_rate ? `${employee.hourly_rate} AZN` : '-'}
                    </span>
                </div>
            ),
            className: 'min-w-[120px]'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            render: (employee: Employee) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    employee.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {employee.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            className: 'min-w-[100px]'
        }
    ] as Column[],

    actions: [
        {
            ...commonActions.view(),
            href: (employee: Employee) => route('employees.show', employee.id)
        },
        {
            ...commonActions.edit(),
            href: (employee: Employee) => route('employees.edit', employee.id)
        },
        {
            ...commonActions.delete,
            onClick: (employee: Employee) => {
                if (confirm('Bu işçini silmək istədiyinizdən əminsiniz?')) {
                    window.location.href = route('employees.destroy', employee.id);
                }
            }
        }
    ] as Action[],

    searchPlaceholder: 'İşçi adı, vəzifə və ya əlaqə məlumatları ilə axtar...',
    emptyStateTitle: 'İşçi tapılmadı',
    emptyStateDescription: 'Axtarış kriteriyalarınıza uyğun işçi tapılmadı.',
    createButtonText: 'İşçi əlavə et'
};

// Printer Config Table Configuration
export const printerConfigTableConfig = {
    columns: [
        {
            key: 'name',
            label: 'Printer Adı',
            sortable: true,
            render: (printerConfig: any) => (
                <div className="flex items-center">
                    <PrinterIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {printerConfig.name}
                        </div>
                        {printerConfig.is_default && (
                            <div className="text-xs text-blue-600">Əsas printer</div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'type',
            label: 'Növ',
            sortable: true,
            render: (printerConfig: any) => (
                <span className="text-sm text-gray-900 capitalize">{printerConfig.type}</span>
            ),
            width: '120px'
        },
        {
            key: 'ip_address',
            label: 'IP Ünvan',
            render: (printerConfig: any) => (
                <span className="text-sm text-gray-900 font-mono">
                    {printerConfig.ip_address}:{printerConfig.port}
                </span>
            ),
            width: '150px'
        },
        {
            key: 'paper_size',
            label: 'Kağız Ölçüsü',
            render: (printerConfig: any) => (
                <span className="text-sm text-gray-900">{printerConfig.paper_size}</span>
            ),
            width: '120px'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (printerConfig: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    printerConfig.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {printerConfig.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'created_at',
            label: 'Yaradılma Tarixi',
            sortable: true,
            render: (printerConfig: any) => (
                <span className="text-sm text-gray-900">
                    {new Date(printerConfig.created_at).toLocaleDateString('az-AZ')}
                </span>
            ),
            width: '140px'
        }
    ] as Column[],

    filters: [
        {
            key: 'type',
            type: 'dropdown',
            label: 'Printer Növü',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'thermal', label: 'Termal' },
                { value: 'inkjet', label: 'Mürekkəb püskürtmə' },
                { value: 'laser', label: 'Lazer' }
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' }
            ],
            className: 'min-w-[120px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Bax',
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Redaktə et',
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Test çap',
            icon: <PrinterIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger'
        }
    ] as Omit<Action, 'href' | 'onClick' | 'condition'>[],

    searchPlaceholder: 'Printer adı, IP ünvan və ya növ ilə axtarış...',
    emptyStateTitle: 'Heç bir printer konfiqurasiyası tapılmadı',
    emptyStateDescription: 'Sistem üçün ilk printer konfiqurasiyasını yaradın.',
    createButtonText: 'Yeni Printer'
};

// Receipt Template Table Configuration
export const receiptTemplateTableConfig = {
    columns: [
        {
            key: 'name',
            label: 'Şablon Adı',
            sortable: true,
            render: (template: any) => (
                <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {template.name}
                        </div>
                        {template.is_default && (
                            <div className="flex items-center text-xs text-amber-600">
                                <StarIcon className="w-3 h-3 mr-1" />
                                Əsas şablon
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'type',
            label: 'Növ',
            sortable: true,
            render: (template: any) => {
                const typeLabels: Record<string, string> = {
                    'sale': 'Satış Qəbzi',
                    'return': 'Geri Qaytarma',
                    'service': 'Xidmət Qəbzi',
                    'payment': 'Ödəniş Qəbzi'
                };
                return (
                    <span className="text-sm text-gray-900">
                        {typeLabels[template.type] || template.type}
                    </span>
                );
            },
            width: '140px'
        },
        {
            key: 'description',
            label: 'Təsvir',
            render: (template: any) => (
                <span className="text-sm text-gray-600 max-w-xs truncate">
                    {template.description || '-'}
                </span>
            ),
            className: 'min-w-0'
        },
        {
            key: 'layout_settings',
            label: 'Layout',
            render: (template: any) => (
                <div className="text-xs text-gray-600">
                    <div>{template.template_data?.layout_settings?.width || '-'}mm</div>
                    <div className="capitalize">
                        {template.template_data?.layout_settings?.font_size || '-'}
                    </div>
                </div>
            ),
            width: '100px'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (template: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {template.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'created_at',
            label: 'Yaradılma Tarixi',
            sortable: true,
            render: (template: any) => (
                <span className="text-sm text-gray-900">
                    {new Date(template.created_at).toLocaleDateString('az-AZ')}
                </span>
            ),
            width: '140px'
        }
    ] as Column[],

    filters: [
        {
            key: 'type',
            type: 'dropdown',
            label: 'Şablon Növü',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'sale', label: 'Satış Qəbzi' },
                { value: 'return', label: 'Geri Qaytarma' },
                { value: 'service', label: 'Xidmət Qəbzi' },
                { value: 'payment', label: 'Ödəniş Qəbzi' }
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' }
            ],
            className: 'min-w-[120px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Önizləmə',
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Redaktə et',
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Kopyala',
            icon: <DocumentDuplicateIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger'
        }
    ] as Omit<Action, 'href' | 'onClick' | 'condition'>[],

    searchPlaceholder: 'Şablon adı, növ və ya təsvir ilə axtarış...',
    emptyStateTitle: 'Heç bir qəbz şablonu tapılmadı',
    emptyStateDescription: 'Sistem üçün ilk qəbz şablonunu yaradın.',
    createButtonText: 'Yeni Şablon'
};

// Alerts Table Configuration
export const alertsTableConfig = {
    columns: [
        {
            key: 'alert_info',
            label: 'Xəbərdarlıq',
            sortable: true,
            render: (alert: any) => (
                <div className="flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {alert.alert_type === 'min_max' ? 'Min/Max Xəbərdarlığı' : 'Mənfi Stok Xəbərdarlığı'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                            {alert.alert_message === 'Product stock is below minimum level'
                                ? 'Məhsul stoku minimum səviyyədən aşağıdır'
                                : alert.alert_message === 'Product stock exceeds maximum level'
                                ? 'Məhsul stoku maksimum səviyyəni aşır'
                                : alert.alert_message}
                        </div>
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'product',
            label: 'Məhsul',
            hideOnMobile: true,
            render: (alert: any) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">
                        {alert.product?.name || '-'}
                    </div>
                    {alert.product?.sku && (
                        <div className="text-gray-500">
                            SKU: {alert.product.sku}
                        </div>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'warehouse',
            label: 'Anbar',
            hideOnMobile: true,
            render: (alert: any) => (
                <div className="text-sm text-gray-900">
                    {alert.warehouse?.name || '-'}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'alert_date',
            label: 'Tarix',
            sortable: true,
            align: 'center',
            hideOnMobile: true,
            render: (alert: any) => (
                <div className="text-sm text-gray-900">
                    {new Date(alert.alert_date).toLocaleDateString('az-AZ')}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (alert: any) => {
                const statusConfig = {
                    active: { color: 'text-red-700 bg-red-50 ring-red-600/20', text: 'Aktiv' },
                    acknowledged: { color: 'text-yellow-700 bg-yellow-50 ring-yellow-600/20', text: 'Qəbul edilib' },
                    resolved: { color: 'text-green-700 bg-green-50 ring-green-600/20', text: 'Həll edilib' }
                };
                const config = statusConfig[alert.status as keyof typeof statusConfig] || statusConfig.active;

                return (
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${config.color}`}>
                        {config.text}
                    </span>
                );
            },
            width: '120px'
        }
    ] as Column[],

    filters: [
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'acknowledged', label: 'Qəbul edilib' },
                { value: 'resolved', label: 'Həll edilib' }
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'alert_type',
            type: 'dropdown',
            label: 'Növ',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'min_max', label: 'Min/Max Xəbərdarlığı' },
                { value: 'negative_stock', label: 'Mənfi Stok Xəbərdarlığı' }
            ],
            className: 'min-w-[150px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Məhsula bax',
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary',
            href: (alert: any) => `/products/${alert.product?.id}`,
            condition: (alert: any) => alert.product?.id
        },
        {
            label: 'Stok əlavə et',
            icon: <PlusIcon className="w-4 h-4" />,
            variant: 'secondary',
            href: (alert: any) => `/goods-receipts/create?product_id=${alert.product?.id}`,
            condition: (alert: any) => alert.product?.id && (alert.alert_type === 'min_max' && alert.alert_message?.includes('minimum'))
        }
    ] as Omit<Action, 'onClick'>[],

    searchPlaceholder: 'Xəbərdarlıqlarda axtar...',
    emptyStateTitle: 'Heç bir xəbərdarlıq tapılmadı',
    emptyStateDescription: 'Hal-hazırda aktiv xəbərdarlıq yoxdur',
    createButtonText: null // No create button for alerts
};

// Stock Movements Table Configuration
export const stockMovementsTableConfig = {
    columns: [
        {
            key: 'product_info',
            label: 'Məhsul',
            sortable: true,
            render: (movement: any) => (
                <div className="flex items-center">
                    <CubeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {movement.product?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            SKU: {movement.product?.sku}
                        </div>
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'warehouse',
            label: 'Anbar',
            render: (movement: any) => (
                <div className="text-sm text-gray-900">
                    {movement.warehouse?.name}
                </div>
            ),
            width: '150px'
        },
        {
            key: 'movement_type',
            label: 'Hərəkət növü',
            sortable: true,
            render: (movement: any) => {
                const getMovementTypeColor = (type: string) => {
                    const colors = {
                        daxil_olma: 'text-green-600 bg-green-100',
                        xaric_olma: 'text-red-600 bg-red-100',
                        transfer: 'text-blue-600 bg-blue-100',
                        qaytarma: 'text-yellow-600 bg-yellow-100',
                        itki_zerer: 'text-gray-600 bg-gray-100',
                    };
                    return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-100';
                };
                const movementTypes: Record<string, string> = {
                    daxil_olma: 'Daxil olma',
                    xaric_olma: 'Xaric olma',
                    transfer: 'Transfer',
                    qaytarma: 'Qaytarma',
                    itki_zerer: 'İtki/Zərər'
                };
                return (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMovementTypeColor(movement.movement_type)}`}>
                        {movementTypes[movement.movement_type] || movement.movement_type}
                    </span>
                );
            },
            width: '140px'
        },
        {
            key: 'quantity',
            label: 'Miqdar',
            sortable: true,
            align: 'center',
            render: (movement: any) => (
                <div className="text-sm font-medium text-gray-900">
                    {movement.quantity}
                </div>
            ),
            width: '100px'
        },
        {
            key: 'unit_cost',
            label: 'Vahid dəyəri',
            align: 'right',
            render: (movement: any) => (
                <div className="text-sm text-gray-900">
                    {movement.unit_cost ? new Intl.NumberFormat('az-AZ', { 
                        style: 'currency', 
                        currency: 'AZN' 
                    }).format(movement.unit_cost) : '-'}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'employee',
            label: 'İşçi',
            render: (movement: any) => (
                <div className="text-sm text-gray-900">
                    {movement.employee?.name || '-'}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'created_at',
            label: 'Tarix',
            sortable: true,
            align: 'center',
            render: (movement: any) => (
                <div className="text-sm text-gray-900">
                    {new Date(movement.created_at).toLocaleDateString('az-AZ')}
                </div>
            ),
            width: '120px'
        }
    ] as Column[],

    filters: [
        {
            key: 'movement_type',
            type: 'dropdown',
            label: 'Hərəkət növü',
            options: [
                { value: '', label: 'Bütün növlər' },
                { value: 'daxil_olma', label: 'Daxil olma' },
                { value: 'xaric_olma', label: 'Xaric olma' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'qaytarma', label: 'Qaytarma' },
                { value: 'itki_zerer', label: 'İtki/Zərər' }
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'date_from',
            type: 'date',
            label: 'Başlanğıc tarixi',
            className: 'min-w-[150px]'
        },
        {
            key: 'date_to',
            type: 'date',
            label: 'Bitmə tarixi',
            className: 'min-w-[150px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Bax',
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger'
        }
    ] as Omit<Action, 'href' | 'onClick'>[],

    searchPlaceholder: 'Stok hərəkətlərində axtar...',
    emptyStateTitle: 'Stok hərəkəti tapılmadı',
    emptyStateDescription: 'İlk hərəkəti yaratmaqla başlayın',
    createButtonText: 'Yeni hərəkət'
};

// Expense Table Configuration
export const expenseTableConfig = {
    columns: [
        {
            key: 'expense_info',
            label: 'Xərc məlumatları',
            sortable: true,
            render: (expense: any) => (
                <div className="flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {expense.description}
                        </div>
                        <div className="text-sm text-gray-500">
                            {expense.reference_number}
                        </div>
                        {expense.category && (
                            <div className="text-xs text-blue-600">
                                {expense.category.name}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'amount',
            label: 'Məbləğ',
            sortable: true,
            align: 'right',
            render: (expense: any) => (
                <div className="text-sm font-medium text-gray-900">
                    {expense.amount.toLocaleString('az-AZ')} ₼
                </div>
            ),
            width: '120px'
        },
        {
            key: 'expense_date',
            label: 'Tarix',
            sortable: true,
            render: (expense: any) => (
                <div className="flex items-center text-sm text-gray-900">
                    <CalendarIcon className="w-4 h-4 text-gray-400 mr-2" />
                    {new Date(expense.expense_date).toLocaleDateString('az-AZ')}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'payment_method',
            label: 'Ödəniş üsulu',
            align: 'center',
            render: (expense: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getPaymentMethodColor(expense.payment_method)
                }`}>
                    {translatePaymentMethod(expense.payment_method)}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'branch',
            label: 'Filial',
            render: (expense: any) => (
                <div className="flex items-center text-sm text-gray-900">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400 mr-2" />
                    {expense.branch?.name || '-'}
                </div>
            ),
            width: '120px'
        },
        {
            key: 'receipt',
            label: 'Qaimə',
            align: 'center',
            render: (expense: any) => (
                expense.receipt_file_path ? (
                    <DocumentTextIcon className="w-5 h-5 text-green-600" />
                ) : (
                    <span className="text-gray-400">-</span>
                )
            ),
            width: '80px'
        }
    ] as Column[],
    
    searchKey: 'search',
    searchPlaceholder: 'Təsvir, nömrə və ya kateqoriya ilə axtar...',
    emptyStateTitle: 'Heç bir xərc tapılmadı',
    emptyStateDescription: 'İlk xərcinizi əlavə etməklə başlayın.',
    createButtonText: 'Xərc əlavə et'
};

// Expense Category Table Configuration
export const expenseCategoryTableConfig = {
    columns: [
        {
            key: 'category_info',
            label: 'Kateqoriya',
            sortable: true,
            render: (category: any) => (
                <div className="flex items-center">
                    <ClipboardDocumentListIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {category.name}
                        </div>
                        {category.parent && (
                            <div className="text-sm text-gray-500">
                                {category.parent.name}
                            </div>
                        )}
                        {category.description && (
                            <div className="text-xs text-gray-400 truncate">
                                {category.description}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'type',
            label: 'Növ',
            sortable: true,
            align: 'center',
            render: (category: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.type === 'maaş' 
                        ? 'bg-blue-100 text-blue-800' 
                        : category.type === 'kommunal'
                        ? 'bg-yellow-100 text-yellow-800'
                        : category.type === 'nəqliyyat'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {category.type === 'maaş' ? 'Maaş' :
                     category.type === 'xərclər' ? 'Xərclər' :
                     category.type === 'ödənişlər' ? 'Ödənişlər' :
                     category.type === 'kommunal' ? 'Kommunal' :
                     category.type === 'nəqliyyat' ? 'Nəqliyyat' : 'Digər'}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'expense_count',
            label: 'Xərc sayı',
            align: 'center',
            render: (category: any) => (
                <div className="text-sm text-gray-900">
                    {category.expenses?.length || 0}
                </div>
            ),
            width: '100px'
        },
        {
            key: 'is_active',
            label: 'Status',
            align: 'center',
            render: (category: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {category.is_active ? 'Aktiv' : 'Deaktiv'}
                </span>
            ),
            width: '100px'
        }
    ] as Column[],
    
    searchKey: 'search',
    searchPlaceholder: 'Kateqoriya adı və ya təsvir ilə axtar...',
    emptyStateTitle: 'Heç bir kateqoriya tapılmadı',
    emptyStateDescription: 'İlk kateqoriyanızı əlavə etməklə başlayın.',
    createButtonText: 'Kateqoriya əlavə et'
};

// Supplier Payment Table Configuration
export const supplierPaymentTableConfig = {
    columns: [
        {
            key: 'payment_info',
            label: 'Ödəniş Məlumatları',
            sortable: true,
            render: (payment: any) => (
                <div className="flex items-center">
                    <TruckIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                            {payment.reference_number}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                            {payment.supplier?.name}
                        </div>
                    </div>
                </div>
            ),
            width: '280px'
        },
        {
            key: 'amount',
            label: 'Məbləğ',
            align: 'right',
            sortable: true,
            render: (payment: any) => (
                <div className="text-right">
                    <div className="font-medium text-gray-900">
                        {payment.amount.toLocaleString('az-AZ')} ₼
                    </div>
                </div>
            ),
            width: '120px'
        },
        {
            key: 'payment_method',
            label: 'Ödəniş Üsulu',
            align: 'center',
            render: (payment: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    getPaymentMethodColor(payment.payment_method)
                }`}>
                    {translatePaymentMethod(payment.payment_method)}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'payment_date',
            label: 'Tarix',
            align: 'center',
            sortable: true,
            render: (payment: any) => (
                <div className="text-sm text-gray-900">
                    {new Date(payment.payment_date).toLocaleDateString('az-AZ')}
                </div>
            ),
            width: '100px'
        },
        {
            key: 'description',
            label: 'Açıqlama',
            render: (payment: any) => (
                <div className="text-sm text-gray-500 truncate max-w-xs">
                    {payment.description}
                </div>
            ),
            width: '200px'
        }
    ] as Column[],
    searchPlaceholder: 'Təchizatçı, açıqlama və ya məlumat nömrəsi axtar...',
    emptyStateTitle: 'Heç bir ödəniş tapılmadı',
    emptyStateDescription: 'İlk təchizatçı ödənişinizi əlavə etməklə başlayın.',
    createButtonText: 'Ödəniş əlavə et'
};

// Employee Salary Table Configuration
export const employeeSalaryTableConfig = {
    columns: [
        {
            key: 'employee_name',
            label: 'İşçi',
            sortable: true,
            render: (salary: any) => (
                <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                            {salary.employee_name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {salary.salary_month ? new Date(salary.salary_month + '-01').toLocaleDateString('az-AZ', { year: 'numeric', month: 'long' }) : '-'}
                        </div>
                    </div>
                </div>
            ),
            width: '280px'
        },
        {
            key: 'base_salary',
            label: 'Əsas məbləğ',
            align: 'right',
            sortable: true,
            render: (salary: any) => (
                <div className="text-right">
                    <div className="font-medium text-gray-900">
                        {(salary.base_salary || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼
                    </div>
                    {((salary.bonuses || 0) > 0 || (salary.deductions || 0) > 0) && (
                        <div className="text-xs text-gray-500">
                            {(salary.bonuses || 0) > 0 && `+${(salary.bonuses || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`}
                            {(salary.deductions || 0) > 0 && ` -${(salary.deductions || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`}
                        </div>
                    )}
                </div>
            ),
            width: '150px'
        },
        {
            key: 'net_salary',
            label: 'Xalis məbləğ',
            align: 'right',
            render: (salary: any) => (
                <div className="text-right font-semibold text-gray-900">
                    {(salary.net_salary || 0).toLocaleString('az-AZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼
                </div>
            ),
            width: '120px'
        },
        {
            key: 'paid',
            label: 'Status',
            align: 'center',
            render: (salary: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    salary.paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {salary.paid ? 'Ödənilib' : 'Ödənilməmiş'}
                </span>
            ),
            width: '120px'
        },
        {
            key: 'paid_date',
            label: 'Ödəniş tarixi',
            align: 'center',
            render: (salary: any) => (
                <div className="text-sm text-gray-900">
                    {salary.paid_date
                        ? new Date(salary.paid_date).toLocaleDateString('az-AZ')
                        : '-'
                    }
                </div>
            ),
            width: '120px'
        }
    ] as Column[],
    searchPlaceholder: 'İşçi adı axtar...',
    emptyStateTitle: 'Heç bir maaş qeydiyyatı tapılmadı',
    emptyStateDescription: 'İlk maaş qeydiyyatınızı əlavə etməklə başlayın.',
    createButtonText: 'Maaş əlavə et'
};

// Reports Table Configuration
export const reportsTableConfig = {
    columns: [
        {
            key: 'type',
            label: 'Hesabat Növü',
            sortable: true,
            render: (report: any) => (
                <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {report.name}
                        </div>
                        <div className="text-sm text-gray-500">
                            {report.type_description}
                        </div>
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'period',
            label: 'Dövr',
            sortable: true,
            render: (report: any) => (
                <div className="text-sm text-gray-900">
                    {report.date_from} - {report.date_to}
                </div>
            ),
            width: '200px'
        },
        {
            key: 'generated_at',
            label: 'Yaradılma Tarixi',
            sortable: true,
            render: (report: any) => (
                <div className="text-sm text-gray-900">
                    {formatFullDateTime(report.generated_at)}
                </div>
            ),
            width: '150px'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (report: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.status === 'completed' ? 'bg-green-100 text-green-800' :
                    report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                }`}>
                    {report.status === 'completed' ? 'Hazır' :
                     report.status === 'processing' ? 'İşlənir' : 'Gözləyir'}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'format',
            label: 'Format',
            align: 'center',
            render: (report: any) => (
                <div className="flex items-center justify-center">
                    {report.format === 'pdf' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            <DocumentTextIcon className="w-3 h-3 mr-1" />
                            PDF
                        </span>
                    )}
                    {report.format === 'excel' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            <DocumentTextIcon className="w-3 h-3 mr-1" />
                            Excel
                        </span>
                    )}
                    {report.format === 'table' && (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <ClipboardDocumentListIcon className="w-3 h-3 mr-1" />
                            Cədvəl
                        </span>
                    )}
                </div>
            ),
            width: '100px'
        }
    ] as Column[],
    searchPlaceholder: 'Hesabat axtar...',
    emptyStateTitle: 'Heç bir hesabat tapılmadı',
    emptyStateDescription: 'İlk hesabatınızı yaratmaq üçün yuxarıdakı formu istifadə edin.',
    createButtonText: 'Hesabat Yarat'
};

// Audit Logs Table Configuration
export const auditLogTableConfig = {
    columns: [
        {
            key: 'action',
            label: 'Hadisə',
            sortable: true,
            render: (auditLog: any) => {
                const getActionColor = (action: string) => {
                    switch (action) {
                        case 'created': return 'bg-green-100 text-green-800';
                        case 'updated': return 'bg-blue-100 text-blue-800';
                        case 'deleted': return 'bg-red-100 text-red-800';
                        case 'viewed': return 'bg-gray-100 text-gray-800';
                        case 'exported': return 'bg-purple-100 text-purple-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };

                return (
                    <div className="flex items-center">
                        <ClockIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div>
                            <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(auditLog.action)}`}>
                                {auditLog.action}
                            </span>
                        </div>
                    </div>
                );
            },
            width: '140px'
        },
        {
            key: 'model_type',
            label: 'Model',
            sortable: true,
            render: (auditLog: any) => {
                const modelName = auditLog.model_type || 'Naməlum';

                return (
                    <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                                {modelName}
                            </div>
                            {auditLog.model_id && (
                                <div className="text-xs text-gray-500">
                                    ID: {auditLog.model_id}
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
            className: 'min-w-0'
        },
        {
            key: 'description',
            label: 'Təsvir',
            hideOnMobile: true,
            render: (auditLog: any) => (
                <div className="text-sm text-gray-900">
                    {auditLog.description || '-'}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'user',
            label: 'İstifadəçi',
            sortable: true,
            hideOnMobile: true,
            render: (auditLog: any) => (
                <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {auditLog.user?.name || 'Sistem'}
                        </div>
                        {auditLog.ip_address && (
                            <div className="text-xs text-gray-500 flex items-center">
                                <ComputerDesktopIcon className="w-3 h-3 mr-1" />
                                {auditLog.ip_address}
                            </div>
                        )}
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'created_at',
            label: 'Tarix',
            sortable: true,
            align: 'center' as const,
            hideOnMobile: true,
            render: (auditLog: any) => (
                <div className="text-sm text-gray-900">
                    {new Date(auditLog.created_at).toLocaleString('az-AZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            ),
            width: '160px'
        }
    ],
    actions: [
        {
            label: 'Bax',
            href: (auditLog: any) => `/audit-logs/${auditLog.log_id}`,
            className: 'text-slate-600 hover:text-slate-900',
            variant: 'view' as const
        }
    ]
};

// Users Table Configuration
export const usersTableConfig = {
    columns: [
        {
            key: 'user_info',
            label: 'İstifadəçi',
            sortable: true,
            render: (user: any) => (
                <div className="flex items-center">
                    <UserIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                            {user.name} {user.is_current_user && '(Siz)'}
                        </div>
                        <div className="text-sm text-gray-500">
                            ID: {user.id}
                        </div>
                    </div>
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'contact',
            label: 'Email / Telefon',
            render: (user: any) => (
                <div className="text-sm">
                    <div className="text-gray-900">{user.email}</div>
                    {user.phone && (
                        <div className="text-gray-500">{user.phone}</div>
                    )}
                </div>
            ),
            className: 'min-w-0'
        },
        {
            key: 'role',
            label: 'Rol',
            sortable: true,
            render: (user: any) => {
                const getRoleColor = (role: string) => {
                    switch (role) {
                        case 'account_owner': return 'bg-purple-100 text-purple-800';
                        case 'admin': return 'bg-blue-100 text-blue-800';
                        case 'accountant': return 'bg-yellow-100 text-yellow-800';
                        case 'branch_manager': return 'bg-green-100 text-green-800';
                        case 'warehouse_manager': return 'bg-indigo-100 text-indigo-800';
                        case 'sales_staff': return 'bg-green-100 text-green-800';
                        case 'mechanic': return 'bg-orange-100 text-orange-800';
                        case 'cashier': return 'bg-cyan-100 text-cyan-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                
                const getRoleText = (role: string) => {
                    const roles: {[key: string]: string} = {
                        'account_owner': 'Hesab sahibi',
                        'admin': 'Administrator',
                        'branch_manager': 'Filial müdiri',
                        'warehouse_manager': 'Anbar müdiri',
                        'sales_staff': 'Satış işçisi',
                        'mechanic': 'Mexanik',
                        'cashier': 'Kassir',
                        'accountant': 'Mühasib',
                        'tailor': 'Usta',
                    };
                    return roles[role] || role;
                };
                
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {getRoleText(user.role)}
                    </span>
                );
            },
            width: '150px'
        },
        {
            key: 'status',
            label: 'Status',
            sortable: true,
            align: 'center',
            render: (user: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {user.status === 'active' ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            width: '100px'
        },
        {
            key: 'last_login_at',
            label: 'Son giriş',
            sortable: true,
            align: 'center',
            render: (user: any) => (
                <div className="text-sm text-gray-900">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('az-AZ') : 'Heç vaxt'}
                </div>
            ),
            width: '120px'
        }
    ] as Column[],

    filters: [
        {
            key: 'role',
            type: 'dropdown',
            label: 'Rol',
            options: [
                { value: '', label: 'Bütün rollar' },
                { value: 'admin', label: 'Administrator' },
                { value: 'branch_manager', label: 'Filial Müdiri' },
                { value: 'warehouse_manager', label: 'Anbar Müdiri' },
                { value: 'sales_staff', label: 'Satış İşçisi' },
                { value: 'mechanic', label: 'Mexanik' },
                { value: 'cashier', label: 'Kassir' },
                { value: 'accountant', label: 'Mühasib' }
            ],
            className: 'min-w-[150px]'
        },
        {
            key: 'status',
            type: 'dropdown',
            label: 'Status',
            options: [
                { value: '', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'inactive', label: 'Qeyri-aktiv' }
            ],
            className: 'min-w-[120px]'
        }
    ] as Omit<Filter, 'value' | 'onChange'>[],

    actions: [
        {
            label: 'Bax',
            href: (user: any) => route('users.show', user.id),
            icon: <EyeIcon className="w-4 h-4" />,
            variant: 'primary'
        },
        {
            label: 'Düzəliş',
            href: (user: any) => route('users.edit', user.id),
            icon: <PencilIcon className="w-4 h-4" />,
            variant: 'secondary'
        },
        {
            label: 'Sil',
            icon: <TrashIcon className="w-4 h-4" />,
            variant: 'danger',
            condition: (user: any) => user.role !== 'account_owner' && !user.is_current_user,
            onClick: (user: any) => {
                if (confirm('Bu istifadəçini silmək istədiyinizdən əminsiniz?')) {
                    // This will be handled by the parent component
                    window.location.href = route('users.show', user.id);
                }
            }
        }
    ] as Action[],

    searchPlaceholder: 'İstifadəçi axtar (ad, email, telefon...)...',
    emptyStateTitle: 'İstifadəçi tapılmadı',
    emptyStateDescription: 'İlk istifadəçinizi əlavə etməklə başlayın.',
    createButtonText: 'İstifadəçi əlavə et'
};

// Central tableConfig export
export const tableConfig = {
    branches: branchTableConfig,
    customers: customerTableConfig,
    vehicles: vehicleTableConfig,
    serviceRecords: serviceRecordTableConfig,
    products: productTableConfig,
    suppliers: supplierTableConfig,
    employees: employeeTableConfig,
    users: usersTableConfig,
    printerConfigs: printerConfigTableConfig,
    receiptTemplates: receiptTemplateTableConfig,
    alerts: alertsTableConfig,
    stockMovements: stockMovementsTableConfig,
    expenses: expenseTableConfig,
    expenseCategories: expenseCategoryTableConfig,
    supplierPayments: supplierPaymentTableConfig,
    employeeSalaries: employeeSalaryTableConfig,
    reports: reportsTableConfig,
    auditLogs: auditLogTableConfig
};

// Goods Receipts Table Configuration
export const goodsReceiptsTableConfig = {
    columns: [
        {
            key: 'receipt_number',
            label: 'Qəbul №',
            sortable: true,
            width: '160px',
            render: (r: GoodsReceipt) => (
                <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900 font-mono">{r.receipt_number}</div>
                    {r.invoice_number && (
                        <div className="text-xs text-green-600 truncate" title={`Invoice: ${r.invoice_number}`}>
                            📄 {r.invoice_number}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'items',
            label: 'Məhsullar',
            width: '280px',
            render: (r: GoodsReceipt) => {
                const itemCount = r.items?.length || 0;
                if (itemCount === 0) {
                    // Fallback for legacy single-product receipts
                    return (
                        <div className="flex items-center min-w-0">
                            <CubeIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 truncate" title={r.product?.name}>
                                    {r.product?.name || 'Məhsul silinib'}
                                </div>
                                {r.product?.sku && (
                                    <div className="text-xs text-gray-500 truncate" title={`SKU: ${r.product.sku}`}>
                                        SKU: {r.product.sku}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                // Show first product + count of others
                const firstItem = r.items?.[0];
                return (
                    <div className="flex items-center min-w-0">
                        <CubeIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate" title={firstItem?.product?.name}>
                                {firstItem?.product?.name}
                                {itemCount > 1 && <span className="ml-1 text-xs text-gray-500">+{itemCount - 1} daha</span>}
                            </div>
                            <div className="text-xs text-gray-500">
                                {itemCount} məhsul
                            </div>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'supplier',
            label: 'Təchizatçı',
            width: '180px',
            render: (r: GoodsReceipt) => (
                <div className="text-sm text-gray-900 truncate" title={r.supplier?.name}>
                    {r.supplier?.name || '-'}
                </div>
            )
        },
        {
            key: 'warehouse',
            label: 'Anbar',
            width: '150px',
            render: (r: GoodsReceipt) => (
                <div className="text-sm text-gray-900 truncate" title={r.warehouse?.name}>
                    {r.warehouse?.name || '-'}
                </div>
            )
        },
        {
            key: 'items_count',
            label: 'Məhsul sayı',
            width: '120px',
            align: 'center',
            render: (r: GoodsReceipt) => {
                const itemCount = r.items?.length || 1;
                return (
                    <div className="text-sm font-medium text-gray-900">
                        {itemCount} məhsul
                    </div>
                );
            }
        },
        {
            key: 'total_cost',
            label: 'Cəmi',
            width: '130px',
            align: 'right',
            render: (r: GoodsReceipt) => {
                // total_cost now stores the final amount (after discount if any)
                const totalCost = r.total_cost ? parseFloat(String(r.total_cost)) : 0;

                return (
                    <div className="text-sm font-semibold text-gray-900">
                        {totalCost ? `${totalCost.toFixed(2)} AZN` : '-'}
                    </div>
                );
            }
        },
        {
            key: 'payment_status',
            label: 'Ödəmə Status',
            width: '140px',
            align: 'center',
            render: (r: GoodsReceipt) => {
                const getPaymentStatusBadge = (status: string) => {
                    const statusConfig = {
                        paid: { label: 'Ödənilib', className: 'bg-green-100 text-green-800' },
                        unpaid: { label: 'Ödənilməyib', className: 'bg-red-100 text-red-800' },
                        partial: { label: 'Qismən', className: 'bg-yellow-100 text-yellow-800' }
                    } as const;
                    
                    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
                    return (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
                            {config.label}
                        </span>
                    );
                };
                
                return getPaymentStatusBadge(r.payment_status || 'unpaid');
            }
        },
        {
            key: 'due_date',
            label: 'Son Tarix',
            width: '110px',
            align: 'center',
            render: (r: GoodsReceipt) => {
                if (r.payment_status === 'unpaid' && r.due_date) {
                    const dueDate = new Date(r.due_date);
                    const isOverdue = dueDate < new Date();
                    return (
                        <div className={`text-sm font-medium ${
                            isOverdue ? 'text-red-600' : 'text-orange-600'
                        }`}>
                            {dueDate.toLocaleDateString('az-AZ')}
                        </div>
                    );
                }
                return <div className="text-sm text-gray-400">-</div>;
            }
        },
        {
            key: 'created_at',
            label: 'Tarix',
            sortable: true,
            width: '110px',
            align: 'center',
            render: (r: GoodsReceipt) => (
                <div className="text-sm text-gray-900">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('az-AZ') : '-'}
                </div>
            )
        }
    ] as Column[],

    actions: [
        {
            ...commonActions.view(),
            href: (r: GoodsReceipt) => route('goods-receipts.show', r.id)
        },
        {
            label: 'Ödə',
            variant: 'primary',
            condition: (r: GoodsReceipt) => r.payment_status === 'unpaid' || r.payment_status === 'partial',
            onClick: (r: GoodsReceipt) => {
                // Handler will be provided by the parent component
                console.log('Payment modal should open for:', r.receipt_number);
            }
        },
        {
            ...commonActions.delete,
            onClick: (r: GoodsReceipt) => {
                // Handler will be provided by the parent component
                console.log('Delete should be handled by parent:', r.receipt_number);
            }
        }
    ] as Action[],

    searchPlaceholder: 'Qəbul axtar...'
};

// Product Stock Table Configuration
export const productStockTableConfig = {
    columns: [
        {
            key: 'product',
            label: 'Məhsul',
            sortable: true,
            render: (s: any) => (
                <div className="flex items-center">
                    <CubeIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{s.product?.name}</div>
                        <div className="text-xs text-gray-500">{s.product?.sku}</div>
                    </div>
                </div>
            )
        },
        {
            key: 'warehouse',
            label: 'Anbar',
            render: (s: any) => (
                <div className="text-sm text-gray-900">{s.warehouse?.name}</div>
            )
        },
        {
            key: 'quantity',
            label: 'Miqdar',
            sortable: true,
            render: (s: any) => (
                <div className="text-sm">
                    <div className="font-medium text-gray-900">{s.quantity} {s.product?.unit}</div>
                    <div className="text-xs text-gray-500">Sərbəst: {Math.max(0, (s.available_quantity ?? (s.quantity - (s.reserved_quantity || 0))))}</div>
                </div>
            )
        },
        {
            key: 'min_level',
            label: 'Min. Miqdar',
            render: (s: any) => <span className="text-sm text-gray-900">{s.min_level ?? '-'}</span>,
            align: 'center'
        },
        {
            key: 'max_level',
            label: 'Max. Miqdar',
            render: (s: any) => <span className="text-sm text-gray-900">{s.max_level ?? '-'}</span>,
            align: 'center'
        },
        {
            key: 'total_value',
            label: 'Ümumi Dəyər',
            render: (s: any) => {
                const price = s.product?.purchase_price || s.product?.latest_price?.purchase_price;
                return <span className="text-sm font-semibold text-gray-900">{price ? `${(s.quantity * price).toFixed(2)} AZN` : '-'}</span>;
            },
            align: 'right'
        }
    ] as Column[],

    actions: [
        {
            label: 'Düzəliş et',
            variant: 'secondary',
            href: (s: any) => route('product-stock.edit', s.id)
        },
        {
            label: 'Tarixçə',
            variant: 'view',
            href: (s: any) => route('stock-movements.index', { product_id: s.product_id, warehouse_id: s.warehouse_id })
        }
    ] as Action[],

    searchPlaceholder: 'Məhsul axtar...'
};

// Warehouses Table Configuration
export const warehouseTableConfig = {
    columns: [
        {
            key: 'name',
            label: 'Anbar',
            sortable: true,
            render: (w: any) => (
                <div className="text-sm font-medium text-gray-900">{w.name}</div>
            )
        },
        {
            key: 'type',
            label: 'Növ',
            render: (w: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    w.type === 'main' ? 'bg-blue-100 text-blue-800' : w.type === 'mobile' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                    {w.type === 'main' ? 'Əsas' : w.type === 'mobile' ? 'Mobil' : 'Köməkçi'}
                </span>
            ),
            align: 'center',
            width: '120px'
        },
        {
            key: 'location',
            label: 'Ünvan',
            render: (w: any) => (
                <div className="text-sm text-gray-900 truncate max-w-xs">{w.location || '-'}</div>
            )
        },
        {
            key: 'is_active',
            label: 'Status',
            sortable: true,
            render: (w: any) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    w.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                    {w.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
                </span>
            ),
            align: 'center',
            width: '110px'
        },
        {
            key: 'created_at',
            label: 'Yaradılma',
            sortable: true,
            render: (w: any) => (
                <div className="text-sm text-gray-900">{w.created_at ? new Date(w.created_at).toLocaleDateString('az-AZ') : '-'}</div>
            ),
            align: 'center',
            width: '120px'
        }
    ] as Column[],

    actions: [
        {
            ...commonActions.view(),
            href: (w: any) => route('warehouses.show', w.id)
        },
        {
            ...commonActions.edit(),
            href: (w: any) => route('warehouses.edit', w.id)
        },
        {
            ...commonActions.delete,
            onClick: (w: any) => {
                if (confirm('Bu anbarı silmək istədiyinizdən əminsiniz?')) {
                    window.location.href = route('warehouses.destroy', w.id);
                }
            }
        }
    ] as Action[],

    searchPlaceholder: 'Anbar axtar...'
};

// Report View Configurations
export const reportViewConfig = {
    sales: {
        columns: [
            {
                key: 'sale_number',
                label: 'Satış Nömrəsi',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm font-medium text-gray-900">{item.sale_number}</div>
                )
            },
            {
                key: 'customer_name',
                label: 'Müştəri',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.customer_name}</div>
                )
            },
            {
                key: 'sale_date',
                label: 'Tarix',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">
                        {new Date(item.sale_date).toLocaleDateString('az-AZ')}
                    </div>
                )
            },
            {
                key: 'products',
                label: 'Məhsullar',
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    const formatNumber = (num: number) => new Intl.NumberFormat('az-AZ').format(num);

                    if (!item.products?.length) {
                        return <span className="text-gray-400 italic text-sm">Məhsul məlumatı yoxdur</span>;
                    }
                    return (
                        <div className="space-y-1">
                            {item.products.map((product: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                                        {product.sku && <div className="text-xs text-gray-500">SKU: {product.sku}</div>}
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm">
                                        <span className="text-gray-600">{formatNumber(product.quantity)} ədəd</span>
                                        <span className="text-gray-600">{formatCurrency(product.unit_price)}</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(product.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }
            },
            {
                key: 'total',
                label: 'Cəmi',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total)}</div>;
                }
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.status}</div>
                )
            }
        ] as Column[]
    },

    inventory: {
        columns: [
            {
                key: 'name',
                label: 'Məhsul',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                )
            },
            {
                key: 'sku',
                label: 'SKU',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.sku}</div>
                )
            },
            {
                key: 'category',
                label: 'Kateqoriya',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.category}</div>
                )
            },
            {
                key: 'current_stock',
                label: 'Stok',
                sortable: true,
                render: (item: any) => {
                    const formatNumber = (num: number) => new Intl.NumberFormat('az-AZ').format(num);
                    return <div className="text-sm font-medium text-gray-900">{formatNumber(item.current_stock)}</div>;
                }
            },
            {
                key: 'min_level',
                label: 'Min Səviyyə',
                sortable: true,
                render: (item: any) => {
                    const formatNumber = (num: number) => new Intl.NumberFormat('az-AZ').format(num);
                    return <div className="text-sm text-gray-700">{formatNumber(item.min_level)}</div>;
                }
            },
            {
                key: 'purchase_price',
                label: 'Alış Qiyməti',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm text-gray-700">{formatCurrency(item.purchase_price)}</div>;
                }
            },
            {
                key: 'sale_price',
                label: 'Satış Qiyməti',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm text-gray-700">{formatCurrency(item.sale_price)}</div>;
                }
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (item: any) => {
                    const badges: { [key: string]: { label: string; className: string } } = {
                        'out_of_stock': { label: 'Tükənmiş', className: 'bg-red-100 text-red-800' },
                        'low_stock': { label: 'Az Stok', className: 'bg-yellow-100 text-yellow-800' },
                        'in_stock': { label: 'Kifayət', className: 'bg-green-100 text-green-800' }
                    };
                    const badge = badges[item.status] || badges.in_stock;
                    return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
                            {badge.label}
                        </span>
                    );
                }
            }
        ] as Column[]
    },

    financial: {
        columns: [
            {
                key: 'date',
                label: 'Tarix',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm font-medium text-gray-900">
                        {new Date(item.date).toLocaleDateString('az-AZ')}
                    </div>
                )
            },
            {
                key: 'revenue',
                label: 'Gəlir',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm text-green-600">{formatCurrency(item.revenue)}</div>;
                }
            },
            {
                key: 'expenses',
                label: 'Xərclər',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm text-red-600">{formatCurrency(item.expenses)}</div>;
                }
            },
            {
                key: 'profit',
                label: 'Mənfəət',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm font-medium text-gray-900">{formatCurrency(item.profit)}</div>;
                }
            }
        ] as Column[]
    },

    customer: {
        columns: [
            {
                key: 'name',
                label: 'Müştəri',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                )
            },
            {
                key: 'email',
                label: 'Email',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.email || '-'}</div>
                )
            },
            {
                key: 'phone',
                label: 'Telefon',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.phone || '-'}</div>
                )
            },
            {
                key: 'total_purchases',
                label: 'Alış Sayı',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.total_purchases}</div>
                )
            },
            {
                key: 'total_spent',
                label: 'Cəmi Məbləğ',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total_spent)}</div>;
                }
            },
            {
                key: 'last_purchase',
                label: 'Son Alış',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">
                        {item.last_purchase ? new Date(item.last_purchase).toLocaleDateString('az-AZ') : '-'}
                    </div>
                )
            }
        ] as Column[]
    },

    service: {
        columns: [
            {
                key: 'service_number',
                label: 'Servis Nömrəsi',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm font-medium text-gray-900">{item.service_number}</div>
                )
            },
            {
                key: 'customer_name',
                label: 'Müştəri',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.customer_name}</div>
                )
            },
            {
                key: 'vehicle_info',
                label: 'Avtomobil',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.vehicle_info}</div>
                )
            },
            {
                key: 'service_date',
                label: 'Tarix',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">
                        {new Date(item.service_date).toLocaleDateString('az-AZ')}
                    </div>
                )
            },
            {
                key: 'total_cost',
                label: 'Dəyər',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total_cost)}</div>;
                }
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.status}</div>
                )
            }
        ] as Column[]
    },

    rental: {
        columns: [
            {
                key: 'rental_number',
                label: 'Kirayə Nömrəsi',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm font-medium text-gray-900">{item.rental_number}</div>
                )
            },
            {
                key: 'customer_name',
                label: 'Müştəri',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.customer_name}</div>
                )
            },
            {
                key: 'branch_name',
                label: 'Filial',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">{item.branch_name}</div>
                )
            },
            {
                key: 'start_date',
                label: 'Başlanğıc',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">
                        {new Date(item.start_date).toLocaleDateString('az-AZ')}
                    </div>
                )
            },
            {
                key: 'end_date',
                label: 'Bitmə',
                sortable: true,
                render: (item: any) => (
                    <div className="text-sm text-gray-700">
                        {new Date(item.end_date).toLocaleDateString('az-AZ')}
                    </div>
                )
            },
            {
                key: 'items',
                label: 'Kirayə Elementləri',
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    const formatNumber = (num: number) => new Intl.NumberFormat('az-AZ').format(num);

                    if (!item.items?.length) {
                        return <span className="text-gray-400 italic text-sm">Elementlər yoxdur</span>;
                    }
                    return (
                        <div className="space-y-1">
                            {item.items.map((rentalItem: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 rounded px-3 py-2">
                                    <div className="flex-1">
                                        <div className="font-medium text-gray-900 text-sm">{rentalItem.product_name}</div>
                                    </div>
                                    <div className="flex items-center space-x-3 text-sm">
                                        <span className="text-gray-600">{formatNumber(rentalItem.quantity)} ədəd</span>
                                        <span className="text-gray-600">{formatCurrency(rentalItem.daily_rate)}/gün</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(rentalItem.total_cost)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                }
            },
            {
                key: 'total_cost',
                label: 'Cəmi',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    return <div className="text-sm font-medium text-gray-900">{formatCurrency(item.total_cost)}</div>;
                }
            },
            {
                key: 'credit_amount',
                label: 'Kredit',
                sortable: true,
                render: (item: any) => {
                    const formatCurrency = (amount: number) => new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount);
                    const hasCredit = item.credit_amount > 0;
                    return (
                        <div className={`text-sm font-medium ${hasCredit ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(item.credit_amount)}
                        </div>
                    );
                }
            },
            {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (item: any) => {
                    const badges: { [key: string]: { label: string; className: string } } = {
                        'reserved': { label: 'Rezerv', className: 'bg-blue-100 text-blue-800' },
                        'active': { label: 'Aktiv', className: 'bg-green-100 text-green-800' },
                        'overdue': { label: 'Gecikmiş', className: 'bg-red-100 text-red-800' },
                        'returned': { label: 'Qaytarıldı', className: 'bg-gray-100 text-gray-800' },
                        'cancelled': { label: 'Ləğv edildi', className: 'bg-yellow-100 text-yellow-800' }
                    };
                    const badge = badges[item.status] || badges.reserved;
                    return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.className}`}>
                            {badge.label}
                        </span>
                    );
                }
            }
        ] as Column[]
    }
};
