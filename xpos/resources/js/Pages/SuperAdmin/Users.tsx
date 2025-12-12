import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import SecondaryButton from '@/Components/SecondaryButton';
import SuperAdminNav from '@/Components/SuperAdminNav';

interface User {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    status: 'active' | 'inactive';
    last_login_at?: string;
    created_at: string;
    account: {
        id: number;
        company_name: string;
    } | null;
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    search?: string;
}

export default function SuperAdminUsers({ users, search }: Props) {
    const [searchTerm, setSearchTerm] = useState(search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        window.location.href = `/admin/users?search=${encodeURIComponent(searchTerm)}`;
    };

    const handleDeleteUser = (user: User) => {
        if (user.role === 'super_admin') {
            alert('Super admin istifadəçisini silmək olmaz.');
            return;
        }
        if (confirm(`${user.name} istifadəçisini silmək istədiyinizdən əminsiniz?`)) {
            router.delete(route('superadmin.users.destroy', user.id), {
                preserveScroll: true,
            });
        }
    };

    const handleToggleStatus = (user: User) => {
        if (user.role === 'super_admin') {
            alert('Super admin istifadəçisinin statusunu dəyişmək olmaz.');
            return;
        }
        const action = user.status === 'active' ? 'deaktivləşdirmək' : 'aktivləşdirmək';
        if (confirm(`${user.name} istifadəçisini ${action} istədiyinizdən əminsiniz?`)) {
            router.patch(route('superadmin.users.toggle-status', user.id), {}, {
                preserveScroll: true,
                preserveState: false,
            });
        }
    };

    const getRoleDisplayName = (role: string) => {
        const names: Record<string, string> = {
            'super_admin': 'Super Admin',
            'account_owner': 'Hesab Sahibi',
            'admin': 'Admin',
            'branch_manager': 'Filial Meneceri',
            'warehouse_manager': 'Anbar Meneceri',
            'sales_staff': 'Satış Işçisi',
            'mechanic': 'Mexanik',
            'accountant': 'Mühasib',
            'cashier': 'Kassir',
        };
        return names[role] || role;
    };

    return (
        <>
            <Head title="İstifadəçilər - Super Admin" />
            
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow">
                    <div className="mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="py-6">
                            <h1 className="text-3xl font-bold text-gray-900">
                                İstifadəçi Monitorinqi
                            </h1>
                            <p className="mt-2 text-sm text-gray-600">
                                Bütün sistem istifadəçilərini izləyin
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Navigation */}
                    <SuperAdminNav />

                    {/* Search */}
                    <div className="mb-6">
                        <form onSubmit={handleSearch} className="flex items-center space-x-2">
                            <TextInput
                                type="text"
                                placeholder="İstifadəçi axtar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64"
                            />
                            <SecondaryButton type="submit">
                                Axtar
                            </SecondaryButton>
                        </form>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                İstifadəçilər ({users.total})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            İstifadəçi
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hesab
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rol
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Son Giriş
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Qeydiyyat
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Əməliyyatlar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="text-sm text-gray-500">
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.account ? (
                                                    <>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.account.company_name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            ID: {user.account.id}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm font-medium text-purple-900">
                                                        Sistem Administratoru
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.role === 'super_admin' 
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : user.role === 'account_owner'
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {getRoleDisplayName(user.role)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    user.status === 'active' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {user.status === 'active' ? 'Aktiv' : 'Deaktiv'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {user.last_login_at 
                                                    ? new Date(user.last_login_at).toLocaleDateString('az-AZ')
                                                    : 'Heç vaxt'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString('az-AZ')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`${
                                                            user.status === 'active'
                                                                ? 'text-orange-600 hover:text-orange-900'
                                                                : 'text-green-600 hover:text-green-900'
                                                        } ${user.role === 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={user.role === 'super_admin'}
                                                    >
                                                        {user.status === 'active' ? 'Deaktiv et' : 'Aktiv et'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(user)}
                                                        className={`text-red-600 hover:text-red-900 ${user.role === 'super_admin' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        disabled={user.role === 'super_admin'}
                                                    >
                                                        Sil
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                            <div className="text-sm text-gray-700">
                                Səhifə {users.current_page} / {users.last_page} ({users.total} nəticə)
                            </div>
                            <div className="flex space-x-2">
                                {users.current_page > 1 && (
                                    <a
                                        href={`/admin/users?page=${users.current_page - 1}${search ? '&search=' + encodeURIComponent(search) : ''}`}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        Əvvəlki
                                    </a>
                                )}
                                {users.current_page < users.last_page && (
                                    <a
                                        href={`/admin/users?page=${users.current_page + 1}${search ? '&search=' + encodeURIComponent(search) : ''}`}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        Növbəti
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}