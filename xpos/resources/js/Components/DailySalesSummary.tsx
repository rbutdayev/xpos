import React from 'react';
import {
    BanknotesIcon,
    CreditCardIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ShoppingCartIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useTranslations } from '@/Hooks/useTranslations';
import { useTranslation } from 'react-i18next';

interface DailySalesSummaryProps {
    summary: {
        today_total: number;
        today_count: number;
        cash_total: number;
        card_total: number;
        transfer_total: number;
        today_credit: number;
        yesterday_total: number;
        percentage_change: number;
        selected_date: string;
        previous_date: string;
    };
    selectedDate: string;
    onDateChange: (date: string) => void;
}

export default function DailySalesSummary({ summary, selectedDate, onDateChange }: DailySalesSummaryProps) {
    const { translatePaymentMethod } = useTranslations();
    const { t } = useTranslation('sales');
    const isIncrease = summary.percentage_change >= 0;

    const handlePreviousDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() - 1);
        onDateChange(date.toISOString().split('T')[0]);
    };

    const handleNextDay = () => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + 1);
        onDateChange(date.toISOString().split('T')[0]);
    };

    const handleToday = () => {
        onDateChange(new Date().toISOString().split('T')[0]);
    };

    const handleYesterday = () => {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        onDateChange(date.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isFutureDate = new Date(selectedDate) > new Date();

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('az-AZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-100 p-6 mb-6">
            {/* Date Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-blue-200">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{t('dailySummary.title')}</h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Preset Buttons */}
                    <button
                        onClick={handleToday}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                            isToday
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-blue-100 border border-gray-300'
                        }`}
                    >
                        {t('dailySummary.today')}
                    </button>
                    <button
                        onClick={handleYesterday}
                        className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-gray-700 hover:bg-blue-100 border border-gray-300 transition"
                    >
                        {t('dailySummary.yesterday')}
                    </button>

                    {/* Date Navigation */}
                    <div className="flex items-center gap-1 bg-white rounded-md border border-gray-300 p-1">
                        <button
                            onClick={handlePreviousDay}
                            className="p-1.5 hover:bg-gray-100 rounded transition"
                            title={t('dailySummary.previousDay')}
                        >
                            <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                        </button>

                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => onDateChange(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="px-2 py-1 text-sm border-0 focus:ring-0 text-center font-medium text-gray-700"
                        />

                        <button
                            onClick={handleNextDay}
                            disabled={isFutureDate}
                            className={`p-1.5 rounded transition ${
                                isFutureDate
                                    ? 'opacity-30 cursor-not-allowed'
                                    : 'hover:bg-gray-100'
                            }`}
                            title={t('dailySummary.nextDay')}
                        >
                            <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Header with Comparison */}
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-medium text-gray-700">{formatDisplayDate(selectedDate)}</h4>
                <div className="flex items-center gap-2">
                    {summary.percentage_change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm font-medium ${
                            isIncrease ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {isIncrease ? (
                                <ArrowTrendingUpIcon className="w-4 h-4" />
                            ) : (
                                <ArrowTrendingDownIcon className="w-4 h-4" />
                            )}
                            <span>{Math.abs(summary.percentage_change)}%</span>
                        </div>
                    )}
                    <span className="text-xs text-gray-500">{t('dailySummary.comparedToPrevious')}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Sales */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t('dailySummary.total')}</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.today_total} ₼</p>
                            <p className="text-xs text-gray-500 mt-1">{t('dailySummary.operations', { count: summary.today_count })}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Cash Payments */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{translatePaymentMethod('cash')}</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.cash_total} ₼</p>
                            <p className="text-xs text-gray-500 mt-1">{t('dailySummary.payment')}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <BanknotesIcon className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Card Payments */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{translatePaymentMethod('card')}</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.card_total} ₼</p>
                            <p className="text-xs text-gray-500 mt-1">{t('dailySummary.payment')}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <CreditCardIcon className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Credit/Debt */}
                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase mb-1">{t('dailySummary.debt')}</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.today_credit} ₼</p>
                            <p className="text-xs text-gray-500 mt-1">{t('dailySummary.unpaid')}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${
                            summary.today_credit > 0 ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                            <ExclamationTriangleIcon className={`w-6 h-6 ${
                                summary.today_credit > 0 ? 'text-red-600' : 'text-gray-400'
                            }`} />
                        </div>
                    </div>
                </div>
            </div>

            {summary.transfer_total > 0 && (
                <div className="mt-4 bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">{translatePaymentMethod('bank_transfer')}</p>
                        <p className="text-lg font-bold text-gray-900">{summary.transfer_total} ₼</p>
                    </div>
                </div>
            )}
        </div>
    );
}
