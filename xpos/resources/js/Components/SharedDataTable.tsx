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

export interface BulkAction {
    label: string;
    onClick: (selectedIds: (string | number)[]) => void;
    className?: string;
    icon?: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
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
    actions?: Action[];
    bulkActions?: BulkAction[];
    
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
}

export default function SharedDataTable({
    data,
    columns,
    actions = [],
    bulkActions = [],
    
    searchValue = '',
    onSearchChange,
    searchPlaceholder = "Axtar...",
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
    hidePerPageSelect = false
}: SharedDataTableProps) {
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Selection handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(data.data.map(item => item[idField]));
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
                                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Yenilə
                                    </button>
                                )}
                                
                                {createButton && (
                                    <Link
                                        href={createButton.href}
                                        className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${createButton.className || ''}`}
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
                                                placeholder={searchPlaceholder}
                                                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                                            Filtrlər
                                        </button>
                                    )}
                                    
                                    {onSearch && (
                                        <button
                                            onClick={onSearch}
                                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                        >
                                            Axtar
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
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="">{filter.placeholder || 'Seçin'}</option>
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
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={filter.value}
                                                    onChange={(e) => filter.onChange(e.target.value)}
                                                    placeholder={filter.placeholder}
                                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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

            {/* Bulk Actions */}
            {selectable && selectedIds.length > 0 && bulkActions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                            {selectedIds.length} element seçildi
                        </span>
                        <div className="flex items-center gap-2">
                            {bulkActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={() => action.onClick(selectedIds)}
                                    className={`px-3 py-1 text-sm font-medium rounded ${
                                        action.variant === 'danger' 
                                            ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                                            : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                                    } ${action.className || ''}`}
                                >
                                    {action.icon && <span className="mr-1">{action.icon}</span>}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white shadow-sm sm:rounded-lg w-full max-w-full overflow-hidden">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Yüklənir...</p>
                        </div>
                    </div>
                )}

                {data.data.length > 0 ? (
                    <>
                        <div className="overflow-x-auto border border-gray-200 rounded-lg w-full">
                            <table className={`w-full min-w-[1200px] divide-y divide-gray-200 ${tableClassName}`}>
                                <thead className={`bg-gray-50 ${sticky ? 'sticky top-0 z-10' : ''}`}>
                                    <tr>
                                        {/* Selection Column */}
                                        {selectable && (
                                            <th className="px-8 py-6 w-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.length === data.data.length && data.data.length > 0}
                                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </th>
                                        )}
                                        
                                        {/* Expand Column */}
                                        {expandable && (
                                            <th className="px-8 py-6 w-4"></th>
                                        )}

                                        {/* Data Columns */}
                                        {columns.map((column) => (
                                            <th 
                                                key={column.key}
                                                className={`px-3 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider ${getAlignmentClass(column.align)} ${column.headerClassName || ''} border-r border-gray-200 last:border-r-0`}
                                                style={column.width ? { width: column.width, minWidth: column.width } : { minWidth: '100px' }}
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
                                        {actions.length > 0 && (
                                            <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                                                Əməliyyatlar
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.data.map((item, index) => {
                                        const itemId = item[idField];
                                        const isExpanded = expandedRows.has(itemId);
                                        const customRowClass = rowClassName ? rowClassName(item) : '';
                                        
                                        return (
                                            <React.Fragment key={itemId || index}>
                                                <tr className={`hover:bg-blue-50 transition-colors duration-150 ${customRowClass}`}>
                                                    {/* Selection */}
                                                     {selectable && (
                                                        <td className="px-3 py-3 whitespace-nowrap w-12 border-r border-gray-100">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.includes(itemId)}
                                                                onChange={(e) => handleSelectRow(itemId, e.target.checked)}
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            />
                                                        </td>
                                                    )}
                                                    
                                                    {/* Expand */}
                                                     {expandable && (
                                                        <td className="px-3 py-3 whitespace-nowrap w-10 border-r border-gray-100">
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
                                                    {columns.map((column) => (
                                                         <td 
                                                            key={column.key}
                                                            className={`px-3 ${dense ? 'py-2' : 'py-3'} text-sm ${getAlignmentClass(column.align)} ${column.className || ''} border-r border-gray-100 last:border-r-0`}
                                                            style={column.width ? { width: column.width, minWidth: column.width, maxWidth: column.width } : { minWidth: '100px' }}
                                                        >
                                                            {column.render ? column.render(item) : (
                                                                <span className="text-base text-gray-900 font-medium">
                                                                    {item[column.key] || '-'}
                                                                </span>
                                                            )}
                                                        </td>
                                                    ))}

                                                    {/* Actions */}
                                                     {actions.length > 0 && (
                                                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium w-32">
                                                            <div className="flex justify-center items-center gap-2">
                                                                {actions.map((action, actionIndex) => {
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
                                                    )}
                                                </tr>
                                                
                                                {/* Expanded Content */}
                                                {expandable && isExpanded && expandedContent && (
                                                    <tr>
                                                         <td colSpan={columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-8 py-7 bg-gray-50">
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
                            {emptyState?.title || 'Məlumat tapılmadı'}
                        </h3>
                        <p className="text-gray-500 mb-4">
                            {emptyState?.description || 'Axtarış meyarlarını dəyişməyi cəhd edin.'}
                        </p>
                        {emptyState?.action && emptyState.action}
                    </div>
                )}
            </div>
        </div>
    );
}