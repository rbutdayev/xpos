import { Company } from '@/types';
import { HomeIcon, BuildingOffice2Icon, UsersIcon, ChartBarIcon, CalendarIcon } from '@heroicons/react/24/outline';

type Props = {
  company: Company;
  branches: any[];
  warehouses: any[];
  users: any[];
};

export default function SystemTab({ company, branches, warehouses, users }: Props) {
  return (
    <div className="p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Sistem Statistikaları</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4 text-center">
              <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold text-blue-900">{branches.length}</div>
              <div className="text-xs sm:text-sm text-blue-600">Filiallar</div>
            </div>

            <div className="bg-green-50 rounded-lg p-3 sm:p-4 text-center">
              <BuildingOffice2Icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold text-green-900">{warehouses.length}</div>
              <div className="text-xs sm:text-sm text-green-600">Anbarlar</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-3 sm:p-4 text-center">
              <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold text-purple-900">{users.length}</div>
              <div className="text-xs sm:text-sm text-purple-600">İstifadəçilər</div>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 sm:p-4 text-center">
              <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold text-amber-900">Aktiv</div>
              <div className="text-xs sm:text-sm text-amber-600">Status</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">Sistem Məlumatları</h3>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {company.created_at && (
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Yaradılma Tarixi</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 mt-1">
                      {new Date(company.created_at).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </dd>
                  </div>
                )}

                {company.updated_at && (
                  <div>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500">Son Yeniləmə</dt>
                    <dd className="text-xs sm:text-sm text-gray-900 mt-1">
                      {new Date(company.updated_at).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">Şirkət ID</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 mt-1 font-mono">#{company.id}</dd>
                </div>

                <div>
                  <dt className="text-xs sm:text-sm font-medium text-gray-500">Account ID (Sistem)</dt>
                  <dd className="text-xs sm:text-sm text-gray-900 mt-1 font-mono">#{company.account_id}</dd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

