import { Link } from '@inertiajs/react';
import { Company } from '@/types';
import { ArrowLeftIcon, BuildingOffice2Icon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type Props = {
  company: Company;
  onDelete: () => void;
};

export default function Header({ company, onDelete }: Props) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-start sm:space-y-0">
        <div className="flex items-start">
          <Link href={route('companies.index')} className="mr-3 sm:mr-4 text-gray-600 hover:text-gray-900 mt-1">
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center mb-2">
              <div className="flex items-center mb-2 sm:mb-0">
                <BuildingOffice2Icon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mr-2 sm:mr-3 flex-shrink-0" />
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 truncate">{company.name}</h1>
              </div>
              <span className={`sm:ml-3 inline-flex items-center px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${company.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {company.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
              </span>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Şirkət təfərrüatları və məlumatları</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Link href={route('companies.edit', company.id)} className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
            <PencilIcon className="w-4 h-4 mr-2" />
            Düzəlt
          </Link>
          <button onClick={onDelete} className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
            <TrashIcon className="w-4 h-4 mr-2" />
            Sil
          </button>
        </div>
      </div>
    </div>
  );
}

