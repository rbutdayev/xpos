import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { SettingsSection, FormGrid, FormField } from '@/Components/Admin';
import { ShoppingBagIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import Checkbox from '@/Components/Checkbox';

interface Props {
    settings: any;
}

export default function ShopTab({ settings }: Props) {
    const form: any = useForm({
        shop_enabled: settings.shop_enabled || false,
        shop_slug: settings.shop_slug || '',
    });

    const { data, setData, post, processing, errors, recentlySuccessful } = form;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('settings.shop.update'));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <SettingsSection
                title="Online Mağaza"
                description="Online mağazanızı konfiqurasiya edin"
                icon={ShoppingBagIcon}
            >
                <FormGrid>
                    <div className="sm:col-span-6">
                        <label className="flex items-center space-x-3">
                            <Checkbox
                                checked={data.shop_enabled}
                                onChange={(e) => setData('shop_enabled', e.target.checked)}
                            />
                            <span className="text-sm font-medium text-gray-900">
                                Online mağazanı aktiv et
                            </span>
                        </label>
                    </div>

                    <FormField label="Mağaza URL (slug)" className="sm:col-span-6">
                        <TextInput
                            value={data.shop_slug}
                            onChange={(e) => setData('shop_slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="menim-magazam"
                            disabled={!data.shop_enabled}
                            className="mt-1 block w-full"
                        />
                        {data.shop_slug && data.shop_enabled && (
                            <p className="mt-2 text-sm text-green-600">
                                <GlobeAltIcon className="inline-block w-4 h-4 mr-1" />
                                Mağaza URL: <strong>{window.location.origin}/shop/{data.shop_slug}</strong>
                            </p>
                        )}
                    </FormField>
                </FormGrid>
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
