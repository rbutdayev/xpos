import { Company } from '@/types';
import { PhoneIcon, EnvelopeIcon, GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatBusinessHours } from '../../../Utils/showHelpers';

type Props = { company: Company };

export default function ContactTab({ company }: Props) {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Əlaqə Məlumatları</h3>
          <div className="space-y-4">
            {company.phone && (
              <div className="flex items-start">
                <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    <a href={`tel:${company.phone}`} className="text-blue-600 hover:underline break-all">{company.phone}</a>
                  </dd>
                </div>
              </div>
            )}

            {company.email && (
              <div className="flex items-start">
                <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">E-poçt</dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    <a href={`mailto:${company.email}`} className="text-blue-600 hover:underline break-all">{company.email}</a>
                  </dd>
                </div>
              </div>
            )}

            {company.website && (
              <div className="flex items-start">
                <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">Veb Sayt</dt>
                  <dd className="text-xs sm:text-sm text-gray-900">
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{company.website}</a>
                  </dd>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">İş Saatları</h3>
          {company.business_hours && formatBusinessHours(company.business_hours) ? (
            <div className="space-y-2 sm:space-y-3">
              {formatBusinessHours(company.business_hours)?.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center min-w-0 flex-1">
                    <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{item.day}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-gray-600 ml-2">
                    {item.schedule?.open && item.schedule?.close
                      ? `${item.schedule.open} - ${item.schedule.close}`
                      : item.schedule?.closed
                      ? 'Bağlı'
                      : 'Müəyyən edilməyib'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <ClockIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-xs sm:text-sm text-gray-500">İş saatları müəyyən edilməyib</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

