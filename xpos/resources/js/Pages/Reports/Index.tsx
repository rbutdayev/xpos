import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import toast from 'react-hot-toast';
import { 
    ChartBarIcon, 
    CubeIcon, 
    CurrencyDollarIcon, 
    UserIcon,
    DocumentTextIcon,
    CalendarIcon,
    WrenchScrewdriverIcon,
    PlusIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';

interface ReportType {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
}

interface RecentReport {
    id: number;
    type: string;
    name: string;
    generated_at: string;
    period: string;
    format: string;
}

interface ReportStats {
    total_reports_generated: number;
    this_month_reports: number;
    most_used_report: string;
    last_generated: string;
}

interface Props {
    reportTypes: ReportType[];
    recentReports: RecentReport[];
    stats: ReportStats;
}

export default function Index({ reportTypes = [], recentReports = [], stats }: Props) {
    const [selectedReportType, setSelectedReportType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const getIconComponent = (iconName: string) => {
        const iconMap: { [key: string]: React.ComponentType<any> } = {
            'CurrencyDollarIcon': CurrencyDollarIcon,
            'CubeIcon': CubeIcon,
            'ChartBarIcon': ChartBarIcon,
            'UserIcon': UserIcon,
            'WrenchScrewdriverIcon': WrenchScrewdriverIcon,
            'DocumentTextIcon': DocumentTextIcon
        };
        const IconComponent = iconMap[iconName] || DocumentTextIcon;
        return <IconComponent className="h-8 w-8" />;
    };

    const getColorClass = (color: string) => {
        const colorMap: { [key: string]: string } = {
            'blue': 'bg-blue-500',
            'green': 'bg-green-500',
            'purple': 'bg-purple-500',
            'indigo': 'bg-indigo-500',
            'yellow': 'bg-yellow-500',
            'red': 'bg-red-500'
        };
        return colorMap[color] || 'bg-gray-500';
    };

    const handleGenerateReport = () => {
        if (!selectedReportType || !dateFrom || !dateTo) {
            toast.error('Hesabat növü və tarix aralığını seçin');
            return;
        }

        setIsGenerating(true);
        router.post('/reports/generate', {
            type: selectedReportType,
            date_from: dateFrom,
            date_to: dateTo,
            format: 'table'
        }, {
            onSuccess: () => {
                toast.success('Hesabat uğurla yaradıldı');
            },
            onError: (errors) => {
                toast.error('Hesabat yaradılarkən xəta baş verdi');
            },
            onFinish: () => setIsGenerating(false)
        });
    };

    const quickStats = [
        { label: 'Ümumi Hesabatlar', value: stats?.total_reports_generated || 0, change: '', positive: true },
        { label: 'Bu Ay', value: stats?.this_month_reports || 0, change: '', positive: true },
        { label: 'Ən Çox İstifadə', value: stats?.most_used_report || 'N/A', change: '', positive: true },
        { label: 'Son Yaradılma', value: stats?.last_generated || 'N/A', change: '', positive: true },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Hesabatlar" />

            <div className="py-6">
                <div className="mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Hesabatlar</h1>
                        <p className="mt-2 text-gray-600">
                            İşinizin performansını analiz edin və qərar vermə üçün məlumatlar əldə edin
                        </p>
                    </div>

                    {/* Report Generator */}
                    <div className="bg-white rounded-lg shadow mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 flex items-center">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                Yeni Hesabat Yarat
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hesabat Növü
                                    </label>
                                    <select
                                        value={selectedReportType}
                                        onChange={(e) => setSelectedReportType(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    >
                                        <option value="">Seçin...</option>
                                        {reportTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Başlanğıc Tarixi
                                    </label>
                                    <input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Bitmə Tarixi
                                    </label>
                                    <input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={handleGenerateReport}
                                        disabled={isGenerating || !selectedReportType || !dateFrom || !dateTo}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-md font-medium flex items-center justify-center"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                                Yaradılır...
                                            </>
                                        ) : (
                                            <>
                                                <DocumentTextIcon className="h-4 w-4 mr-2" />
                                                Hesabat Yarat
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {quickStats.map((stat, index) => (
                            <div key={index} className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    </div>
                                    <div className={`text-sm font-medium ${
                                        stat.positive ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {stat.change}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Report Type Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportTypes.map((report, index) => (
                            <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                                <div className="p-6 h-full">
                                    <div className="flex items-start">
                                        <div className={`${getColorClass(report.color)} p-3 rounded-lg text-white mr-4`}>
                                            {getIconComponent(report.icon)}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                {report.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {report.description}
                                            </p>
                                            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                                                <span>Yuxarıda seçin və yaradın</span>
                                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Recent Reports Section */}
                    <div className="mt-12">
                        <div className="bg-white rounded-lg shadow">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">Son Hesabatlar</h3>
                                    <ClockIcon className="h-5 w-5 text-gray-400" />
                                </div>
                            </div>
                            <div className="p-6">
                                {recentReports.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentReports.map((report) => (
                                            <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                <div className="flex items-center">
                                                    <DocumentTextIcon className="h-8 w-8 text-blue-500 mr-4" />
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">{report.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {report.period} • {report.format}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(report.generated_at).toLocaleDateString('az-AZ')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Hesabat yoxdur</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            İlk hesabatınızı yaratmaq üçün yuxarıdakı formu istifadə edin.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}