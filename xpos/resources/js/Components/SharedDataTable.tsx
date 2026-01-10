import React, { ReactNode, useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    ChevronUpDownIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon,
    DocumentTextIcon,
    EllipsisVerticalIcon,
    EyeIcon,
    PencilIcon,
    TrashIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import AdvancedPagination from './AdvancedPagination';

export interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    searchable?: boolean;
    render?: (item: any) => ReactNode;
    className?: string;
    headerClassName?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    hideOnMobile?: boolean; // Hide this column on mobile devices
    mobileLabel?: string; // Alternative label for mobile detail view
}

export interface FilterOption {
    value: string;
    label: string;
}

export interface Filter {
    key: string;
    type: 'dropdown' | 'date' | 'text' | 'daterange';
    label: string;
    placeholder?: string;
    options?: FilterOption[];
    value: any;
    onChange: (value: any) => void;
    className?: string;
}

export interface Action {
    label: string;
    href?: string | ((item: any) => string);
    onClick?: (item: any) => void;
    className?: string;
    condition?: (item: any) => boolean;
    icon?: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'view' | 'edit' | 'delete';
}

export type ActionsConfig = Action[] | ((item: any) => Action[]);

export interface BulkAction {
    label: string;
    onClick: (selectedIds: (string | number)[]) => void;
    className?: string;
    icon?: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'view' | 'edit';
    condition?: () => boolean;
}

