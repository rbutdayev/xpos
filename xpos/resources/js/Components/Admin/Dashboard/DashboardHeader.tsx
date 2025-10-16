interface DashboardHeaderProps {
    title: string;
    subtitle: string;
    progress: number;
    completedModules: number;
    totalModules: number;
}

export default function DashboardHeader({ 
    title, 
    subtitle, 
    progress, 
    completedModules, 
    totalModules 
}: DashboardHeaderProps) {
    return (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{title}</h1>
                        <p className="text-blue-100 mt-2">{subtitle}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-blue-100 text-sm mb-1">Sistem İnkişafı</div>
                        <div className="text-2xl font-bold">{progress}%</div>
                        <div className="text-xs text-blue-200">
                            {completedModules}/{totalModules} modul hazır
                        </div>
                        <div className="text-xs text-blue-300 mt-1">SharedDataTable hazır</div>
                    </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="bg-blue-700 rounded-full h-2">
                        <div 
                            className="bg-white rounded-full h-2 transition-all duration-300" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}