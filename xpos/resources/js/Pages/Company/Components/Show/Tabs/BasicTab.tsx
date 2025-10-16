import { Company } from '@/types';
import { BuildingOffice2Icon, TagIcon, LanguageIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { getLanguageName } from '../../../Utils/showHelpers';

type Props = { company: Company };

export default function BasicTab({ company }: Props) {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1 order-2 lg:order-1">
          <div className="text-center">
            <div className="mx-auto h-32 w-32 sm:h-40 sm:w-40 lg:h-48 lg:w-48 bg-gray-200 rounded-lg flex items-center justify-center mb-4 p-2">
              {company.logo_path ? (
                <img
                  src={company.logo_url || `/storage/${company.logo_path}`}
                  alt="Şirkət loqosu"
                  className="h-full w-full object-contain rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== `/storage/${company.logo_path}`) target.src = `/storage/${company.logo_path}`;
                  }}
                />
              ) : (
                <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 bg-gray-100 rounded flex items-center justify-center">
                  <BuildingOffice2Icon className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400" />
                </div>
              )}
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900">{company.name}</h3>
            <p className="text-xs sm:text-sm text-gray-500">Şirkət Loqosu</p>
            <p className="text-xs text-blue-600 mt-1">Loqonu dəyişmək üçün <strong>Düzəlt</strong> düyməsini basın</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          <div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2 mb-4">Əsas Məlumatlar</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <BuildingOffice2Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Şirkət Adı</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 font-medium truncate">{company.name}</dd>
                  </div>
                </div>

                {company.tax_number && (
                  <div className="flex items-start">
                    <TagIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Vergi Nömrəsi</dt>
                      <dd className="text-xs sm:text-sm text-gray-900 break-all">{company.tax_number}</dd>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <LanguageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Varsayılan Dil</dt>
                    <dd className="text-xs sm:text-sm text-gray-900">{getLanguageName(company.default_language)}</dd>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {company.address && (
                  <div className="flex items-start">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <dt className="text-xs sm:text-sm font-medium text-gray-500">Ünvan</dt>
                      <dd className="text-xs sm:text-sm text-gray-900 break-words">{company.address}</dd>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {company.description && (
            <div>
              <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-3">Təsvir</h4>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{company.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

