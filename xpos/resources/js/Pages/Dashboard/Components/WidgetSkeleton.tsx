interface WidgetSkeletonProps {
    className?: string;
    rows?: number;
}

export default function WidgetSkeleton({ 
    className = '', 
    rows = 3 
}: WidgetSkeletonProps) {
    return (
        <div className={`bg-white rounded-lg shadow p-6 animate-pulse ${className}`}>
            <div className="animate-pulse">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                
                {/* Content rows */}
                <div className="space-y-3">
                    {Array.from({ length: rows }).map((_, index) => (
                        <div key={index} className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="w-16 h-4 bg-gray-300 rounded"></div>
                        </div>
                    ))}
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                    <div className="h-2 bg-gray-200 rounded-full">
                        <div className="h-2 bg-gray-300 rounded-full w-2/3"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}