interface SharedDataTableProps {
    // Core data
    data: {
        data: any[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    
    // Configuration
    columns: Column[];
    actions?: ActionsConfig;
    bulkActions?: BulkAction[] | ((selectedIds: (string | number)[], selectedItems: any[]) => BulkAction[]);
    
    // Search & Filter
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filters?: Filter[];
    
    // Sorting
    onSort?: (column: string) => void;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    
    // Pagination
    onPerPageChange?: (perPage: number) => void;
    
    // Actions
    onSearch?: () => void;
    onReset?: () => void;
    onRefresh?: () => void;
    
    // UI Configuration
    title?: string;
    subtitle?: string;
    createButton?: {
        label: string;
        href: string;
        className?: string;
    };
    
    // Empty state
    emptyState?: {
        icon?: ReactNode;
        title: string;
        description: string;
        action?: ReactNode;
    };
    
    // Styling
    className?: string;
    tableClassName?: string;
    
    // Advanced features
    selectable?: boolean;
    rowClassName?: (item: any) => string;
    expandable?: boolean;
    expandedContent?: (item: any) => ReactNode;
    
    // Performance
    loading?: boolean;
    sticky?: boolean;
    dense?: boolean;
    
    // Layout
    fullWidth?: boolean;
    
    // Custom ID field
    idField?: string;
    
    // Hide UI elements
    hideSearch?: boolean;
    hidePagination?: boolean;
    hideFilters?: boolean;
    hidePerPageSelect?: boolean;

    // Mobile-specific features
    mobileClickable?: boolean; // Make rows clickable on mobile
    onMobileRowClick?: (item: any) => void; // Handler for mobile row clicks
    hideMobileActions?: boolean; // Hide action buttons on mobile (default: true)

    // Row interaction
    onRowDoubleClick?: (item: any) => void; // Handler for double-click on row
    onRowClick?: (item: any) => void; // Handler for single click on row
}

export default function SharedDataTable({
    data,
    columns,
    actions,
    bulkActions = [],

    searchValue = '',
    onSearchChange,
    searchPlaceholder,
    filters = [],
    
    onSort,
    sortField,
    sortDirection,
    
    onPerPageChange,
    
    onSearch,
    onReset,
    onRefresh,
    
    title,
    subtitle,
    createButton,
    
    emptyState,
    
    className = "",
    tableClassName = "",
    
    selectable = false,
    rowClassName,
    expandable = false,
    expandedContent,
    
    loading = false,
    sticky = false,
    dense = false,
    
    fullWidth = false,
    
    idField = 'id',
    
    hideSearch = false,
    hidePagination = false,
    hideFilters = false,
    hidePerPageSelect = false,

    mobileClickable = false,
    onMobileRowClick,
    hideMobileActions = true,

    onRowDoubleClick,
    onRowClick
}: SharedDataTableProps) {
    const { t } = useTranslation('common');
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [mobileDetailItem, setMobileDetailItem] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Get translated placeholder if not provided
    const effectiveSearchPlaceholder = searchPlaceholder || t('dataTable.searchPlaceholder');

    // Compute actual bulk actions based on selection
    const getSelectedItems = () => {
        return data.data.filter((item) => selectedIds.includes(item[idField]));
    };

    const effectiveBulkActions = typeof bulkActions === 'function'
        ? bulkActions(selectedIds, getSelectedItems())
        : (bulkActions || []);

    // Detect mobile screen size
    React.useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // lg breakpoint
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Only select items that are not disabled
            setSelectedIds(data.data.filter(item => !item.disabled).map(item => item[idField]));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string | number, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    // Expand handlers
    const handleToggleExpand = (id: string | number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Mobile row click handler - Auto-enable mobile features
    const handleMobileRowClick = (item: any) => {
        // Auto-enable mobile clickable behavior on mobile screens
        if (isMobile && (mobileClickable || true)) {
            if (onMobileRowClick) {
                onMobileRowClick(item);
            } else {
                setMobileDetailItem(item);
            }
        }
    };
    
    // Auto-responsive settings
    const effectiveMobileClickable = isMobile ? true : mobileClickable;
    const effectiveHideMobileActions = isMobile ? true : hideMobileActions;

    // Filter columns based on mobile visibility - Auto-responsive behavior
    const visibleColumns = isMobile
        ? (() => {
            // If columns have explicit mobile configuration, use it
            const explicitlyConfiguredColumns = columns.filter(col => col.hideOnMobile === false || col.hideOnMobile === undefined);
            const hasExplicitConfig = columns.some(col => col.hideOnMobile !== undefined);
            
            if (hasExplicitConfig) {
                return columns.filter(col => !col.hideOnMobile);
            }
            
            // Auto-responsive: Show first 2-3 most important columns on mobile
            // Priority: columns without width restrictions, then columns with shorter labels
            const prioritizedColumns = [...columns]
                .map((col, index) => ({ ...col, originalIndex: index }))
                .sort((a, b) => {
                    // Prioritize columns without fixed width (more flexible)
                    const aHasWidth = !!a.width;
                    const bHasWidth = !!b.width;
                    if (aHasWidth !== bHasWidth) {
                        return aHasWidth ? 1 : -1;
                    }
                    
                    // Prioritize columns with shorter labels (better for mobile)
                    const aLabelLength = (a.mobileLabel || a.label).length;
                    const bLabelLength = (b.mobileLabel || b.label).length;
                    if (aLabelLength !== bLabelLength) {
                        return aLabelLength - bLabelLength;
                    }
                    
                    // Keep original order as fallback
                    return a.originalIndex - b.originalIndex;
                });
            
            // Return first 3 columns maximum for mobile
            return prioritizedColumns.slice(0, 3);
        })()
        : columns;

    const getAlignmentClass = (align?: string) => {
        switch (align) {
            case 'center': return 'text-center';
            case 'right': return 'text-right';
            default: return 'text-left';
        }
    };

    const getActionVariantClass = (variant?: string) => {
        const baseClasses = 'inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200';
        switch (variant) {
            case 'primary': return `${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200`;
            case 'secondary': return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
            case 'danger': return `${baseClasses} bg-red-100 text-red-700 hover:bg-red-200`;
            case 'success': return `${baseClasses} bg-green-100 text-green-700 hover:bg-green-200`;
            case 'view': return `${baseClasses} bg-blue-100 text-blue-700 hover:bg-blue-200`;
            case 'edit': return `${baseClasses} bg-amber-100 text-amber-700 hover:bg-amber-200`;
            case 'delete': return `${baseClasses} bg-red-100 text-red-700 hover:bg-red-200`;
            default: return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
        }
    };

    return (
        <div className={`space-y-6 ${fullWidth ? 'w-full max-w-full' : 'w-full max-w-7xl mx-auto'} overflow-hidden ${className}`}>
            {/* Header */}
            {(title || createButton || onRefresh) && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg w-full">
                    <div className="p-6 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                            <div>
                                {title && (
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {title}
                                    </h2>
                                )}
                                {subtitle && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {onRefresh && (
                                    <button
                                        onClick={onRefresh}
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                    >
                                        {t('dataTable.refresh')}
                                    </button>
                                )}
                                
                                {createButton && (
                                    <Link
                                        href={createButton.href}
                                        className={`px-4 py-2 text-sm font-medium text-white bg-slate-700 border border-transparent rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 ${createButton.className || ''}`}
                                    >
                                        {createButton.label}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            {((!hideSearch && onSearchChange) || (!hideFilters && filters.length > 0)) && (
                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                    <div className="p-6">
                        <div className="space-y-4">
                            {/* Search Bar and Filter Toggle */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                {!hideSearch && onSearchChange && (
                                    <div className="flex-1">
                                        <div className="relative">
                                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchValue}
                                                onChange={(e) => onSearchChange(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
                                                placeholder={effectiveSearchPlaceholder}
                                                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                            />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-2">
                                    {!hideFilters && filters.length > 0 && (
                                        <button
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            <FunnelIcon className="w-4 h-4" />
                                            {t('dataTable.filters')}
                                        </button>
                                    )}

                                    {onSearch && (
                                        <button
                                            onClick={onSearch}
                                            className="px-4 py-2 text-sm font-medium text-white bg-slate-700 rounded-md hover:bg-slate-600"
                                        >
                                            {t('dataTable.search')}
                                        </button>
                                    )}
                                    
                                    {onReset && (
                                        <button
                                            onClick={onReset}
                                            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            <XMarkIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Advanced Filters */}
                            {showFilters && filters.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                                    {filters.map((filter) => (
                                        <div key={filter.key} className={filter.className}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {filter.label}
                                            </label>
                                            
                                            {filter.type === 'dropdown' ? (
                                                <select
                                                    value={filter.value}
                                                    onChange={(e) => filter.onChange(e.target.value)}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                                >
                                                    <option value="">{filter.placeholder || t('dataTable.selectPlaceholder')}</option>
                                                    {filter.options?.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : filter.type === 'date' ? (
                                                <input
                                                    type="date"
                                                    value={filter.value}
                                                    onChange={(e) => filter.onChange(e.target.value)}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={filter.value}
                                                    onChange={(e) => filter.onChange(e.target.value)}
                                                    placeholder={filter.placeholder}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-slate-500 focus:ring-slate-500"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions - Sticky Top Toolbar */}
            {selectable && selectedIds.length > 0 && effectiveBulkActions.length > 0 && (
                <div className="sticky top-0 z-20 mb-4">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-2xl rounded-xl p-4 border-2 border-blue-400">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/20 rounded-lg px-3 py-2">
                                        <span className="text-lg font-bold text-white">
                                            {selectedIds.length}
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-white">
                                        {t('dataTable.selected', { count: selectedIds.length })}
                                    </span>
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="ml-2 text-white/80 hover:text-white transition-colors"
                                        title={t('dataTable.clearSelection')}
                                    >
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {effectiveBulkActions.map((action, index) => {
                                        const getVariantClasses = () => {
                                            switch (action.variant) {
                                                case 'danger':
                                                    return 'bg-red-500 hover:bg-red-600 text-white border-red-400';
                                                case 'success':
                                                    return 'bg-green-500 hover:bg-green-600 text-white border-green-400';
                                                case 'secondary':
                                                    return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-400';
                                                case 'view':
                                                    return 'bg-slate-500 hover:bg-slate-600 text-white border-slate-400';
                                                case 'edit':
                                                    return 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-400';
                                                default:
                                                    return 'bg-white hover:bg-gray-50 text-slate-700 border-white';
                                            }
                                        };

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => action.onClick(selectedIds)}
                                                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${getVariantClasses()} ${action.className || ''}`}
                                            >
                                                {action.icon && <span>{action.icon}</span>}
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                </div>
            )}

            {/* Data Table - Scrollable Container */}
            <div className="bg-white shadow-sm sm:rounded-lg w-full max-w-full overflow-hidden max-h-[calc(100vh-300px)] overflow-y-auto">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">{t('dataTable.loading')}</p>
                        </div>
                    </div>
                )}

                {data.data.length > 0 ? (
                    <>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg w-full">
                            <table className={`w-full divide-y divide-gray-200 ${tableClassName}`}>
                                <thead className={`bg-gray-50 ${sticky ? 'sticky top-0 z-10' : ''}`}>
                                    <tr>
                                        {/* Selection Column */}
                                        {selectable && !isMobile && (
                                            <th className="px-3 py-2 w-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === data.data.length && data.data.length > 0}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="rounded border-gray-300 text-slate-600 focus:ring-slate-500"
                                                />
                                            </th>
                                        )}

                                        {/* Expand Column */}
                                        {expandable && !isMobile && (
                                            <th className="px-3 py-2 w-4"></th>
                                        )}

                                        {/* Data Columns */}
                                        {visibleColumns.map((column) => (
                                            <th
                                                key={column.key}
                                                className={`px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wider ${getAlignmentClass(column.align)} ${column.headerClassName || ''} border-r border-gray-200 last:border-r-0`}
                                                style={column.width ? { width: column.width } : {}}
                                            >
                                                {column.sortable && onSort ? (
                                                    <button
                                                        onClick={() => onSort(column.key)}
                                                        className="group inline-flex items-center"
                                                    >
                                                        {column.label}
                                                        <span className="ml-2 flex-none rounded text-gray-400 group-hover:visible group-focus:visible">
                                                            {sortField === column.key ? (
                                                                sortDirection === 'desc' ? (
                                                                    <ChevronDownIcon className="h-3 w-3" />
                                                                ) : (
                                                                    <ChevronUpIcon className="h-3 w-3" />
                                                                )
                                                            ) : (
                                                                <ChevronUpDownIcon className="h-3 w-3 invisible group-hover:visible" />
                                                            )}
                                                        </span>
                                                    </button>
                                                ) : (
                                                    column.label
                                                )}
                                            </th>
                                        ))}

                                        {/* Actions Column */}
                                        {actions && (Array.isArray(actions) ? actions.length > 0 : true) && !(isMobile && effectiveHideMobileActions) && (
                                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                                                {t('dataTable.operations')}
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.data.map((item, index) => {
                                        const itemId = item[idField];
                                        const isExpanded = expandedRows.has(itemId);
                                        const isSelected = selectedIds.includes(itemId);
                                        const customRowClass = rowClassName ? rowClassName(item) : '';

                                        return (
                                            <React.Fragment key={itemId || index}>
                                                <tr
                                                    className={`transition-all duration-200 ${customRowClass} ${isMobile && effectiveMobileClickable ? 'cursor-pointer' : ''} ${onRowDoubleClick || onRowClick ? 'cursor-pointer' : ''} ${
                                                        isSelected
                                                            ? 'bg-blue-100 hover:bg-blue-200 ring-2 ring-slate-300 ring-inset'
                                                            : 'hover:bg-blue-50'
                                                    }`}
                                                    onClick={(e) => {
                                                        // Prevent click when clicking on checkbox or action buttons
                                                        if ((e.target as HTMLElement).closest('input[type="checkbox"]') ||
                                                            (e.target as HTMLElement).closest('button') ||
                                                            (e.target as HTMLElement).closest('a')) {
                                                            return;
                                                        }

                                                        if (isMobile) {
                                                            handleMobileRowClick(item);
                                                        } else if (onRowClick) {
                                                            onRowClick(item);
                                                        }
                                                    }}
                                                    onDoubleClick={(e) => {
                                                        // Prevent double-click when clicking on checkbox or action buttons
                                                        if ((e.target as HTMLElement).closest('input[type="checkbox"]') ||
                                                            (e.target as HTMLElement).closest('button') ||
                                                            (e.target as HTMLElement).closest('a')) {
                                                            return;
                                                        }

                                                        if (!isMobile && onRowDoubleClick) {
                                                            onRowDoubleClick(item);
                                                        }
                                                    }}
                                                >
                                                    {/* Selection */}
                                                     {selectable && !isMobile && (
                                                        <td className="px-3 py-2 whitespace-nowrap w-12 border-r border-gray-100">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(itemId)}
                                                                onChange={(e) => handleSelectRow(itemId, e.target.checked)}
                                                                disabled={item.disabled === true}
                                                                className="rounded border-gray-300 text-slate-600 focus:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            />
                                                        </td>
                                                    )}

                                                    {/* Expand */}
                                                     {expandable && !isMobile && (
                                                        <td className="px-3 py-2 whitespace-nowrap w-10 border-r border-gray-100">
                                                            <button
                                                                onClick={() => handleToggleExpand(itemId)}
                                                                className="text-gray-400 hover:text-gray-600"
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUpIcon className="h-4 w-4" />
                                                                ) : (
                                                                    <ChevronDownIcon className="h-4 w-4" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    )}

                                                    {/* Data */}
                                                    {visibleColumns.map((column) => (
                                                         <td
                                                            key={column.key}
                                                            className={`px-3 py-2 text-sm ${getAlignmentClass(column.align)} ${column.className || ''} border-r border-gray-100 last:border-r-0`}
                                                            style={column.width ? { width: column.width } : {}}
                                                        >
                                                            {column.render ? column.render(item) : (
                                                                <span className="text-sm text-gray-900 font-medium">
                                                                    {item[column.key] || '-'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    ))}

                                                    {/* Actions */}
                                                     {(() => {
                                                        const itemActions = typeof actions === 'function' ? actions(item) : actions;
                                                        return Array.isArray(itemActions) && itemActions.length > 0 && !(isMobile && effectiveHideMobileActions) && (
                                                        <td className="px-3 py-2 whitespace-nowrap text-center text-sm font-medium w-32">
                                                            <div className="flex justify-center items-center gap-2">
                                                                {itemActions.map((action, actionIndex) => {
                                                                    if (action.condition && !action.condition(item)) {
                                                                        return null;
                                                                    }

                                                                    if (action.href) {
                                                                        const href = typeof action.href === 'function'
                                                                            ? action.href(item)
                                                                            : action.href.replace(':id', itemId);

                                                                        return (
                                                                            <Link
                                                                                key={actionIndex}
                                                                                href={href}
                                                                                className={`${getActionVariantClass(action.variant)} ${action.className || ''}`}
                                                                            >
                                                                                {action.icon ? (
                                                                                    <span>{action.icon}</span>
                                                                                ) : (
                                                                                    <>
                                                                                        {action.variant === 'view' && <EyeIcon className="w-4 h-4 mr-1" />}
                                                                                        {action.variant === 'edit' && <PencilIcon className="w-4 h-4 mr-1" />}
                                                                                        {action.variant === 'delete' && <TrashIcon className="w-4 h-4 mr-1" />}
                                                                                        {action.label}
                                                                                    </>
                                                                                )}
                                                                            </Link>
                                                                        );
                                                                    }

                                                                    return (
                                                                        <button
                                                                            key={actionIndex}
                                                                            onClick={() => action.onClick && action.onClick(item)}
                                                                            className={`${getActionVariantClass(action.variant)} ${action.className || ''}`}
                                                                        >
                                                                            {action.icon ? (
                                                                                <span>{action.icon}</span>
                                                                            ) : (
                                                                                <>
                                                                                    {action.variant === 'view' && <EyeIcon className="w-4 h-4 mr-1" />}
                                                                                    {action.variant === 'edit' && <PencilIcon className="w-4 h-4 mr-1" />}
                                                                                    {action.variant === 'delete' && <TrashIcon className="w-4 h-4 mr-1" />}
                                                                                    {action.label}
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        );
                                                    })()}
                                                </tr>
                                                
                                                {/* Expanded Content */}
                                                {expandable && isExpanded && expandedContent && !isMobile && (
                                                    <tr>
                                                         <td colSpan={visibleColumns.length + (selectable && !isMobile ? 1 : 0) + (expandable && !isMobile ? 1 : 0) + (actions && (Array.isArray(actions) ? actions.length > 0 : true) && !(isMobile && effectiveHideMobileActions) ? 1 : 0)} className="px-4 py-3 bg-gray-50">
                                                            {expandedContent(item)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {!hidePagination && (
                            <AdvancedPagination 
                                data={data} 
                                onPerPageChange={onPerPageChange}
                                showPerPageSelector={!hidePerPageSelect}
                            />
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="p-12 text-center">
                        {emptyState?.icon ? (
                            <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                                {emptyState.icon}
                            </div>
                        ) : (
                            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        )}
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {emptyState?.title || t('dataTable.emptyTitle')}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {emptyState?.description || t('dataTable.emptyDescription')}
                        </p>
                        {emptyState?.action && emptyState.action}
                    </div>
                )}
            </div>

            {/* Mobile Detail Modal */}
            {isMobile && mobileDetailItem && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50" onClick={() => setMobileDetailItem(null)}>
                    <div className="relative top-20 mx-auto p-5 border w-11/12 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {t('dataTable.detailsTitle')}
                            </h3>
                            <button
                                onClick={() => setMobileDetailItem(null)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Modal Body - Display all columns */}
                        <div className="mt-4 space-y-3">
                            {columns.map((column) => {
                                const value = column.render
                                    ? column.render(mobileDetailItem)
                                    : mobileDetailItem[column.key];

                                return (
                                    <div key={column.key} className="border-b border-gray-100 pb-3">
                                        <label className="block text-sm font-medium text-gray-600 mb-1">
                                            {column.mobileLabel || column.label}
                                        </label>
                                        <div className="text-base text-gray-900">
                                            {value || '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Actions */}
                        {(() => {
                            const modalActions = typeof actions === 'function' ? actions(mobileDetailItem) : actions;
                            return Array.isArray(modalActions) && modalActions.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex flex-col gap-2">
                                    {modalActions.map((action, actionIndex) => {
                                        if (action.condition && !action.condition(mobileDetailItem)) {
                                            return null;
                                        }

                                        const itemId = mobileDetailItem[idField];

                                        if (action.href) {
                                            const href = typeof action.href === 'function'
                                                ? action.href(mobileDetailItem)
                                                : action.href.replace(':id', itemId);

                                            return (
                                                <Link
                                                    key={actionIndex}
                                                    href={href}
                                                    className={`${getActionVariantClass(action.variant)} justify-center ${action.className || ''}`}
                                                >
                                                    {action.icon ? (
                                                        <span className="mr-2">{action.icon}</span>
                                                    ) : (
                                                        <>
                                                            {action.variant === 'view' && <EyeIcon className="w-4 h-4 mr-2" />}
                                                            {action.variant === 'edit' && <PencilIcon className="w-4 h-4 mr-2" />}
                                                            {action.variant === 'delete' && <TrashIcon className="w-4 h-4 mr-2" />}
                                                        </>
                                                    )}
                                                    {action.label}
                                                </Link>
                                            );
                                        }

                                        return (
                                            <button
                                                key={actionIndex}
                                                onClick={() => {
                                                    action.onClick && action.onClick(mobileDetailItem);
                                                    setMobileDetailItem(null);
                                                }}
                                                className={`${getActionVariantClass(action.variant)} justify-center ${action.className || ''}`}
                                            >
                                                {action.icon ? (
                                                    <span className="mr-2">{action.icon}</span>
                                                ) : (
                                                    <>
                                                        {action.variant === 'view' && <EyeIcon className="w-4 h-4 mr-2" />}
                                                        {action.variant === 'edit' && <PencilIcon className="w-4 h-4 mr-2" />}
                                                        {action.variant === 'delete' && <TrashIcon className="w-4 h-4 mr-2" />}
                                                    </>
                                                )}
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            );
                        })()}

                        {/* Close Button */}
                        <div className="mt-6">
                            <button
                                onClick={() => setMobileDetailItem(null)}
                                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                            >
                                {t('dataTable.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}