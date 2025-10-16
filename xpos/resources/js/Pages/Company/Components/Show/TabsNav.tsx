import { BuildingOffice2Icon, PhoneIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type TabType = 'basic' | 'contact' | 'system';

type Props = {
  active: TabType;
  onChange: (tab: TabType) => void;
};

export default function TabsNav({ active, onChange }: Props) {
  const tabs = [
    { id: 'basic' as TabType, name: 'Əsas Məlumatlar', icon: BuildingOffice2Icon },
    { id: 'contact' as TabType, name: 'Əlaqə Məlumatları', icon: PhoneIcon },
    { id: 'system' as TabType, name: 'Sistem Məlumatları', icon: ChartBarIcon },
  ];

  return (
    <div className="mb-4 sm:mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`${active === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center flex-shrink-0`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">{tab.name}</span>
              <span className="xs:hidden">{tab.id === 'basic' ? 'Əsas' : tab.id === 'contact' ? 'Əlaqə' : 'Sistem'}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

