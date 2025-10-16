import { Link } from '@inertiajs/react';

export interface ModuleCard {
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    status: 'completed' | 'in-progress' | 'pending';
    color: string;
}

interface ModuleCardProps {
    module: ModuleCard;
    index: number;
}

export default function ModuleCard({ module, index }: ModuleCardProps) {
    const IconComponent = module.icon;
    const isClickable = module.status === 'completed';
    
    const getStatusBadge = (status: ModuleCard['status']) => {
        switch (status) {
            case 'completed':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Hazır</span>;
            case 'in-progress':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Davam edir</span>;
            case 'pending':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Gözləyir</span>;
        }
    };

    const CardContent = (
        <div className={`
            relative group bg-white p-6 rounded-lg border-2 border-gray-200 
            ${isClickable ? 'hover:border-blue-300 hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'}
            transition-all duration-200
        `}>
            <div className="flex items-center justify-between mb-4">
                <div className={`
                    inline-flex p-3 rounded-lg text-white
                    ${module.color}
                `}>
                    <IconComponent className="h-6 w-6" />
                </div>
                {getStatusBadge(module.status)}
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                {module.title}
                {module.status === 'completed' && (
                    <span className="ml-2 text-xs text-green-600 font-normal">✓ Hazır</span>
                )}
            </h3>
            
            <p className="text-sm text-gray-500">
                {module.description}
            </p>
            
            {isClickable && (
                <div className="mt-4 text-blue-600 text-sm font-medium group-hover:text-blue-800">
                    Açın →
                </div>
            )}
        </div>
    );

    return isClickable ? (
        <Link key={index} href={module.href}>
            {CardContent}
        </Link>
    ) : (
        <div key={index}>
            {CardContent}
        </div>
    );
}