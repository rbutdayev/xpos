import {
  WrenchScrewdriverIcon,
  DevicePhoneMobileIcon,
  TvIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';

export type ServiceType = 'tailor' | 'phone_repair' | 'electronics' | 'general';

export interface ServiceTypeConfig {
  id: ServiceType;
  name: string;              // Display name (plural)
  nameSingular: string;      // Singular form
  icon: React.ComponentType<{ className?: string }>;
  itemLabel: string;         // "Müştəri məhsulu", "Telefon", "Cihaz", etc.
  itemLabelOptional: string; // Optional text for form
  conditionLabel: string;    // Condition field label
  laborCostLabel: string;    // Labor/service cost label
  serviceDescLabel: string;  // Service description label
  materialsLabel: string;    // Materials/parts section label
  addItemButton: string;     // Button text for adding items
  emptyStateTitle: string;   // Empty state message
  emptyStateDesc: string;    // Empty state description
}

export const SERVICE_TYPES: Record<ServiceType, ServiceTypeConfig> = {
  tailor: {
    id: 'tailor',
    name: 'Dərzi Xidmətləri',
    nameSingular: 'Dərzi Xidməti',
    icon: WrenchScrewdriverIcon,
    itemLabel: 'Müştəri məhsulu',
    itemLabelOptional: 'Geyim növü (köynək, şalvar və s.)',
    conditionLabel: 'Məhsulun vəziyyəti',
    laborCostLabel: 'İşçilik xərci (₼)',
    serviceDescLabel: 'Xidmət təsviri',
    materialsLabel: 'Materiallar və Aksessuarlar',
    addItemButton: 'Material əlavə et',
    emptyStateTitle: 'Heç bir dərzi xidməti tapılmadı',
    emptyStateDesc: 'İlk dərzi xidmətini əlavə etməklə başlayın.',
  },
  phone_repair: {
    id: 'phone_repair',
    name: 'Telefon Təmiri',
    nameSingular: 'Telefon Təmiri',
    icon: DevicePhoneMobileIcon,
    itemLabel: 'Telefon modeli',
    itemLabelOptional: 'Marka və model (iPhone 13, Samsung S21 və s.)',
    conditionLabel: 'Telefonun vəziyyəti',
    laborCostLabel: 'Təmir xərci (₼)',
    serviceDescLabel: 'Problem təsviri',
    materialsLabel: 'Hissələr və Komponentlər',
    addItemButton: 'Hissə əlavə et',
    emptyStateTitle: 'Heç bir telefon təmiri tapılmadı',
    emptyStateDesc: 'İlk telefon təmirini əlavə etməklə başlayın.',
  },
  electronics: {
    id: 'electronics',
    name: 'Elektronika Təmiri',
    nameSingular: 'Elektronika Təmiri',
    icon: TvIcon,
    itemLabel: 'Cihaz növü',
    itemLabelOptional: 'TV, Paltaryuyan, Soyuducu, Kondisioner və s.',
    conditionLabel: 'Cihazın vəziyyəti',
    laborCostLabel: 'Təmir xərci (₼)',
    serviceDescLabel: 'Problem təsviri',
    materialsLabel: 'Hissələr və Komponentlər',
    addItemButton: 'Hissə əlavə et',
    emptyStateTitle: 'Heç bir elektronika təmiri tapılmadı',
    emptyStateDesc: 'İlk elektronika təmirini əlavə etməklə başlayın.',
  },
  general: {
    id: 'general',
    name: 'Ümumi Xidmətlər',
    nameSingular: 'Ümumi Xidmət',
    icon: HomeModernIcon,
    itemLabel: 'Məhsul/Cihaz',
    itemLabelOptional: 'Təmir ediləcək məhsul',
    conditionLabel: 'Məhsulun vəziyyəti',
    laborCostLabel: 'Xidmət haqqı (₼)',
    serviceDescLabel: 'Xidmət təsviri',
    materialsLabel: 'Materiallar və Hissələr',
    addItemButton: 'Əlavə et',
    emptyStateTitle: 'Heç bir xidmət tapılmadı',
    emptyStateDesc: 'İlk xidməti əlavə etməklə başlayın.',
  },
};

// Default service type (can be changed via environment or settings)
export const DEFAULT_SERVICE_TYPE: ServiceType = 'tailor';

// Helper function to get config
export function getServiceConfig(type?: ServiceType): ServiceTypeConfig {
  return SERVICE_TYPES[type || DEFAULT_SERVICE_TYPE];
}

// Get service type from URL or localStorage
export function getCurrentServiceType(): ServiceType {
  // First check if we're on a service route
  const path = window.location.pathname;
  const match = path.match(/\/services\/([^\/]+)/);

  if (match) {
    const typeFromUrl = routeParamToServiceType(match[1]);
    // Save to localStorage
    localStorage.setItem('selectedServiceType', typeFromUrl);
    return typeFromUrl;
  }

  // Then check localStorage
  const stored = localStorage.getItem('selectedServiceType') as ServiceType;
  if (stored && SERVICE_TYPES[stored]) {
    return stored;
  }

  // Default fallback
  return DEFAULT_SERVICE_TYPE;
}

// Helper to get route for a service type
export function getServiceRoute(type: ServiceType): string {
  const routeMap: Record<ServiceType, string> = {
    tailor: '/services/tailor',
    phone_repair: '/services/phone-repair',
    electronics: '/services/electronics',
    general: '/services/general',
  };
  return routeMap[type];
}

// Helper to convert route param to service type
export function routeParamToServiceType(param: string): ServiceType {
  const map: Record<string, ServiceType> = {
    'tailor': 'tailor',
    'phone-repair': 'phone_repair',
    'electronics': 'electronics',
    'general': 'general',
  };
  return map[param] || 'tailor';
}

// Helper to convert service type to route param
export function serviceTypeToRouteParam(type: ServiceType): string {
  const map: Record<ServiceType, string> = {
    'tailor': 'tailor',
    'phone_repair': 'phone-repair',
    'electronics': 'electronics',
    'general': 'general',
  };
  return map[type] || 'tailor';
}
