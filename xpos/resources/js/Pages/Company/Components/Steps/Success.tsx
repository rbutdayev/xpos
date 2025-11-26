import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

type Props = {
  onContinue?: () => void;
};

export default function Success({ onContinue }: Props) {
  return (
    <div className="py-12 px-4 text-center">
      {/* Animated success icon */}
      <div className="mb-8 animate-scale-in">
        <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-2xl relative">
          <CheckCircleIcon className="w-16 h-16 text-white" />
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <SparklesIcon className="w-6 h-6 text-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <h1 className="text-4xl font-bold text-gray-900">
            Təbriklər!
          </h1>
          <SparklesIcon className="w-6 h-6 text-yellow-500 animate-bounce" style={{ animationDelay: '200ms' }} />
        </div>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
          Şirkətiniz uğurla quraşdırıldı. İndi sistemdən istifadə etməyə başlaya bilərsiniz!
        </p>
      </div>

      {/* Features unlocked */}
      <div className="max-w-3xl mx-auto mb-10">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
          Hazır olan funksiyalar
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: '📦', title: 'Məhsul idarəetməsi', desc: 'Məhsulları əlavə edin və idarə edin' },
            { icon: '💰', title: 'Satış və POS', desc: 'Satışları qeyd edin və izləyin' },
            { icon: '📊', title: 'Hesabatlar', desc: 'Ətraflı analitika və hesabatlar' },
            { icon: '👥', title: 'Müştəri bazası', desc: 'Müştəriləri idarə edin' },
            { icon: '🏢', title: 'Filial idarəetməsi', desc: 'Çoxlu filialları idarə edin' },
            { icon: '⚙️', title: 'Parametrlər', desc: 'Sistemi tənzimləyin' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 hover:shadow-md transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="text-3xl" role="img" aria-label={feature.title}>
                {feature.icon}
              </span>
              <div className="text-left">
                <h4 className="text-sm font-semibold text-gray-900">
                  {feature.title}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action button */}
      {onContinue && (
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-lg font-semibold rounded-lg shadow-xl hover:from-emerald-700 hover:to-emerald-600 hover:shadow-2xl transform hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <span>İdarəetmə panelinə keç</span>
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}

      {/* Help text */}
      <p className="mt-8 text-xs text-gray-500">
        Kömək lazımdırsa, Dəstək bölməsinə müraciət edə bilərsiniz
      </p>
    </div>
  );
}
