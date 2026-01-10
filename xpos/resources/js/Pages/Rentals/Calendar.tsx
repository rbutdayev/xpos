import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import axios from 'axios';
import { CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { azLocale, monthNames } from '@/utils/fullcalendar-az-locale';

interface Branch {
    id: number;
    name: string;
}

interface Category {
    value: string;
    label: string;
    label_en: string;
    color: string | null;
}

interface InventoryItem {
    id: number;
    number: string;
    product: string;
    category: string | null;
}

interface CalendarEvent {
    id: string;
    rental_number: string;
    title: string;
    start: string;
    end: string;
    customer: {
        id: number | null;
        name: string;
        phone: string | null;
    };
    status: string;
    total_amount: number;
    branch_name: string | null;
    inventory_items: InventoryItem[];
    backgroundColor: string;
    borderColor: string;
    textColor: string;
}

interface Props {
    branches: Branch[];
    categories: Category[];
}

export default function Calendar({ branches, categories }: Props) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        branch_id: '',
        rental_category: '',
        status: '',
    });

    useEffect(() => {
        fetchAllBookings();
    }, [filters]);

    const fetchAllBookings = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.branch_id) params.append('branch_id', filters.branch_id);
            if (filters.rental_category) params.append('rental_category', filters.rental_category);
            if (filters.status) params.append('status', filters.status);

            const response = await axios.get(`/rental-inventory/calendar/bookings?${params.toString()}`);
            console.log('All bookings response:', response.data);
            if (response.data.success) {
                // Convert id to string for FullCalendar
                const eventsWithStringId = response.data.data.map((event: any) => ({
                    ...event,
                    id: String(event.id)
                }));
                console.log('Events for calendar:', eventsWithStringId);
                setEvents(eventsWithStringId);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info: any) => {
        const event = events.find(e => e.id === info.event.id);
        if (event) {
            setSelectedEvent(event);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            branch_id: '',
            rental_category: '',
            status: '',
        });
    };

    const statusOptions = [
        { value: 'draft', label: 'Qaralama' },
        { value: 'active', label: 'Aktiv' },
        { value: 'overdue', label: 'Gecikmiş' },
        { value: 'completed', label: 'Tamamlanmış' },
        { value: 'cancelled', label: 'Ləğv edilmiş' },
    ];

    const hasActiveFilters = filters.branch_id || filters.rental_category || filters.status;

    return (
        <AuthenticatedLayout>
            <Head title="Kirayə Təqvimi" />

            <div className="px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <CalendarIcon className="w-8 h-8 text-gray-400 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Kirayə Təqvimi
                                </h1>
                                <p className="text-sm text-gray-600">
                                    Bütün kirayə rezervasiyalarının təqvim görünüşü
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center ${
                                showFilters || hasActiveFilters
                                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <FunnelIcon className="w-4 h-4 mr-2" />
                            Filtrlər
                            {hasActiveFilters && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-white text-indigo-600 rounded-full">
                                    {Object.values(filters).filter(v => v).length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Filial
                                </label>
                                <select
                                    value={filters.branch_id}
                                    onChange={(e) => handleFilterChange('branch_id', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                >
                                    <option value="">Hamısı</option>
                                    {branches.map(branch => (
                                        <option key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Kateqoriya
                                </label>
                                <select
                                    value={filters.rental_category}
                                    onChange={(e) => handleFilterChange('rental_category', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                >
                                    <option value="">Hamısı</option>
                                    {categories.map(category => (
                                        <option key={category.value} value={category.value}>
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                >
                                    <option value="">Hamısı</option>
                                    {statusOptions.map(status => (
                                        <option key={status.value} value={status.value}>
                                            {status.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="mt-4 flex justify-end">
                                <button
                                    onClick={clearFilters}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Filtrləri təmizlə
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Calendar */}
                {loading ? (
                    <div className="bg-white shadow-sm rounded-lg p-8 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <div className="bg-white shadow-sm rounded-lg p-6">
                        <FullCalendar
                            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                            initialView="dayGridMonth"
                            events={events}
                            height="700px"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,dayGridWeek,listWeek'
                            }}
                            eventClick={handleEventClick}
                            eventDisplay="block"
                            displayEventTime={false}
                            locale="az-AZ"
                            titleFormat={function(date) {
                                const month = monthNames[date.date.month];
                                const year = date.date.year;
                                return `${month} ${year}`;
                            }}
                            dayHeaderFormat={{ weekday: 'short' }}
                            views={{
                                listWeek: {
                                    titleFormat: function(date) {
                                        const month = monthNames[date.date.month];
                                        const year = date.date.year;
                                        const day = date.date.day;
                                        return `${day} ${month} ${year}`;
                                    }
                                },
                                dayGridMonth: {
                                    titleFormat: function(date) {
                                        const month = monthNames[date.date.month];
                                        const year = date.date.year;
                                        return `${month} ${year}`;
                                    }
                                },
                                dayGridWeek: {
                                    titleFormat: function(date) {
                                        const month = monthNames[date.date.month];
                                        const year = date.date.year;
                                        const day = date.date.day;
                                        return `${day} ${month} ${year}`;
                                    }
                                }
                            }}
                        />
                    </div>
                )}

                {/* Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white shadow-sm rounded-lg p-4">
                        <p className="text-sm text-gray-600">Ümumi Kirayələr</p>
                        <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                    </div>
                    <div className="bg-green-50 shadow-sm rounded-lg p-4">
                        <p className="text-sm text-green-700">Aktiv</p>
                        <p className="text-2xl font-bold text-green-900">
                            {events.filter(e => e.status === 'active').length}
                        </p>
                    </div>
                    <div className="bg-red-50 shadow-sm rounded-lg p-4">
                        <p className="text-sm text-red-700">Gecikmiş</p>
                        <p className="text-2xl font-bold text-red-900">
                            {events.filter(e => e.status === 'overdue').length}
                        </p>
                    </div>
                    <div className="bg-blue-50 shadow-sm rounded-lg p-4">
                        <p className="text-sm text-blue-700">Tamamlanmış</p>
                        <p className="text-2xl font-bold text-blue-900">
                            {events.filter(e => e.status === 'completed').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Kirayə Məlumatı</h3>
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Kirayə Nömrəsi</label>
                                    <p className="text-sm text-gray-900">{selectedEvent.rental_number}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <p className="text-sm">
                                        <span
                                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                                            style={{ backgroundColor: selectedEvent.backgroundColor, color: '#ffffff' }}
                                        >
                                            {selectedEvent.status}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-500">Müştəri</label>
                                <p className="text-sm text-gray-900">{selectedEvent.customer.name}</p>
                                {selectedEvent.customer.phone && (
                                    <p className="text-sm text-gray-600">{selectedEvent.customer.phone}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Başlama Tarixi</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(selectedEvent.start).toLocaleDateString('az-AZ')}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Bitmə Tarixi</label>
                                    <p className="text-sm text-gray-900">
                                        {new Date(selectedEvent.end).toLocaleDateString('az-AZ')}
                                    </p>
                                </div>
                            </div>

                            {selectedEvent.branch_name && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Filial</label>
                                    <p className="text-sm text-gray-900">{selectedEvent.branch_name}</p>
                                </div>
                            )}

                            <div>
                                <label className="text-sm font-medium text-gray-500">Məbləğ</label>
                                <p className="text-sm text-gray-900">{selectedEvent.total_amount.toFixed(2)} AZN</p>
                            </div>

                            {selectedEvent.inventory_items && selectedEvent.inventory_items.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        İnventar Elementləri ({selectedEvent.inventory_items.length})
                                    </label>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {selectedEvent.inventory_items.map((item, index) => (
                                            <div key={index} className="bg-gray-50 rounded p-3">
                                                <p className="text-sm font-medium text-gray-900">{item.product}</p>
                                                <p className="text-xs text-gray-600">
                                                    № {item.number}
                                                    {item.category && ` • ${item.category}`}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Bağla
                            </button>
                            <a
                                href={`/rentals/${selectedEvent.id}`}
                                className="px-4 py-2 bg-slate-700 border border-transparent rounded-md text-sm font-medium text-white hover:bg-slate-600"
                            >
                                Ətraflı Bax
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
