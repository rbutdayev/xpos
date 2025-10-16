import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="E-poçt Təsdiqi" />

            <div className="mb-4 text-sm text-gray-600">
                Qeydiyyatdan keçdiyiniz üçün təşəkkür edirik! Başlamazdan əvvəl, 
                sizə göndərdiyimiz e-poçtdakı linkə klikləyərək e-poçt ünvanınızı 
                təsdiqləyə bilərsinizmi? Əgər e-poçtu almamısınızsa, sizə məmnuniyyətlə 
                başqa bir tane göndərərik.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    Qeydiyyat zamanı verdiyiniz e-poçt ünvanına yeni təsdiqləmə linki göndərildi.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        Təsdiqləmə E-poçtunu Yenidən Göndər
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Çıxış
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
