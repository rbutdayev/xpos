interface Props {
    status: string;
    type?: 'service' | 'general';
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

export default function StatusBadge({ status, type = 'general', size = 'md', showIcon = true }: Props) {
    const getStatusConfig = (status: string, type: string) => {
        if (type === 'service') {
            switch (status) {
                case 'pending':
                    return {
                        text: 'Gözləyir',
                        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        icon: '⏳'
                    };
                case 'in_progress':
                    return {
                        text: 'Davam edir',
                        color: 'bg-blue-100 text-blue-800 border-blue-200',
                        icon: '🔧'
                    };
                case 'completed':
                    return {
                        text: 'Tamamlandı',
                        color: 'bg-green-100 text-green-800 border-green-200',
                        icon: '✅'
                    };
                case 'cancelled':
                    return {
                        text: 'Ləğv edildi',
                        color: 'bg-red-100 text-red-800 border-red-200',
                        icon: '❌'
                    };
                default:
                    return {
                        text: status,
                        color: 'bg-gray-100 text-gray-800 border-gray-200',
                        icon: '❓'
                    };
            }
        }

        // General status
        switch (status) {
            case 'pending':
                return {
                    text: 'Gözləyir',
                    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                    icon: '⏳'
                };
            case 'completed':
                return {
                    text: 'Tamamlandı',
                    color: 'bg-green-100 text-green-800 border-green-200',
                    icon: '✅'
                };
            case 'cancelled':
                return {
                    text: 'Ləğv edildi',
                    color: 'bg-red-100 text-red-800 border-red-200',
                    icon: '❌'
                };
            case 'refunded':
                return {
                    text: 'Geri qaytarıldı',
                    color: 'bg-purple-100 text-purple-800 border-purple-200',
                    icon: '↩️'
                };
            case 'active':
            case 'aktiv':
                return {
                    text: 'Aktiv',
                    color: 'bg-green-100 text-green-800 border-green-200',
                    icon: '✅'
                };
            case 'inactive':
            case 'qeyri-aktiv':
                return {
                    text: 'Qeyri-aktiv',
                    color: 'bg-red-100 text-red-800 border-red-200',
                    icon: '⭕'
                };
            default:
                return {
                    text: status.toString(),
                    color: 'bg-gray-100 text-gray-800 border-gray-200',
                    icon: '❓'
                };
        }
    };

    const getSizeClasses = (size: string) => {
        switch (size) {
            case 'sm':
                return 'px-2 py-0.5 text-xs';
            case 'lg':
                return 'px-3 py-1 text-sm';
            default:
                return 'px-2.5 py-0.5 text-xs';
        }
    };

    const config = getStatusConfig(status, type);
    const sizeClasses = getSizeClasses(size);

    return (
        <span className={`inline-flex items-center ${sizeClasses} rounded-full font-medium border ${config.color}`}>
            {showIcon && <span className="mr-1">{config.icon}</span>}
            {config.text}
        </span>
    );
}