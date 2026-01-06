import { useState, FormEvent, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useTranslation } from 'react-i18next';

interface Supplier {
    id: number;
    name: string;
}

interface Branch {
    id: number;
    name: string;
}

interface CreateManualSupplierCreditModalProps {
    show: boolean;
    onClose: () => void;
    suppliers: Supplier[];
    branches: Branch[];
    preselectedSupplierId?: number;
}

export default function CreateManualSupplierCreditModal({
    show,
    onClose,
    suppliers,
    branches,
    preselectedSupplierId
}: CreateManualSupplierCreditModalProps) {
    const { t } = useTranslation(['suppliers', 'common']);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        supplier_id: preselectedSupplierId?.toString() || '',
        branch_id: branches.length > 0 ? branches[0].id.toString() : '',
        amount: '',
        description: '',
        entry_type: 'manual' as 'manual' | 'migration',
        old_system_reference: '',
        credit_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });

    // Reset form when modal opens
    useEffect(() => {
        if (show) {
            setFormData({
                supplier_id: preselectedSupplierId?.toString() || '',
                branch_id: branches.length > 0 ? branches[0].id.toString() : '',
                amount: '',
                description: '',
                entry_type: 'manual',
                old_system_reference: '',
                credit_date: new Date().toISOString().split('T')[0],
                due_date: '',
                notes: ''
            });
            setErrors({});
        }
    }, [show, branches, preselectedSupplierId]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post(route('suppliers.create-manual-credit'), formData, {
            preserveState: true,
            onSuccess: () => {
                onClose();
                router.reload();
            },
            onError: (errors: any) => {
                setErrors(errors);
            },
            onFinish: () => {
                setProcessing(false);
            }
        });
    };

    const handleClose = () => {
        if (!processing) {
            setErrors({});
            onClose();
        }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="2xl">
            <form onSubmit={handleSubmit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    {t('suppliers:actions.addManualCredit', 'Əl ilə Borc Əlavə Et')}
                </h2>

                <div className="space-y-4">
                    {/* Supplier Selection */}
                    <div>
                        <InputLabel htmlFor="supplier_id" value={t('suppliers:fields.supplier', 'Təchizatçı') + ' *'} />
                        <select
                            id="supplier_id"
                            value={formData.supplier_id}
                            onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            required
                            disabled={!!preselectedSupplierId}
                        >
                            <option value="">{t('common:select', 'Seçin')}</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.supplier_id} className="mt-2" />
                    </div>

                    {/* Branch Selection */}
                    <div>
                        <InputLabel htmlFor="branch_id" value={t('common:branch', 'Filial') + ' *'} />
                        <select
                            id="branch_id"
                            value={formData.branch_id}
                            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            required
                        >
                            {branches.map((branch) => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.branch_id} className="mt-2" />
                    </div>

                    {/* Amount */}
                    <div>
                        <InputLabel htmlFor="amount" value={t('suppliers:fields.amount', 'Məbləğ') + ' (AZN) *'} />
                        <TextInput
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            className="mt-1 block w-full"
                            placeholder="0.00"
                            required
                        />
                        <InputError message={errors.amount} className="mt-2" />
                    </div>

                    {/* Description */}
                    <div>
                        <InputLabel htmlFor="description" value={t('suppliers:fields.description', 'Təsvir') + ' *'} />
                        <TextInput
                            id="description"
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full"
                            placeholder={t('suppliers:placeholders.creditDescription', 'Borc haqqında məlumat')}
                            required
                        />
                        <InputError message={errors.description} className="mt-2" />
                    </div>

                    {/* Entry Type */}
                    <div>
                        <InputLabel htmlFor="entry_type" value={t('suppliers:fields.entryType', 'Giriş Növü') + ' *'} />
                        <select
                            id="entry_type"
                            value={formData.entry_type}
                            onChange={(e) => setFormData({ ...formData, entry_type: e.target.value as 'manual' | 'migration' })}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            required
                        >
                            <option value="manual">{t('suppliers:entryTypes.manual', 'Əl ilə')}</option>
                            <option value="migration">{t('suppliers:entryTypes.migration', 'Köçürmə')}</option>
                        </select>
                        <InputError message={errors.entry_type} className="mt-2" />
                        <p className="mt-1 text-sm text-gray-500">
                            {formData.entry_type === 'manual'
                                ? t('suppliers:help.manualEntry', 'Əl ilə yaradılan borc qeydi')
                                : t('suppliers:help.migrationEntry', 'Köhnə sistemdən köçürülmüş borc qeydi')}
                        </p>
                    </div>

                    {/* Old System Reference (only for migration) */}
                    {formData.entry_type === 'migration' && (
                        <div>
                            <InputLabel
                                htmlFor="old_system_reference"
                                value={t('suppliers:fields.oldSystemReference', 'Köhnə Sistem Referansı')}
                            />
                            <TextInput
                                id="old_system_reference"
                                type="text"
                                value={formData.old_system_reference}
                                onChange={(e) => setFormData({ ...formData, old_system_reference: e.target.value })}
                                className="mt-1 block w-full"
                                placeholder={t('suppliers:placeholders.oldReference', 'Məs: OLD-CR-12345')}
                            />
                            <InputError message={errors.old_system_reference} className="mt-2" />
                            <p className="mt-1 text-sm text-gray-500">
                                {t('suppliers:help.oldReference', 'Köhnə sistemdəki borc nömrəsi (ixtiyari)')}
                            </p>
                        </div>
                    )}

                    {/* Credit Date */}
                    <div>
                        <InputLabel htmlFor="credit_date" value={t('suppliers:fields.creditDate', 'Borc Tarixi') + ' *'} />
                        <TextInput
                            id="credit_date"
                            type="date"
                            value={formData.credit_date}
                            onChange={(e) => setFormData({ ...formData, credit_date: e.target.value })}
                            className="mt-1 block w-full"
                            required
                        />
                        <InputError message={errors.credit_date} className="mt-2" />
                    </div>

                    {/* Due Date */}
                    <div>
                        <InputLabel htmlFor="due_date" value={t('suppliers:fields.dueDate', 'Son Ödəmə Tarixi')} />
                        <TextInput
                            id="due_date"
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                            className="mt-1 block w-full"
                            min={formData.credit_date}
                        />
                        <InputError message={errors.due_date} className="mt-2" />
                    </div>

                    {/* Notes */}
                    <div>
                        <InputLabel htmlFor="notes" value={t('suppliers:fields.notes', 'Qeydlər')} />
                        <textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            rows={3}
                            placeholder={t('suppliers:placeholders.notes', 'Əlavə qeydlər (ixtiyari)')}
                        />
                        <InputError message={errors.notes} className="mt-2" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <SecondaryButton type="button" onClick={handleClose} disabled={processing}>
                        {t('common:cancel', 'Ləğv et')}
                    </SecondaryButton>
                    <PrimaryButton type="submit" disabled={processing}>
                        {processing ? t('common:saving', 'Saxlanılır...') : t('common:save', 'Saxla')}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
