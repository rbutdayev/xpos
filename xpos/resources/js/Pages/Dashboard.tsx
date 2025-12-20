import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { PageProps } from '@/types';
import { useTranslation } from 'react-i18next';

// Role-specific dashboard components
import AccountantDashboard from './Dashboard/AccountantDashboard';
import WarehouseManagerDashboard from './Dashboard/WarehouseManagerDashboard';
import SalesStaffDashboard from './Dashboard/SalesStaffDashboard';
import TailorDashboard from './Dashboard/TailorDashboard';
import BranchManagerDashboard from './Dashboard/BranchManagerDashboard';
import CashierDashboard from './Dashboard/CashierDashboard';

/**
 * Dashboard Page - Role-aware routing
 *
 * This is the main dashboard entry point that routes to role-specific
 * dashboard components based on the user's role.
 */

interface DashboardUser {
    id: number;
    name: string;
    role: string;
}

interface DashboardAccount {
    name: string;
    modules?: {
        services_enabled: boolean;
        rentals_enabled: boolean;
        shop_enabled: boolean;
        loyalty_enabled: boolean;
        discounts_enabled: boolean;
    };
}

interface DashboardData extends PageProps {
    user?: DashboardUser;
    account?: DashboardAccount;
    [key: string]: any; // Allow additional role-specific props
}

export default function Dashboard(props: DashboardData) {
    const { user } = props;
    const { t } = useTranslation('dashboard');

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    // Route to role-specific dashboard component
    const renderDashboard = () => {
        switch (user.role) {
            case 'account_owner':
            case 'admin':
                // These roles use DashboardNew.tsx directly (not wrapped in this component)
                return null;

            case 'accountant':
                return <AccountantDashboard {...props as any} />;

            case 'warehouse_manager':
                return <WarehouseManagerDashboard {...props as any} />;

            case 'sales_staff':
                return <SalesStaffDashboard {...props as any} />;

            case 'tailor':
                return <TailorDashboard {...props as any} />;

            case 'branch_manager':
                return <BranchManagerDashboard {...props as any} />;

            case 'cashier':
                return <CashierDashboard {...props as any} />;

            default:
                return (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {t('welcome')}
                            </h1>
                            <p className="text-gray-600">
                                {t('dashboardLoading')}
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />
            {renderDashboard()}
        </AuthenticatedLayout>
    );
}
