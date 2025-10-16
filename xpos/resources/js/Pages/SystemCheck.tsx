import { Head, Link } from '@inertiajs/react';
import { 
    BuildingOffice2Icon,
    HomeModernIcon,
    CubeIcon,
    TruckIcon,
    UserGroupIcon,
    UsersIcon,
    ArrowsRightLeftIcon,
    ShoppingCartIcon,
    PrinterIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    CogIcon,
    TagIcon,
    WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    DashboardHeader, 
    QuickStats, 
    ModuleCard, 
    RecentActivity,
    type ModuleCardType 
} from '@/Components/Admin';

// Using ModuleCardType from Admin components

interface DashboardStats {
    products_count: number;
    customers_count: number;
    suppliers_count: number;
    warehouses_count: number;
    branches_count: number;
    vehicles_count: number;
    service_records_count: number;
    service_records_this_month: number;
    total_products_value: number;
    active_customers: number;
    pending_services: number;
    completed_services_this_month: number;
}

interface RecentService {
    id: number;
    service_number: string;
    customer: {
        name: string;
    };
    vehicle: {
        formatted_plate_number: string;
    };
    total_cost: number;
    status: string;
    service_date: string;
}

interface RecentCustomer {
    id: number;
    name: string;
    phone: string;
    created_at: string;
}

interface LowStockProduct {
    id: number;
    name: string;
    sku: string;
    stock: Array<{
        quantity: number;
        min_level: number;
    }>;
}

interface DashboardProps {
    stats?: DashboardStats;
    recentServices?: RecentService[];
    recentCustomers?: RecentCustomer[];
    lowStockProducts?: LowStockProduct[];
}

