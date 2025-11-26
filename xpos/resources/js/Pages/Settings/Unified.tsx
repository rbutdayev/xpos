import { Head } from '@inertiajs/react';
import {
    CogIcon,
    ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { AdminLayout } from '@/Components/Admin';

// Import tab components
import POSTab from './Tabs/POSTab';

interface Props {
    pos_settings: any;
}

export default function UnifiedSettings({
    pos_settings,
}: Props) {

    return (
        <AdminLayout title="POS Parametrləri">
            <Head title="POS Parametrləri" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <ComputerDesktopIcon className="w-8 h-8 mr-3 text-indigo-600" />
                            POS Parametrləri
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            POS və çap parametrlərini konfiqurasiya edin
                        </p>
                    </div>

                    {/* Content */}
                    <div className="mt-6">
                        <POSTab settings={pos_settings} />
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
