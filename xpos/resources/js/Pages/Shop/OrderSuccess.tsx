import { Head, Link } from '@inertiajs/react';
import { CheckCircleIcon, PhoneIcon, EnvelopeIcon, HomeIcon } from '@heroicons/react/24/outline';

interface Account {
    company_name: string;
    shop_slug: string;
    phone: string | null;
    email: string | null;
}

interface Props {
    account: Account;
    order_number: string;
}

export default function OrderSuccess({ account, order_number }: Props) {
    return (
        <>
            <Head title="Sifariş Qəbul Edildi" />

            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    {/* Success Card */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header with animated checkmark */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-12 text-center">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-6 animate-bounce">
                                <CheckCircleIcon className="w-16 h-16 text-green-500" />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Təşəkkürlər!
                            </h1>
                            <p className="text-green-100 text-lg">
                                Sifarişiniz uğurla qəbul edildi
                            </p>
                        </div>

                        {/* Order Details */}
                        <div className="px-8 py-8">
                            <div className="bg-orange-50 rounded-xl p-6 mb-8 border-2 border-orange-200">
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-2">Sifariş nömrəsi</p>
                                    <p className="text-3xl font-bold text-orange-600 font-mono tracking-wider">
                                        {order_number}
                                    </p>
                                </div>
                            </div>

                            {/* Success Message */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-gray-700 font-medium">
                                            Sifarişiniz qəbul edildi və emal olunur
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Tezliklə sizinlə əlaqə saxlanılacaq
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-gray-700 font-medium">
                                            Sifariş məlumatlarınızı saxlayın
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Sifariş nömrəsini yadda saxlayın və ya ekran görüntüsünü çəkin
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    </div>
                                    <div>
                                        <p className="text-gray-700 font-medium">
                                            Telefon əlaqəsini gözləyin
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Operatorumuz tezliklə sizinlə əlaqə saxlayacaq
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="border-t border-gray-200 pt-6 mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Əlaqə məlumatları
                                </h3>
                                <div className="space-y-3">
                                    {account.phone && (
                                        <a
                                            href={`tel:${account.phone}`}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <PhoneIcon className="w-5 h-5 text-orange-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">Telefon</p>
                                                <p className="text-sm font-medium text-gray-900">{account.phone}</p>
                                            </div>
                                        </a>
                                    )}
                                    {account.email && (
                                        <a
                                            href={`mailto:${account.email}`}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <EnvelopeIcon className="w-5 h-5 text-orange-500" />
                                            <div>
                                                <p className="text-xs text-gray-500">E-poçt</p>
                                                <p className="text-sm font-medium text-gray-900">{account.email}</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href={route('shop.home', account.shop_slug)}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-lg hover:shadow-xl"
                                >
                                    <HomeIcon className="w-5 h-5" />
                                    <span className="font-semibold">Mağazaya qayıt</span>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        © {new Date().getFullYear()} {account.company_name}. Bütün hüquqlar qorunur.
                    </p>
                </div>
            </div>
        </>
    );
}
