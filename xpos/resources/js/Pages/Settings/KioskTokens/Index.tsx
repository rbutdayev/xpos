import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { PageProps } from '@/types';
import toast from 'react-hot-toast';

interface Branch {
    id: number;
    name: string;
    is_main: boolean;
}

interface KioskToken {
    id: number;
    device_name: string;
    branch_id: number | null;
    branch_name: string | null;
    token_preview: string;
    status: 'active' | 'revoked' | 'suspended';
    is_online: boolean;
    last_heartbeat: string | null;
    last_heartbeat_human: string | null;
    device_info: any;
    created_by: string | null;
    created_at: string;
}

interface DownloadInfo {
    name: string;
    platform: string;
    url: string;
    size: string;
    icon: string;
}

interface Downloads {
    version: string;
    release_date: string;
    installers: {
        windows: DownloadInfo;
        macos_intel: DownloadInfo;
        macos_arm: DownloadInfo;
    };
    system_requirements: {
        windows: string;
        macos: string;
    };
}

interface Props extends PageProps {
    tokens: KioskToken[];
    branches: Branch[];
    downloads: Downloads;
}

export default function Index({ auth, tokens, branches, downloads }: Props) {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [newTokenName, setNewTokenName] = useState('');
    const [selectedBranch, setSelectedBranch] = useState<number | ''>('');
    const [createdToken, setCreatedToken] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateToken = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate branch is selected
        if (!selectedBranch) {
            toast.error('Zəhmət olmasa filial seçin');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(route('kiosk-tokens.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    device_name: newTokenName,
                    branch_id: selectedBranch,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCreatedToken(data.token);
                setShowCreateModal(false);
                setShowTokenModal(true);
                setNewTokenName('');
                setSelectedBranch('');
                toast.success(data.message);

                // Reload page to show new token in list
                setTimeout(() => router.reload(), 1000);
            } else {
                toast.error(data.message || 'Token yaradılarkən xəta baş verdi');
            }
        } catch (error) {
            console.error('Error creating token:', error);
            toast.error('Token yaradılarkən xəta baş verdi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToken = (token: string) => {
        navigator.clipboard.writeText(token);
        toast.success('Token kopyalandı!');
    };

    const handleRevoke = (tokenId: number, deviceName: string) => {
        if (confirm(`"${deviceName}" tokenini ləğv etmək istədiyinizə əminsiniz? Kiosk artıq işləməyəcək.`)) {
            router.post(route('kiosk-tokens.revoke', tokenId), {}, {
                onSuccess: () => toast.success('Token ləğv edildi'),
                onError: () => toast.error('Xəta baş verdi'),
            });
        }
    };

    const handleDelete = (tokenId: number, deviceName: string) => {
        if (confirm(`"${deviceName}" tokenini silmək istədiyinizə əminsiniz? Bu əməliyyatı geri qaytarmaq mümkün deyil.`)) {
            router.delete(route('kiosk-tokens.destroy', tokenId), {
                onSuccess: () => toast.success('Token silindi'),
                onError: () => toast.error('Xəta baş verdi'),
            });
        }
    };

    const getStatusBadge = (token: KioskToken) => {
        if (token.status === 'revoked') {
            return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Ləğv edilib</span>;
        }

        if (token.status === 'suspended') {
            return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">Dayandırılıb</span>;
        }

        if (token.is_online) {
            return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Onlayn</span>;
        }

        if (token.last_heartbeat) {
            const lastSeenDate = new Date(token.last_heartbeat);
            const minutesAgo = (Date.now() - lastSeenDate.getTime()) / 1000 / 60;

            if (minutesAgo < 5) {
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Gözləmə</span>;
            }
        }

        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Oflayn</span>;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Kiosk Tokenlər" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Kiosk Tokenlər
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Hər kiosk cihazı üçün ayrı token yaradın və filial seçin. Token ilə kiosk proqramı serverə qoşulur və seçilmiş filialda satış əməliyyatlarını icra edir.
                                </p>
                            </div>
                            {tokens.length > 0 && (
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                                >
                                    + Yeni Token
                                </button>
                            )}
                        </div>

                        {/* Download Section */}
                        <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 mb-1">
                                        Kiosk Proqramını Yüklə
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Versiya {downloads.version} • {new Date(downloads.release_date).toLocaleDateString('az-AZ')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                {/* Windows */}
                                <a
                                    href={downloads.installers.windows.url}
                                    className="flex flex-col items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="text-4xl mb-2">{downloads.installers.windows.icon}</span>
                                    <span className="font-medium text-gray-900 mb-1">
                                        {downloads.installers.windows.platform}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-2">{downloads.installers.windows.size}</span>
                                    <span className="text-sm text-purple-600 group-hover:text-purple-700 font-medium">
                                        Yüklə
                                    </span>
                                </a>

                                {/* macOS Intel */}
                                <a
                                    href={downloads.installers.macos_intel.url}
                                    className="flex flex-col items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="text-4xl mb-2">{downloads.installers.macos_intel.icon}</span>
                                    <span className="font-medium text-gray-900 mb-1">
                                        {downloads.installers.macos_intel.platform}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-2">{downloads.installers.macos_intel.size}</span>
                                    <span className="text-sm text-purple-600 group-hover:text-purple-700 font-medium">
                                        Yüklə
                                    </span>
                                </a>

                                {/* macOS ARM */}
                                <a
                                    href={downloads.installers.macos_arm.url}
                                    className="flex flex-col items-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:shadow-md transition-all group"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="text-4xl mb-2">{downloads.installers.macos_arm.icon}</span>
                                    <span className="font-medium text-gray-900 mb-1 text-center">
                                        {downloads.installers.macos_arm.platform}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-2">{downloads.installers.macos_arm.size}</span>
                                    <span className="text-sm text-purple-600 group-hover:text-purple-700 font-medium">
                                        Yüklə
                                    </span>
                                </a>
                            </div>

                            <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <h5 className="font-medium text-gray-900 mb-2 text-sm">Quraşdırma addımları:</h5>
                                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                                    <li>Yuxarıdan öz platformanız üçün installer-i yükləyin</li>
                                    <li>Proqramı quraşdırın və açın</li>
                                    <li>Aşağıdan yeni token yaradın (filial seçimi mütləqdir)</li>
                                    <li>Tokeni kopyalayın və kiosk proqramına yapışdırın</li>
                                    <li>Proqramı başladın - məhsullar və parametrlər avtomatik yüklənəcək</li>
                                </ol>
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs text-gray-600">
                                        <strong>Sistem tələbləri:</strong><br/>
                                        Windows: {downloads.system_requirements.windows}<br/>
                                        macOS: {downloads.system_requirements.macos}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {tokens.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">Hələ heç bir token yaradılmayıb</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                                >
                                    İlk Tokeni Yarat
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cihaz Adı
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Filial
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Token
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Son Əlaqə
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Əməliyyatlar
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {tokens.map((token) => (
                                            <tr key={token.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {token.device_name}
                                                    </div>
                                                    {token.created_by && (
                                                        <div className="text-xs text-gray-500">
                                                            {token.created_by}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {token.branch_name || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                        {token.token_preview}
                                                    </code>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(token)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {token.last_heartbeat_human || 'Heç vaxt'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => copyToken(token.token_preview)}
                                                        className="text-slate-600 hover:text-slate-900 mr-3"
                                                        title="Kopyala"
                                                    >
                                                        Kopyala
                                                    </button>
                                                    {token.status === 'active' && (
                                                        <button
                                                            onClick={() => handleRevoke(token.id, token.device_name)}
                                                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                                                            title="Ləğv et"
                                                        >
                                                            Ləğv et
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(token.id, token.device_name)}
                                                        className="text-red-600 hover:text-red-900"
                                                        title="Sil"
                                                    >
                                                        Sil
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Token Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Kiosk Token</h3>
                        <form onSubmit={handleCreateToken}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cihaz Adı
                                </label>
                                <input
                                    type="text"
                                    value={newTokenName}
                                    onChange={(e) => setNewTokenName(e.target.value)}
                                    placeholder="Məsələn: Kiosk Terminal 1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-purple-500"
                                    required
                                    disabled={isSubmitting}
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    Kiosk cihazını tanımaq üçün ad verin
                                </p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Filial <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedBranch}
                                    onChange={(e) => setSelectedBranch(e.target.value ? parseInt(e.target.value) : '')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-slate-500 focus:border-purple-500"
                                    disabled={isSubmitting}
                                    required
                                >
                                    <option value="">Filial seçin</option>
                                    {branches.map((branch) => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name} {branch.is_main ? '(Əsas)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500">
                                    Hər kiosk mütləq bir filialda yerləşməlidir
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewTokenName('');
                                        setSelectedBranch('');
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                    disabled={isSubmitting}
                                >
                                    Ləğv et
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Yaradılır...' : 'Yarat'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Show Token Modal (One-Time) */}
            {showTokenModal && createdToken && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Token Yaradıldı - İndi Kopyalayın!
                        </h3>
                        <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700">
                            <p className="text-sm font-medium">
                                DİQQƏT: Bu token yalnız bir dəfə göstərilir. İndi kopyalayın və təhlükəsiz yerdə saxlayın.
                            </p>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Token:</label>
                            <div className="flex items-center space-x-2">
                                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm break-all">
                                    {createdToken}
                                </code>
                                <button
                                    onClick={() => copyToken(createdToken)}
                                    className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-600 whitespace-nowrap"
                                >
                                    Kopyala
                                </button>
                            </div>
                        </div>
                        <div className="mb-4 p-4 bg-purple-50 border-l-4 border-purple-400">
                            <p className="text-sm text-purple-700 font-medium mb-2">Növbəti addımlar:</p>
                            <ol className="list-decimal list-inside text-sm text-purple-700 space-y-1">
                                <li>Kiosk proqramını cihazda açın</li>
                                <li>İlk açılışda token tələb edəcək</li>
                                <li>Bu tokeni yapışdırın</li>
                                <li>Proqram başladılacaq və məhsullar yüklənəcək</li>
                            </ol>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setShowTokenModal(false);
                                    setCreatedToken('');
                                }}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Bağla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
