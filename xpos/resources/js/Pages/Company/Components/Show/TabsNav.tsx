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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <nav className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-md
                font-medium text-xs sm:text-sm transition-all duration-200 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1
                whitespace-nowrap flex-shrink-0
                ${active === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transform scale-[1.02]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                }
              `}
            >
              <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${active === tab.id ? 'text-white' : 'text-gray-400'}`} />
              <span className="hidden xs:inline font-semibold">{tab.name}</span>
              <span className="xs:hidden font-semibold">{tab.id === 'basic' ? 'Əsas' : tab.id === 'contact' ? 'Əlaqə' : 'Sistem'}</span>
              {active === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

