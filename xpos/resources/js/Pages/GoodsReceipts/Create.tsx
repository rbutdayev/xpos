import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GoodsReceiptForm from './Components/GoodsReceiptForm';

interface Supplier { id: number; name: string; }
interface Warehouse { id: number; name: string; }
interface Employee { employee_id: number; name: string; }

interface Props { suppliers: Supplier[]; warehouses: Warehouse[]; employees: Employee[]; }

export default function Create({ suppliers, warehouses }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Mal qəbulu yarat" />
            <div className="py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Yeni Mal Qəbulu</h1>
                        <Link href={route('goods-receipts.index')} className="text-sm text-gray-600 hover:text-gray-800 flex items-center">
                            ← Geri
                        </Link>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
                        <GoodsReceiptForm suppliers={suppliers} warehouses={warehouses} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}