export default function Dashboard({ 
    stats = {
        products_count: 0,
        customers_count: 0,
        suppliers_count: 0,
        warehouses_count: 0,
        branches_count: 0,
        vehicles_count: 0,
        service_records_count: 0,
        service_records_this_month: 0,
        total_products_value: 0,
        active_customers: 0,
        pending_services: 0,
        completed_services_this_month: 0,
    },
    recentServices = [],
    recentCustomers = [],
    lowStockProducts = []
}: DashboardProps) {
    const modules: ModuleCardType[] = [
        // MODULE 1: Authentication & Account Management (✅ COMPLETED)
        {
            title: 'Şirkət Məlumatları',
            description: 'Şirkət məlumatlarını görüntülə və düzəlt',
            href: '/companies',
            icon: BuildingOffice2Icon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 2: Company & Branch Setup (✅ COMPLETED)
        {
            title: 'Filiallar',
            description: 'Filial idarəetməsi və əməliyyatları',
            href: '/branches',
            icon: BuildingOffice2Icon,
            status: 'completed',
            color: 'bg-green-500'
        },
        {
            title: 'Anbarlar',
            description: 'Anbar idarəetməsi və giriş nəzarəti',
            href: '/warehouses',
            icon: HomeModernIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 3: Product Catalog (✅ COMPLETED)
        {
            title: 'Məhsul Kataloqu',
            description: 'Məhsul və xidmət kataloqu - 100% hazır',
            href: '/products',
            icon: CubeIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        {
            title: 'Kateqoriyalar',
            description: 'Məhsul kateqoriyalarının strukturu',
            href: '/categories',
            icon: TagIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 4: Supplier Management (✅ COMPLETED)
        {
            title: 'Təchizatçılar',
            description: 'Təchizatçı şirkətlər və qiymət idarəetməsi',
            href: '/suppliers',
            icon: TruckIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 5: Customer & Service Records (✅ COMPLETED)
        {
            title: 'Müştərilər',
            description: 'Müştəri bazası - DataTable şablonu ilə',
            href: '/customers',
            icon: UserGroupIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        {
            title: 'Nəqliyyat Vasitələri',
            description: 'Müştəri avtomobilləri və texniki məlumatlar',
            href: '/vehicles',
            icon: TruckIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        {
            title: 'Servis Qeydləri',
            description: 'Xidmət tarixçəsi və avtomatik hesablama',
            href: '/service-records',
            icon: WrenchScrewdriverIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 6: Employee Management (✅ COMPLETED)
        {
            title: 'İşçilər',
            description: 'İşçi idarəetməsi və iş tapşırıqları',
            href: '/employees',
            icon: UsersIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 7: Stock Movement & Transfers (🔴 PENDING)
        {
            title: 'Stok Hərəkətləri',
            description: 'Anbar transferləri və stok izləməsi',
            href: '#',
            icon: ArrowsRightLeftIcon,
            status: 'pending',
            color: 'bg-gray-400'
        },
        
        // MODULE 8: Sales & POS (✅ COMPLETED)
        {
            title: 'Satış və POS',
            description: 'Satış sistemi və kassa əməliyyatları',
            href: '/sales',
            icon: ShoppingCartIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 9: Thermal Printing (✅ COMPLETED)
        {
            title: 'Çap Sistemi',
            description: 'Termal çap və qəbz şablonları',
            href: '/printer-configs',
            icon: PrinterIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 10: Dashboard & Reporting (✅ COMPLETED)
        {
            title: 'Hesabatlar',
            description: 'Dashboard və analitik hesabatlar',
            href: '/dashboard',
            icon: ChartBarIcon,
            status: 'completed',
            color: 'bg-green-500'
        },
        
        // MODULE 11: Cost & Expense Management (🔴 PENDING)
        {
            title: 'Maliyyə',
            description: 'Xərclər və maaş idarəetməsi',
            href: '#',
            icon: CurrencyDollarIcon,
            status: 'pending',
            color: 'bg-gray-400'
        },
        
        // MODULE 12: System Settings (🔴 PENDING)
        {
            title: 'Sistem Ayarları',
            description: 'Ümumi sistem konfiqurasiyası',
            href: '#',
            icon: CogIcon,
            status: 'pending',
            color: 'bg-gray-400'
        }
    ];

    // Count completed modules for verification
    const completedCount = modules.filter(m => m.status === 'completed').length;
    console.log(`Completed modules: ${completedCount}/12`);

    return (
        <AuthenticatedLayout>
            <Head title="Ana Panel" />

            <div className="mx-auto sm:px-6 lg:px-8">
                {/* Header */}
                <DashboardHeader
                    title="ONYX xPos - UPDATED VERSION"
                    subtitle="Modern Retail POS System"
                    progress={83}
                    completedModules={10}
                    totalModules={12}
                />

                {/* Quick Stats */}
                <QuickStats stats={stats} />

                {/* Recent Updates */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">Son Yeniliklər</h2>
                    </div>
                    <div className="p-6">
                        <div className="space-y-3">
                            <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="text-gray-900">SharedDataTable komponenti - 10,000+ qeyd üçün</span>
                                <span className="text-gray-500 ml-auto">Bu gün</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="text-gray-900">Müştəri və Servis Qeydləri modulu tamamlandı</span>
                                <span className="text-gray-500 ml-auto">Bu gün</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="text-gray-900">Sənəd yükləmə sistemi (S3/Azure Blob) tamamlandı</span>
                                <span className="text-gray-500 ml-auto">Dünən</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="text-gray-900">Təchizatçı idarəetməsi modulu tamamlandı</span>
                                <span className="text-gray-500 ml-auto">Dünən</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                <span className="text-gray-900">Məhsul kataloqu tam tamamlandı</span>
                                <span className="text-gray-500 ml-auto">2 gün əvvəl</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules Grid */}
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-900">Sistem Modulları</h2>
                        <p className="text-gray-600 mt-1">Bütün əməliyyat modullarına çıxış</p>
                    </div>
                    
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {modules.map((module, index) => (
                                <ModuleCard key={index} module={module} index={index} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Activity & Additional Stats */}
                <RecentActivity 
                    recentServices={recentServices} 
                    recentCustomers={recentCustomers} 
                />

                {/* Low Stock Alert */}
                {lowStockProducts && lowStockProducts.length > 0 && (
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mt-6">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-red-600">Aşağı Stok Xəbərdarlığı</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {lowStockProducts.slice(0, 5).map((product) => (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div className="flex items-center">
                                            <CubeIcon className="h-5 w-5 text-red-500 mr-3" />
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    SKU: {product.sku}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-red-600">
                                                {product.stock[0]?.quantity || 0} ədəd qalıb
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Min: {product.stock[0]?.min_level || 0}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 text-center">
                                <Link href="/products" className="text-sm text-red-600 hover:text-red-800">
                                    Bütün məhsulları gör →
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
