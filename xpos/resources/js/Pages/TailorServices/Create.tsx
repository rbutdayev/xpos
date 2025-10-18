import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { PageProps } from '@/types';

interface Props extends PageProps {
    customers: Array<{ id: number; name: string; phone?: string }>;
    customerItems: Array<{ id: number; customer_id: number; display_name: string; description: string }>;
    employees: Array<{ id: number; name: string; position?: string; role: string }>;
    products: Array<{ id: number; name: string; sku?: string; sale_price: number; type: string }>;
    branches: Array<{ id: number; name: string }>;
}

interface ServiceItem {
    item_type: 'product' | 'service';
    product_id?: number;
    item_name: string;
    quantity: number;
    unit_price: number;
}

export default function Create({ customers, customerItems, employees, products, branches }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        customer_id: '',
        customer_item_id: '',
        employee_id: '',
        branch_id: branches[0]?.id || '',
        description: '',
        item_condition: '',
        labor_cost: 0,
        received_date: new Date().toISOString().split('T')[0],
        promised_date: '',
        notes: '',
        items: [] as ServiceItem[],
        payment_status: 'paid',
        paid_amount: 0,
        credit_amount: 0,
        credit_due_date: '',
    });

    const [filteredItems, setFilteredItems] = useState(customerItems);

    const handleCustomerChange = (customerId: string) => {
        setData('customer_id', customerId);
        setData('customer_item_id', '');

        if (customerId) {
            setFilteredItems(customerItems.filter(item => item.customer_id === parseInt(customerId)));
        } else {
            setFilteredItems(customerItems);
        }
    };

    const addItem = () => {
        setData('items', [...data.items, {
            item_type: 'service',
            item_name: '',
            quantity: 1,
            unit_price: 0,
        }]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof ServiceItem, value: any) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-fill item name when service is selected
        if (field === 'product_id' && value) {
            const service = products.find(p => p.id === parseInt(value));
            if (service) {
                newItems[index].item_name = service.name;
                newItems[index].unit_price = service.sale_price;
            }
        }

        setData('items', newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('tailor-services.store'));
    };

    const totalMaterials = data.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalCost = parseFloat(data.labor_cost.toString()) + totalMaterials;

    return (
        <AuthenticatedLayout>
            <Head title="Yeni Dərzi Xidməti" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-semibold text-gray-800">
                                    Yeni Dərzi Xidməti
                                </h2>
                                <SecondaryButton onClick={() => router.visit(route('tailor-services.index'))}>
                                    Geri
                                </SecondaryButton>
                            </div>

                            {/* General Error Message */}
                            {(errors as any).error && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">Xəta baş verdi</h3>
                                            <div className="mt-2 text-sm text-red-700">
                                                {(errors as any).error}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Customer Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="customer_id" value="Müştəri *" />
                                        <select
                                            id="customer_id"
                                            value={data.customer_id}
                                            onChange={(e) => handleCustomerChange(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                            required
                                        >
                                            <option value="">Müştəri seçin</option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.customer_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="customer_item_id" value="Müştəri məhsulu" />
                                        <select
                                            id="customer_item_id"
                                            value={data.customer_item_id}
                                            onChange={(e) => setData('customer_item_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        >
                                            <option value="">Seçilməyib</option>
                                            {filteredItems.map(item => (
                                                <option key={item.id} value={item.id}>
                                                    {item.display_name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.customer_item_id} className="mt-2" />
                                    </div>
                                </div>

                                {/* Service Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="branch_id" value="Filial *" />
                                        <select
                                            id="branch_id"
                                            value={data.branch_id}
                                            onChange={(e) => setData('branch_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                            required
                                        >
                                            {branches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.branch_id} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="employee_id" value="Məsul işçi" />
                                        <select
                                            id="employee_id"
                                            value={data.employee_id}
                                            onChange={(e) => setData('employee_id', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        >
                                            <option value="">Seçilməyib</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.name} {emp.position ? `(${emp.position})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.employee_id} className="mt-2" />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="description" value="Xidmət təsviri *" />
                                    <textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        rows={3}
                                        required
                                    />
                                    <InputError message={errors.description} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="item_condition" value="Məhsulun vəziyyəti" />
                                    <textarea
                                        id="item_condition"
                                        value={data.item_condition}
                                        onChange={(e) => setData('item_condition', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        rows={2}
                                    />
                                    <InputError message={errors.item_condition} className="mt-2" />
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <InputLabel htmlFor="received_date" value="Qəbul tarixi *" />
                                        <TextInput
                                            id="received_date"
                                            type="date"
                                            value={data.received_date}
                                            onChange={(e) => setData('received_date', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.received_date} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="promised_date" value="Vəd olunan tarix" />
                                        <TextInput
                                            id="promised_date"
                                            type="date"
                                            value={data.promised_date}
                                            onChange={(e) => setData('promised_date', e.target.value)}
                                            className="mt-1 block w-full"
                                        />
                                        <InputError message={errors.promised_date} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="labor_cost" value="İşçilik xərci (₼) *" />
                                        <TextInput
                                            id="labor_cost"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.labor_cost}
                                            onChange={(e) => setData('labor_cost', parseFloat(e.target.value) || 0)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <InputError message={errors.labor_cost} className="mt-2" />
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="border-t pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Xidmətlər</h3>
                                        <SecondaryButton type="button" onClick={addItem}>
                                            + Xidmət əlavə et
                                        </SecondaryButton>
                                    </div>

                                    {data.items.length > 0 && (
                                        <div className="space-y-3">
                                            {data.items.map((item, index) => (
                                                <div key={index} className="flex gap-2 items-start bg-gray-50 p-3 rounded">
                                                    <select
                                                        value={item.product_id || ''}
                                                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                                                        className="flex-1 border-gray-300 rounded text-sm"
                                                    >
                                                        <option value="">Xidmət seçin</option>
                                                        {products.filter(p => p.type === 'service').map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>

                                                    <input
                                                        type="text"
                                                        placeholder="Ad"
                                                        value={item.item_name}
                                                        onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                                                        className="flex-1 border-gray-300 rounded text-sm"
                                                        required
                                                    />

                                                    <input
                                                        type="number"
                                                        placeholder="Miqdar"
                                                        step="0.001"
                                                        min="0.001"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-24 border-gray-300 rounded text-sm"
                                                        required
                                                    />

                                                    <input
                                                        type="number"
                                                        placeholder="Qiymət"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="w-24 border-gray-300 rounded text-sm"
                                                        required
                                                    />

                                                    <div className="w-24 text-right text-sm font-medium py-2">
                                                        {(item.quantity * item.unit_price).toFixed(2)} ₼
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        Sil
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="bg-gray-50 p-4 rounded space-y-2">
                                    <div className="flex justify-between">
                                        <span>İşçilik xərci:</span>
                                        <span className="font-medium">{data.labor_cost.toFixed(2)} ₼</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Xidmət xərci:</span>
                                        <span className="font-medium">{totalMaterials.toFixed(2)} ₼</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Ümumi:</span>
                                        <span>{totalCost.toFixed(2)} ₼</span>
                                    </div>
                                </div>

                                {/* Notes */}
                                <div>
                                    <InputLabel htmlFor="notes" value="Qeydlər" />
                                    <textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                        rows={2}
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>

                                {/* Payment Section */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-semibold mb-4">Ödəmə</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <InputLabel htmlFor="payment_status" value="Ödəmə Statusu" />
                                            <select
                                                id="payment_status"
                                                value={data.payment_status}
                                                onChange={(e) => {
                                                    const status = e.target.value;
                                                    setData({
                                                        ...data,
                                                        payment_status: status,
                                                        paid_amount: status === 'paid' ? totalCost : 0,
                                                        credit_amount: status === 'credit' ? totalCost : 0,
                                                    });
                                                }}
                                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                                disabled={processing}
                                            >
                                                <option value="paid">Tam ödənilib</option>
                                                <option value="credit">Borc</option>
                                                <option value="partial">Qismən ödəniş</option>
                                            </select>
                                            <InputError message={errors.payment_status} className="mt-2" />
                                        </div>

                                        {(data.payment_status === 'paid' || data.payment_status === 'partial') && (
                                            <div>
                                                <InputLabel htmlFor="paid_amount" value="Ödənən Məbləğ" />
                                                <TextInput
                                                    id="paid_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.paid_amount}
                                                    onChange={(e) => {
                                                        const paidAmount = Math.min(parseFloat(e.target.value) || 0, totalCost);
                                                        setData({
                                                            ...data,
                                                            paid_amount: paidAmount,
                                                            credit_amount:
                                                                data.payment_status === 'partial'
                                                                    ? Math.max(0, totalCost - paidAmount)
                                                                    : 0,
                                                        });
                                                    }}
                                                    onBlur={(e) => {
                                                        const paidAmount = Math.round(Math.min(parseFloat(e.target.value) || 0, totalCost) * 100) / 100;
                                                        setData({
                                                            ...data,
                                                            paid_amount: paidAmount,
                                                            credit_amount:
                                                                data.payment_status === 'partial'
                                                                    ? Math.round(Math.max(0, totalCost - paidAmount) * 100) / 100
                                                                    : 0,
                                                        });
                                                    }}
                                                    className="mt-1 block w-full"
                                                    min="0"
                                                    max={totalCost}
                                                    disabled={processing}
                                                    readOnly={data.payment_status === 'paid'}
                                                />
                                                <InputError message={errors.paid_amount} className="mt-2" />
                                                {data.payment_status === 'paid' && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Tam ödəniş - məbləğ avtomatik hesablanır (Nağd)
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {(data.payment_status === 'credit' || data.payment_status === 'partial') && (
                                            <div>
                                                <InputLabel htmlFor="credit_amount" value="Borc Məbləği" />
                                                <TextInput
                                                    id="credit_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.credit_amount}
                                                    onChange={(e) => {
                                                        const creditAmount = Math.min(parseFloat(e.target.value) || 0, totalCost);
                                                        setData({
                                                            ...data,
                                                            credit_amount: creditAmount,
                                                            paid_amount: Math.max(0, totalCost - creditAmount),
                                                        });
                                                    }}
                                                    onBlur={(e) => {
                                                        const creditAmount = Math.round(Math.min(parseFloat(e.target.value) || 0, totalCost) * 100) / 100;
                                                        setData({
                                                            ...data,
                                                            credit_amount: creditAmount,
                                                            paid_amount: Math.round(Math.max(0, totalCost - creditAmount) * 100) / 100,
                                                        });
                                                    }}
                                                    className="mt-1 block w-full"
                                                    min="0"
                                                    max={totalCost}
                                                    disabled={processing}
                                                    readOnly={data.payment_status === 'credit'}
                                                />
                                                <InputError message={errors.credit_amount} className="mt-2" />
                                                {data.payment_status === 'credit' && (
                                                    <p className="text-xs text-gray-500 mt-1">Tam borc - məbləğ avtomatik hesablanır</p>
                                                )}
                                                {data.payment_status === 'partial' && (
                                                    <p className="text-xs text-gray-500 mt-1">Qalan borc məbləği avtomatik hesablanır</p>
                                                )}
                                            </div>
                                        )}

                                        {(data.payment_status === 'credit' || data.payment_status === 'partial') &&
                                            data.credit_amount > 0 && (
                                                <div>
                                                    <InputLabel htmlFor="credit_due_date" value="Borc Ödəmə Tarixi" />
                                                    <TextInput
                                                        id="credit_due_date"
                                                        type="date"
                                                        value={data.credit_due_date}
                                                        onChange={(e) => setData('credit_due_date', e.target.value)}
                                                        className="mt-1 block w-full"
                                                        disabled={processing}
                                                    />
                                                    <InputError message={errors.credit_due_date} className="mt-2" />
                                                </div>
                                            )}
                                    </div>
                                </div>

                                {/* Submit */}
                                <div className="flex justify-end gap-3">
                                    <SecondaryButton type="button" onClick={() => router.visit(route('tailor-services.index'))}>
                                        Ləğv et
                                    </SecondaryButton>
                                    <PrimaryButton type="submit" disabled={processing}>
                                        {processing ? 'Saxlanılır...' : 'Saxla'}
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
