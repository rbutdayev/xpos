import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

interface Employee {
    employee_id: number;
    first_name: string;
    last_name: string;
    base_salary?: number;
}

interface Props {
    employees: Employee[];
    statuses: Record<string, string>;
    months: Record<number, string>;
    currentYear: number;
    currentMonth: number;
}

interface SalaryFormData {
    employee_id: string;
    amount: string;
    month: string;
    year: string;
    status: string;
    payment_date: string;
    bonus_amount: string;
    deduction_amount: string;
    bonus_reason: string;
    deduction_reason: string;
    notes: string;
}

export default function Create({ employees, statuses, months, currentYear, currentMonth }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm<SalaryFormData>({
        employee_id: '',
        amount: '',
        month: currentMonth.toString(),
        year: currentYear.toString(),
        status: 'hazırlanıb',
        payment_date: '',
        bonus_amount: '0',
        deduction_amount: '0',
        bonus_reason: '',
        deduction_reason: '',
        notes: '',
    });

    const selectedEmployee = employees.find(emp => emp.employee_id.toString() === data.employee_id);

    const calculateNetSalary = () => {
        const base = parseFloat(data.amount) || 0;
        const bonuses = parseFloat(data.bonus_amount) || 0;
        const deductions = parseFloat(data.deduction_amount) || 0;
        return base + bonuses - deductions;
    };

    const handleEmployeeChange = (employeeId: string) => {
        setData('employee_id', employeeId);
        const employee = employees.find(emp => emp.employee_id.toString() === employeeId);
        if (employee && employee.base_salary) {
            setData('amount', employee.base_salary.toString());
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/employee-salaries');
    };

    return (
        <AuthenticatedLayout
        >
            <Head title="Yeni maaş" />

            <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-4 sm:p-6 space-y-6">
                            {/* Employee Selection */}
                            <div>
                                <InputLabel htmlFor="employee_id" value="İşçi *" />
                                <select
                                    id="employee_id"
                                    name="employee_id"
                                    value={data.employee_id}
                                    onChange={(e) => handleEmployeeChange(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                    required
                                >
                                    <option value="">İşçi seçin</option>
                                    {employees.map((employee) => (
                                        <option key={employee.employee_id} value={employee.employee_id}>
                                            {employee.first_name} {employee.last_name}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.employee_id} className="mt-2" />
                            </div>

                            {/* Month and Year */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="month" value="Ay *" />
                                    <select
                                        id="month"
                                        name="month"
                                        value={data.month}
                                        onChange={(e) => setData('month', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                        required
                                    >
                                        {Object.entries(months).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.month} className="mt-2" />
                                </div>
                                
                                <div>
                                    <InputLabel htmlFor="year" value="İl *" />
                                    <TextInput
                                        id="year"
                                        type="number"
                                        name="year"
                                        value={data.year}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('year', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.year} className="mt-2" />
                                </div>
                            </div>

                            {/* Base Salary */}
                            <div>
                                <InputLabel htmlFor="amount" value="Əsas maaş (AZN) *" />
                                <TextInput
                                    id="amount"
                                    type="number"
                                    name="amount"
                                    value={data.amount}
                                    className="mt-1 block w-full"
                                    step="0.01"
                                    min="0"
                                    onChange={(e) => setData('amount', e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                                <InputError message={errors.amount} className="mt-2" />
                                {selectedEmployee && selectedEmployee.base_salary && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        İşçinin əsas maaşı: {selectedEmployee.base_salary} AZN
                                    </p>
                                )}
                            </div>

                            {/* Bonuses */}
                            <div>
                                <InputLabel htmlFor="bonus_amount" value="Bonus məbləği (AZN)" />
                                <TextInput
                                    id="bonus_amount"
                                    type="number"
                                    name="bonus_amount"
                                    value={data.bonus_amount}
                                    className="mt-1 block w-full"
                                    step="0.01"
                                    min="0"
                                    onChange={(e) => setData('bonus_amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                <InputError message={errors.bonus_amount} className="mt-2" />
                            </div>

                            {/* Bonus Reason */}
                            {parseFloat(data.bonus_amount) > 0 && (
                                <div>
                                    <InputLabel htmlFor="bonus_reason" value="Bonus səbəbi" />
                                    <TextInput
                                        id="bonus_reason"
                                        type="text"
                                        name="bonus_reason"
                                        value={data.bonus_reason}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('bonus_reason', e.target.value)}
                                        placeholder="Bonus verilməsinin səbəbi"
                                    />
                                    <InputError message={errors.bonus_reason} className="mt-2" />
                                </div>
                            )}

                            {/* Deductions */}
                            <div>
                                <InputLabel htmlFor="deduction_amount" value="Tutulma məbləği (AZN)" />
                                <TextInput
                                    id="deduction_amount"
                                    type="number"
                                    name="deduction_amount"
                                    value={data.deduction_amount}
                                    className="mt-1 block w-full"
                                    step="0.01"
                                    min="0"
                                    onChange={(e) => setData('deduction_amount', e.target.value)}
                                    placeholder="0.00"
                                />
                                <InputError message={errors.deduction_amount} className="mt-2" />
                            </div>

                            {/* Deduction Reason */}
                            {parseFloat(data.deduction_amount) > 0 && (
                                <div>
                                    <InputLabel htmlFor="deduction_reason" value="Tutulma səbəbi" />
                                    <TextInput
                                        id="deduction_reason"
                                        type="text"
                                        name="deduction_reason"
                                        value={data.deduction_reason}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('deduction_reason', e.target.value)}
                                        placeholder="Tutulmanın səbəbi"
                                    />
                                    <InputError message={errors.deduction_reason} className="mt-2" />
                                </div>
                            )}

                            {/* Status */}
                            <div>
                                <InputLabel htmlFor="status" value="Status *" />
                                <select
                                    id="status"
                                    name="status"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                    required
                                >
                                    {Object.entries(statuses).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>

                            {/* Payment Date */}
                            {data.status === 'ödənilib' && (
                                <div>
                                    <InputLabel htmlFor="payment_date" value="Ödəniş tarixi" />
                                    <TextInput
                                        id="payment_date"
                                        type="date"
                                        name="payment_date"
                                        value={data.payment_date}
                                        className="mt-1 block w-full"
                                        onChange={(e) => setData('payment_date', e.target.value)}
                                    />
                                    <InputError message={errors.payment_date} className="mt-2" />
                                </div>
                            )}

                            {/* Net Salary Calculation */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h4 className="text-lg font-medium text-gray-900 mb-2">Hesablama</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Əsas maaş:</span>
                                        <span>{parseFloat(data.amount) || 0} AZN</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Bonuslar:</span>
                                        <span>+{parseFloat(data.bonus_amount) || 0} AZN</span>
                                    </div>
                                    <div className="flex justify-between text-red-600">
                                        <span>Tutulmalar:</span>
                                        <span>-{parseFloat(data.deduction_amount) || 0} AZN</span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                        <span>Xalis maaş:</span>
                                        <span>{calculateNetSalary()} AZN</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <InputLabel htmlFor="notes" value="Qeydlər" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={3}
                                    className="mt-1 block w-full border-gray-300 focus:border-slate-500 focus:ring-slate-500 rounded-md shadow-sm"
                                    placeholder="Əlavə qeydlər (istəyə bağlı)"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
                                <SecondaryButton className="w-full sm:w-auto">
                                    <Link href="/employee-salaries">
                                        Ləğv et
                                    </Link>
                                </SecondaryButton>

                                <PrimaryButton
                                    className="w-full sm:w-auto"
                                    disabled={processing}
                                >
                                    {processing ? 'Yadda saxlanır...' : 'Yadda saxla'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
        </AuthenticatedLayout>
    );
}