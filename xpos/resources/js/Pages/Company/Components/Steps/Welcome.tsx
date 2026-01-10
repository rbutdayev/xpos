import { RocketLaunchIcon, BuildingOfficeIcon, MapPinIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

export default function Welcome() {
  const features = [
    {
      icon: BuildingOfficeIcon,
      title: 'Şirkət məlumatları',
      description: 'Şirkətinizin əsas məlumatlarını və qeydiyyat detallarını əlavə edin',
    },
    {
      icon: MapPinIcon,
      title: 'Filial və əlaqə',
      description: 'İlk filialınızı yaradın və əlaqə məlumatlarını daxil edin',
    },
    {
      icon: Cog6ToothIcon,
      title: 'Sistem parametrləri',
      description: 'Anbar və sistem parametrlərini konfiqurasiya edin',
    },
  ];

  return (
    <div className="py-8 px-4 text-center">
      {/* Header with animation */}
      <div className="mb-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl">
          <RocketLaunchIcon className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Xoş gəlmisiniz!
        </h1>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Sistemdən istifadəyə başlamaq üçün bir neçə sadə addımda şirkətinizi quraşdıraq.
          Bu proses yalnız bir neçə dəqiqə çəkəcək.
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-10">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="relative p-6 bg-white rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4 bg-indigo-100 rounded-lg">
              <feature.icon className="w-6 h-6 text-indigo-600" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {feature.description}
            </p>

            {/* Step number badge */}
            <div className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 bg-slate-700 text-white text-sm font-bold rounded-full">
              {idx + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <SparklesIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
          <span className="text-sm text-gray-700">
            <strong className="font-semibold text-indigo-900">3 addım</strong> - tamamlanması 5 dəqiqə
          </span>
        </div>

        <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-sm text-gray-700">
            Təhlükəsiz və <strong className="font-semibold text-emerald-900">şifrələnmiş</strong>
          </span>
        </div>
      </div>

      {/* Help text */}
      <p className="mt-8 text-xs text-gray-500">
        İstənilən vaxt geriyə qayıdaraq məlumatları dəyişə bilərsiniz
      </p>
    </div>
  );
}
