import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { 
    ArrowLeftIcon, 
    ClockIcon, 
    UserIcon, 
    ComputerDesktopIcon,
    DocumentTextIcon,
    EyeIcon,
    CodeBracketIcon
} from '@heroicons/react/24/outline';

interface AuditLog {
    log_id: number;
    action: string;
    model_type: string;
    model_id: string | null;
    description: string | null;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
    } | null;
}

interface Props {
    auditLog: AuditLog;
}

export default function Show({ auditLog }: Props) {
    const getActionColor = (action: string) => {
        switch (action) {
            case 'created': return 'bg-green-100 text-green-800 border-green-200';
            case 'updated': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'deleted': return 'bg-red-100 text-red-800 border-red-200';
            case 'viewed': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'exported': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'restored': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatValue = (value: any) => {
        if (value === null || value === undefined) {
            return <span className="text-gray-400 italic">null</span>;
        }
        if (typeof value === 'object') {
            return <pre className="text-xs bg-gray-50 p-2 rounded border overflow-x-auto">{JSON.stringify(value, null, 2)}</pre>;
        }
        return <span className="text-gray-900">{String(value)}</span>;
    };

    const renderValueChanges = () => {
        if (!auditLog.old_values && !auditLog.new_values) {
            return null;
        }

        const oldValues = auditLog.old_values || {};
        const newValues = auditLog.new_values || {};
        const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

        return (
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CodeBracketIcon className="w-5 h-5 mr-2 text-gray-400" />
                    Dəyər dəyişiklikləri
                </h3>
                <div className="space-y-4">
                    {Array.from(allKeys).map((key) => (
                        <div key={key} className="border rounded-lg p-4">
                            <div className="font-medium text-sm text-gray-700 mb-2">{key}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {oldValues[key] !== undefined && (
                                    <div>
                                        <div className="text-xs text-red-600 font-medium mb-1">Köhnə dəyər:</div>
                                        <div className="bg-red-50 border border-red-200 rounded p-3">
                                            {formatValue(oldValues[key])}
                                        </div>
                                    </div>
                                )}
                                {newValues[key] !== undefined && (
                                    <div>
                                        <div className="text-xs text-green-600 font-medium mb-1">Yeni dəyər:</div>
                                        <div className="bg-green-50 border border-green-200 rounded p-3">
                                            {formatValue(newValues[key])}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Audit Log #${auditLog.log_id}`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Link 
                                    href="/audit-logs" 
                                    className="mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                >
                                    <ArrowLeftIcon className="w-5 h-5" />
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-semibold text-gray-900">
                                        Audit Log #{auditLog.log_id}
                                    </h1>
                                    <p className="text-gray-600">Sistem fəaliyyət qeydinin təfsilatlı məlumatları</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <EyeIcon className="w-5 h-5 mr-2 text-gray-400" />
                                Əsas məlumatlar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hadisə</label>
                                    <span className={`inline-flex px-3 py-1 text-sm rounded-full border ${getActionColor(auditLog.action)}`}>
                                        {auditLog.action}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                                    <div className="flex items-center">
                                        <DocumentTextIcon className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">{auditLog.model_type}</span>
                                        {auditLog.model_id && (
                                            <span className="ml-2 text-xs text-gray-500">#{auditLog.model_id}</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">İstifadəçi</label>
                                    <div className="flex items-center">
                                        <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">
                                            {auditLog.user?.name || 'Sistem'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarix</label>
                                    <div className="flex items-center">
                                        <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                                        <span className="text-sm text-gray-900">
                                            {new Date(auditLog.created_at).toLocaleString('az-AZ', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {auditLog.description && (
                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Təsvir</label>
                                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded border">
                                        {auditLog.description}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Technical Information */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                                <ComputerDesktopIcon className="w-5 h-5 mr-2 text-gray-400" />
                                Texniki məlumatlar
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {auditLog.ip_address && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">IP ünvan</label>
                                        <span className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded">
                                            {auditLog.ip_address}
                                        </span>
                                    </div>
                                )}
                                {auditLog.user_agent && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border text-xs font-mono break-all">
                                            {auditLog.user_agent}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Value Changes */}
                        {renderValueChanges()}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}