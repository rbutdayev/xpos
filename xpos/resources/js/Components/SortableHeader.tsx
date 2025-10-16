import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface Props {
    column: string;
    children: React.ReactNode;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    onSort: (column: string) => void;
    className?: string;
}

export default function SortableHeader({ 
    column, 
    children, 
    sortField, 
    sortDirection, 
    onSort,
    className = ""
}: Props) {
    const isActive = sortField === column;
    
    return (
        <th 
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
            onClick={() => onSort(column)}
        >
            <div className="flex items-center space-x-1">
                <span>{children}</span>
                <div className="flex flex-col">
                    <ChevronUpIcon 
                        className={`w-3 h-3 ${
                            isActive && sortDirection === 'asc' 
                                ? 'text-blue-600' 
                                : 'text-gray-300'
                        }`} 
                    />
                    <ChevronDownIcon 
                        className={`w-3 h-3 -mt-1 ${
                            isActive && sortDirection === 'desc' 
                                ? 'text-blue-600' 
                                : 'text-gray-300'
                        }`} 
                    />
                </div>
            </div>
        </th>
    );
}