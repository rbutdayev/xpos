import React, { memo } from 'react';
import SettingsCard from '@/Components/Admin/SettingsCard';
import { 
    QueueListIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface QueueStatus {
    name: string;
    pending: number;
    failed: number;
    status: 'healthy' | 'warning' | 'unknown' | 'error';
}

interface QueueMonitorProps {
    queues: QueueStatus[];
}

const QueueMonitor = memo(({ queues }: QueueMonitorProps) => {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy':
                return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
            case 'unknown':
                return <ClockIcon className="h-4 w-4 text-gray-500" />;
            default:
                return <XCircleIcon className="h-4 w-4 text-red-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-green-700 bg-green-50';
            case 'warning':
                return 'text-yellow-700 bg-yellow-50';
            case 'unknown':
                return 'text-gray-700 bg-gray-50';
            default:
                return 'text-red-700 bg-red-50';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'Sağlam';
            case 'warning':
                return 'Diqqət';
            case 'unknown':
                return 'Naməlum';
            default:
                return 'Xəta';
        }
    };

    if (!queues || queues.length === 0) {
        return (
            <SettingsCard>
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <QueueListIcon className="h-5 w-5 mr-2 text-gray-500" />
                        Növbə Statusu
                    </h3>
                    <div className="text-center py-6">
                        <QueueListIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">
                            Növbə məlumatı yoxdur
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Sistem növbələri konfiqurasiya edilməmişdir.
                        </p>
                    </div>
                </div>
            </SettingsCard>
        );
    }

    const totalPending = queues.reduce((sum, queue) => sum + queue.pending, 0);
    const totalFailed = queues.reduce((sum, queue) => sum + queue.failed, 0);
    const hasWarnings = queues.some(queue => queue.status === 'warning' || queue.failed > 0);
    const hasErrors = queues.some(queue => queue.status === 'error');

    return (
        <SettingsCard>
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <QueueListIcon className="h-5 w-5 mr-2 text-gray-500" />
                    Növbə Statusu
                </h3>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{totalPending}</div>
                        <div className="text-sm text-gray-600">Gözləyən</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${totalFailed > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {totalFailed}
                        </div>
                        <div className="text-sm text-gray-600">Uğursuz</div>
                    </div>
                </div>

                {/* Overall Status */}
                <div className={`rounded-lg p-3 mb-4 ${
                    hasErrors ? 'bg-red-50 border border-red-200' :
                    hasWarnings ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                }`}>
                    <div className="flex items-center">
                        {hasErrors ? 
                            <XCircleIcon className="h-5 w-5 text-red-500 mr-2" /> :
                            hasWarnings ? 
                            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" /> :
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                        }
                        <span className={`text-sm font-medium ${
                            hasErrors ? 'text-red-700' :
                            hasWarnings ? 'text-yellow-700' :
                            'text-green-700'
                        }`}>
                            {hasErrors ? 'Növbə sistemində xətalar var' :
                             hasWarnings ? 'Növbə sistemində diqqət tələb edən vəziyyətlər var' :
                             'Bütün növbələr normal işləyir'}
                        </span>
                    </div>
                </div>

                {/* Queue Details */}
                <div className="space-y-3">
                    {queues.map((queue, index) => (
                        <div 
                            key={queue.name || index} 
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(queue.status)}
                                <div>
                                    <div className="font-medium text-gray-900">{queue.name}</div>
                                    <div className="text-sm text-gray-500">
                                        {queue.pending} gözləyən
                                        {queue.failed > 0 && (
                                            <span className="text-red-600 ml-2">
                                                • {queue.failed} uğursuz
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(queue.status)}`}>
                                    {getStatusText(queue.status)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Info */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                        Son yoxlama: {new Date().toLocaleTimeString('az')}
                    </p>
                </div>
            </div>
        </SettingsCard>
    );
});

QueueMonitor.displayName = 'QueueMonitor';

export default QueueMonitor;