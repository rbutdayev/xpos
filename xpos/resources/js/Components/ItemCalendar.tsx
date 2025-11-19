import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { azLocale, monthNames } from '@/utils/fullcalendar-az-locale';

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
    backgroundColor: string;
    borderColor: string;
}

interface ItemCalendarProps {
    inventoryId: number;
    height?: string;
}

export default function ItemCalendar({ inventoryId, height = '600px' }: ItemCalendarProps) {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        fetchBookings();
    }, [inventoryId]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/rental-inventory/${inventoryId}/bookings`);
            console.log('Bookings response:', response.data);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="bg-white rounded-lg shadow p-4">
                <FullCalendar
                    plugins={[dayGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    events={events}
                    height={height}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    }}
                    locale="az-AZ"
                    titleFormat={function(date) {
                        const month = monthNames[date.date.month];
                        const year = date.date.year;
                        return `${month} ${year}`;
                    }}
                    dayHeaderFormat={{ weekday: 'short' }}
                    views={{
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
                    eventClick={handleEventClick}
                    eventDisplay="block"
                    displayEventTime={false}
                    eventTextColor="#ffffff"
                />
            </div>

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
                        {events.filter(e => e.status === 'completed' || e.status === 'returned').length}
                    </p>
                </div>
            </div>

            {/* Event Details Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
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

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Kirayə Nömrəsi</label>
                                <p className="text-sm text-gray-900">{selectedEvent.rental_number}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Müştəri</label>
                                <p className="text-sm text-gray-900">{selectedEvent.customer.name}</p>
                                {selectedEvent.customer.phone && (
                                    <p className="text-sm text-gray-600">{selectedEvent.customer.phone}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Tarixlər</label>
                                <p className="text-sm text-gray-900">
                                    {new Date(selectedEvent.start).toLocaleDateString('az-AZ')} - {new Date(selectedEvent.end).toLocaleDateString('az-AZ')}
                                </p>
                            </div>
                            {selectedEvent.branch_name && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Filial</label>
                                    <p className="text-sm text-gray-900">{selectedEvent.branch_name}</p>
                                </div>
                            )}
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
                            <div>
                                <label className="text-sm font-medium text-gray-500">Məbləğ</label>
                                <p className="text-sm text-gray-900">{selectedEvent.total_amount.toFixed(2)} AZN</p>
                            </div>
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
                                className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                Ətraflı Bax
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
