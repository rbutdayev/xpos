import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Company } from '@/types';
import { useState } from 'react';
import Header from './Components/Show/Header';
import TabsNav from './Components/Show/TabsNav';
import BasicTab from './Components/Show/Tabs/BasicTab';
import ContactTab from './Components/Show/Tabs/ContactTab';
import SystemTab from './Components/Show/Tabs/SystemTab';

interface Props {
    company: Company;
    branches?: any[];
    warehouses?: any[];
    users?: any[];
}

type TabType = 'basic' | 'contact' | 'system';

export default function Show({ company, branches = [], warehouses = [], users = [] }: Props) {
    const [activeTab, setActiveTab] = useState<TabType>('basic');

    const deleteCompany = () => {
        if (confirm(`${company.name} şirkətini silmək istədiyinizə əminsiniz?`)) {
            router.delete(route('companies.destroy', company.id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Şirkət: ${company.name}`} />

            <div className="px-4 sm:px-6 lg:px-8">
                <Header company={company} onDelete={deleteCompany} />

                <TabsNav active={activeTab} onChange={(t) => setActiveTab(t)} />

                {/* Tab Content */}
                <div className="bg-white shadow-sm sm:rounded-lg">
                    {activeTab === 'basic' && <BasicTab company={company} />}
                    {activeTab === 'contact' && <ContactTab company={company} />}
                    {activeTab === 'system' && (
                        <SystemTab company={company} branches={branches} warehouses={warehouses} users={users} />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
