import { Head, Link } from '@inertiajs/react';
import SuperAdminNav from '@/Components/SuperAdminNav';
import SecondaryButton from '@/Components/SecondaryButton';

interface Account {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
}

interface CardsByAccount {
    account_id: number;
    total: number;
    account: Account;
}

interface RecentAssignment {
    id: number;
    card_number: string;
    assigned_at: string;
    account: Account;
    customer: Customer;
}

interface Props {
    cardsByAccount: CardsByAccount[];
    recentAssignments: RecentAssignment[];
}

export default function LoyaltyCardsReports({ cardsByAccount, recentAssignments }: Props) {
    return (
        <>
            <Head title="Loaylıq Kartları Hesabatları - Super Admin" />

            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">
                                        Loaylıq Kartları Hesabatları
                                    </h1>
                                    <p className="mt-2 text-sm text-gray-600">
                                        Kart istifadəsi və təyinat statistikası
                                    </p>
                                </div>
                                <Link href={route('superadmin.loyalty-cards.index')}>
                                    <SecondaryButton type="button">
                                        Geriyə
                                    </SecondaryButton>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <SuperAdminNav />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cards by Account */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">
                                    Hesablara görə kartlar (Top 20)
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Ən çox kart istifadə edən hesablar
                                </p>
                            </div>
                            <div className="divide-y divide-gray-200">
                                {cardsByAccount.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        Hələ heç bir kart təyin edilməyib
                                    </div>
                                ) : (
                                    cardsByAccount.map((item, index) => (
                                        <div key={item.account_id} className="px-6 py-4 flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <span className="flex-shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.account.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {item.account_id}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    {item.total} kart
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Assignments */}
                        <div className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-medium text-gray-900">
                                    Son təyinatlar
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Son 50 kart təyinatı
                                </p>
                            </div>
                            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                                {recentAssignments.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        Hələ heç bir təyinat yoxdur
                                    </div>
                                ) : (
                                    recentAssignments.map((assignment) => (
                                        <div key={assignment.id} className="px-6 py-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {assignment.card_number}
                                                    </div>
                                                    <div className="mt-1 text-sm text-gray-600">
                                                        <div className="flex items-center space-x-1">
                                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                            </svg>
                                                            <span>{assignment.customer.name}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1 mt-1">
                                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            <span>{assignment.account.name}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-shrink-0 text-right">
                                                    <div className="text-xs text-gray-500">
                                                        {new Date(assignment.assigned_at).toLocaleDateString('az-AZ')}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {new Date(assignment.assigned_at).toLocaleTimeString('az-AZ', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Additional Stats */}
                    <div className="mt-6 bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">
                            Kart İstifadə Statistikası
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">
                                            Aktiv Hesablar
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {cardsByAccount.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">
                                            Ümumi Təyinatlar
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {recentAssignments.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-500">
                                            Ortalama/Hesab
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {cardsByAccount.length > 0
                                                ? Math.round(cardsByAccount.reduce((sum, item) => sum + item.total, 0) / cardsByAccount.length)
                                                : 0
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
