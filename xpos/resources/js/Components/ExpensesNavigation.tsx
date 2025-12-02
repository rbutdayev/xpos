import { Link } from '@inertiajs/react';
import {
    FolderIcon,
    CurrencyDollarIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';

interface ExpensesNavigationProps {
    currentRoute?: string;
    onCreateExpense?: () => void;
    onCreateSupplierPayment?: () => void;
}

export default function ExpensesNavigation({ currentRoute, onCreateExpense, onCreateSupplierPayment }: ExpensesNavigationProps) {
    const isActive = (routeName: string) => {
        const cr: string = currentRoute ?? (route().current() ?? '');
        return cr.includes(routeName);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
            <nav className="flex flex-wrap gap-1">
                {/* Pay Supplier Button - PRIORITY 1 */}
                {onCreateSupplierPayment ? (
                    <button
                        type="button"
                        onClick={onCreateSupplierPayment}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                        <CurrencyDollarIcon className="w-5 h-5 text-white" />
                        <span className="font-semibold">Təchizatçıya Ödə</span>
                    </button>
                ) : (
                    <Link
                        href={route('supplier-payments.create')}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                        <CurrencyDollarIcon className="w-5 h-5 text-white" />
                        <span className="font-semibold">Təchizatçıya Ödə</span>
                    </Link>
                )}

                {/* New Expense Button */}
                {onCreateExpense ? (
                    <button
                        type="button"
                        onClick={onCreateExpense}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                        <PlusCircleIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold">Xərc Əlavə Et</span>
                    </button>
                ) : (
                    <Link
                        href={route('expenses.create')}
                        className="relative flex items-center gap-2.5 px-4 py-3 rounded-md font-medium text-sm transition-all duration-200 ease-in-out text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    >
                        <PlusCircleIcon className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold">Xərc Əlavə Et</span>
                    </Link>
                )}

                {/* Expenses Link */}
                <Link
                    href={route('expenses.index')}
                    className={`
                        relative flex items-center gap-2.5 px-4 py-3 rounded-md
                        font-medium text-sm transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        ${isActive('expenses.index') || isActive('expenses.show') || isActive('expenses.edit')
                            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/30 transform scale-[1.02]'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
                        }
                    `}
                >
                    <CurrencyDollarIcon className={`w-5 h-5 ${(isActive('expenses.index') || isActive('expenses.show') || isActive('expenses.edit')) ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-semibold">Xərclər</span>
                    {(isActive('expenses.index') || isActive('expenses.show') || isActive('expenses.edit')) && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                </Link>

                {/* Categories Link */}
                <Link
                    href={route('expense-categories.index')}
                    className={`
                        relative flex items-center gap-2.5 px-4 py-3 rounded-md
                        font-medium text-sm transition-all duration-200 ease-in-out
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                        ${isActive('expense-categories')
                            ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md shadow-gray-500/30 transform scale-[1.02]'
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100'
                        }
                    `}
                >
                    <FolderIcon className={`w-5 h-5 ${isActive('expense-categories') ? 'text-white' : 'text-gray-400'}`} />
                    <span className="font-semibold">Kateqoriyalar</span>
                    {isActive('expense-categories') && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                </Link>
            </nav>
        </div>
    );
}
