import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import { PrinterIcon } from '@heroicons/react/24/outline';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

interface Props {
    settings: any;
}

export default function POSTab({ settings }: Props) {
    const form: any = useForm({
        auto_print_receipt: settings.auto_print_receipt || false,
    });

    const { data, setData, post, processing, recentlySuccessful } = form;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('settings.pos.update'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <SettingsSection
                title="Çap Parametrləri"
                description="Satış və qəbz çap parametrləri"
                icon={PrinterIcon}
            >
                <div className="space-y-6">
                    <div className="flex items-start">
                        <div className="flex items-center h-5">
                            <Checkbox
                                id="auto_print_receipt"
                                checked={data.auto_print_receipt}
                                onChange={(e) => setData('auto_print_receipt', e.target.checked)}
                            />
                        </div>
                        <div className="ml-3 text-sm">
                            <label
                                htmlFor="auto_print_receipt"
                                className="font-medium text-gray-700 dark:text-gray-300"
                            >
                                Avtomatik çap
                            </label>
                            <p className="text-gray-500 dark:text-gray-400">
                                Satış uğurla tamamlandıqdan sonra qəbzi avtomatik olaraq çap et
                            </p>
                        </div>
                    </div>

                    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <PrinterIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    Avtomatik çap haqqında
                                </h3>
                                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                                    <p>
                                        Bu parametr aktiv olduqda, POS sistemindən hər satış ediləndə
                                        qəbz avtomatik olaraq printer-ə göndəriləcək. Bu, kassir
                                        tərəfindən manual olaraq çap düyməsini basmağa ehtiyacı aradan
                                        qaldırır və prosesi sürətləndirir.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                {recentlySuccessful && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                        Parametrlər yadda saxlanıldı
                    </p>
                )}
                <PrimaryButton type="submit" disabled={processing}>
                    {processing ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                </PrimaryButton>
            </div>
        </form>
    );
}
