import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import GoodsReceiptForm from './Components/GoodsReceiptForm';
import { useTranslation } from 'react-i18next';

interface Supplier { id: number; name: string; }
interface Warehouse { id: number; name: string; }
interface Employee { employee_id: number; name: string; }

interface Props { suppliers: Supplier[]; warehouses: Warehouse[]; employees: Employee[]; }

export default function Create({ suppliers, warehouses }: Props) {
    const { t } = useTranslation(['inventory', 'common']);

    return (
        <AuthenticatedLayout>
            <Head title={t('goodsReceipts.createTitle')} />
            <div className="h-full py-4 px-4 sm:px-6 lg:px-8">
                <div className="h-full flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t('goodsReceipts.newReceipt')}</h1>
                        <Link href={route('goods-receipts.index')} className="text-sm text-gray-600 hover:text-gray-800 flex items-center">
                            ← {t('goodsReceipts.back')}
                        </Link>
                    </div>
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 overflow-auto">
                        <GoodsReceiptForm suppliers={suppliers} warehouses={warehouses} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}