import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GoodsReceiptForm from './Components/GoodsReceiptForm';
import { GoodsReceipt } from '@/types';

interface Supplier { 
    id: number; 
    name: string; 
    contact_person?: string; 
    phone?: string; 
    payment_terms_days?: number; 
    payment_terms_text?: string;
}
interface Warehouse { id: number; name: string; location?: string; }
interface Employee { employee_id: number; name: string; }

interface Props { 
    receipt: GoodsReceipt;
    suppliers: Supplier[]; 
    warehouses: Warehouse[]; 
    employees: Employee[]; 
}

export default function Edit({ receipt, suppliers, warehouses, employees }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title={`Mal qəbulunu düzəliş et - ${receipt.receipt_number}`} />
            <div className="py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-3 sm:space-y-0">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                                Mal qəbulunu düzəliş et
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Qəbul nömrəsi: {receipt.receipt_number}
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Link 
                                href={route('goods-receipts.show', receipt.id)} 
                                className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded border"
                            >
                                Görünüş
                            </Link>
                            <Link 
                                href={route('goods-receipts.index')} 
                                className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded border"
                            >
                                ← Siyahı
                            </Link>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                        <GoodsReceiptForm 
                            suppliers={suppliers} 
                            warehouses={warehouses}
                            employees={employees}
                            receipt={receipt}
                            isEditing={true}
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}