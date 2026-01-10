import { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AdvancedPagination from './AdvancedPagination';
import SortableHeader from './SortableHeader';

export interface DataTableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    render?: (item: any) => ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface DataTableAction {
    label: string;
    href?: string;
    onClick?: (item: any) => void;
    className?: string;
    condition?: (item: any) => boolean;
}

interface DataTableProps {
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
    columns: DataTableColumn[];
    actions?: DataTableAction[];
    onSort?: (column: string) => void;
    onPerPageChange?: (perPage: number) => void;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    emptyState?: {
        icon?: ReactNode;
        title: string;
        description: string;
        action?: ReactNode;
    };
    className?: string;
}

export default function DataTable({
    data,
    columns,
    actions,
    onSort,
    onPerPageChange,
    sortField,
    sortDirection,
    emptyState,
    className = ""
}: DataTableProps) {
    const { t } = useTranslation();
    return (
        <div className={`bg-white overflow-hidden shadow-sm sm:rounded-lg ${className}`}>
            {data.data.length > 0 ? (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns.map((column) => (
                                        column.sortable && onSort ? (
                                            <SortableHeader 
                                                key={column.key}
                                                column={column.key} 
                                                sortField={sortField} 
                                                sortDirection={sortDirection}
                                                onSort={onSort}
                                                className={column.headerClassName}
                                            >
                                                {column.label}
                                            </SortableHeader>
                                        ) : (
                                            <th 
                                                key={column.key}
                                                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
                                            >
                                                {column.label}
                                            </th>
                                        )
                                    ))}
                                    {actions && actions.length > 0 && (
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('labels.operations')}
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {data.data.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-gray-50">
                                        {columns.map((column) => (
                                            <td 
                                                key={column.key}
                                                className={`px-6 py-4 whitespace-nowrap ${column.className || ''}`}
                                            >
                                                {column.render ? column.render(item) : (
                                                    <span className="text-sm text-gray-900">
                                                        {item[column.key] || '-'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        {actions && actions.length > 0 && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {actions.map((action, actionIndex) => {
                                                        // Check condition if provided
                                                        if (action.condition && !action.condition(item)) {
                                                            return null;
                                                        }

                                                        if (action.href) {
                                                            const href = action.href.replace(':id', (item as any).id);
                                                            
                                                            return (
                                                                <Link
                                                                    key={actionIndex}
                                                                    href={href}
                                                                    className={action.className || 'text-slate-600 hover:text-slate-900'}
                                                                >
                                                                    {action.label}
                                                                </Link>
                                                            );
                                                        }

                                                        return (
                                                            <button
                                                                key={actionIndex}
                                                                onClick={() => action.onClick && action.onClick(item)}
                                                                className={action.className || 'text-slate-600 hover:text-slate-900'}
                                                            >
                                                                {action.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    <AdvancedPagination 
                        data={data} 
                        onPerPageChange={onPerPageChange}
                    />
                </>
            ) : (
                /* Empty State */
                <div className="p-6 text-center">
                    {emptyState?.icon && (
                        <div className="w-12 h-12 mx-auto mb-4 text-gray-400">
                            {emptyState.icon}
                        </div>
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
    );
}