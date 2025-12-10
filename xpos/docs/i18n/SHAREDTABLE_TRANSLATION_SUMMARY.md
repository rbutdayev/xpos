# SharedTable Components Translation Summary

## Overview
This document summarizes the internationalization (i18n) work completed for the SharedTable components in the xPOS application.

## Components Translated

### 1. SharedDataTable.tsx
**Location:** `/Users/ruslan/projects/xpos/xpos/resources/js/Components/SharedDataTable.tsx`

**Status:** Fully translated

**Changes Made:**
- Added `useTranslation` hook from `react-i18next`
- Replaced all hardcoded Azerbaijani strings with translation keys
- Made `searchPlaceholder` prop optional with fallback to translation

**Hardcoded Strings Replaced:**

| Original String (Azerbaijani) | Translation Key | Context |
|------------------------------|-----------------|---------|
| "Axtar..." | `dataTable.searchPlaceholder` | Search input placeholder |
| "Yenilə" | `dataTable.refresh` | Refresh button |
| "Filtrlər" | `dataTable.filters` | Filters button |
| "Axtar" | `dataTable.search` | Search button |
| "Seçin" | `dataTable.selectPlaceholder` | Dropdown placeholder |
| "{{count}} element seçildi" | `dataTable.selected` | Bulk selection message |
| "Yüklənir..." | `dataTable.loading` | Loading state |
| "Əməliyyatlar" | `dataTable.operations` | Actions column header |
| "Məlumat tapılmadı" | `dataTable.emptyTitle` | Empty state title |
| "Axtarış meyarlarını dəyişməyi cəhd edin." | `dataTable.emptyDescription` | Empty state description |
| "Ətraflı məlumat" | `dataTable.detailsTitle` | Mobile detail modal title |
| "Bağla" | `dataTable.close` | Close button |

### 2. Translation Files Updated

#### English (`/Users/ruslan/projects/xpos/xpos/public/locales/en/common.json`)
Added new `dataTable` section with following keys:
```json
{
  "dataTable": {
    "emptyTitle": "No data found",
    "emptyDescription": "Try changing the search criteria.",
    "filters": "Filters",
    "search": "Search",
    "searchPlaceholder": "Search...",
    "refresh": "Refresh",
    "actions": "Actions",
    "operations": "Operations",
    "loading": "Loading...",
    "selected": "{{count}} items selected",
    "detailsTitle": "Details",
    "close": "Close",
    "selectPlaceholder": "Select"
  }
}
```

#### Azerbaijani (`/Users/ruslan/projects/xpos/xpos/public/locales/az/common.json`)
Added new `dataTable` section with following keys:
```json
{
  "dataTable": {
    "emptyTitle": "Məlumat tapılmadı",
    "emptyDescription": "Axtarış kriteriyalarını dəyişdirməyi cəhd edin.",
    "filters": "Filtrlər",
    "search": "Axtar",
    "searchPlaceholder": "Axtar...",
    "refresh": "Yenilə",
    "actions": "Əməliyyatlar",
    "operations": "Əməliyyatlar",
    "loading": "Yüklənir...",
    "selected": "{{count}} element seçildi",
    "detailsTitle": "Ətraflı məlumat",
    "close": "Bağla",
    "selectPlaceholder": "Seçin"
  }
}
```

## TableConfigurations.tsx

**Location:** `/Users/ruslan/projects/xpos/xpos/resources/js/Components/TableConfigurations.tsx`

**Status:** Not translated (by design)

**Reason:**
TableConfigurations.tsx is a legacy configuration file containing 3000+ lines with 20+ static table configurations. It contains hardcoded Azerbaijani strings for various modules (branches, customers, products, suppliers, employees, printers, etc.).

**Recommended Approach:**
Instead of translating this large static file, the recommended pattern is to define table configurations inline within each page component using i18next hooks, as demonstrated in:
- `/Users/ruslan/projects/xpos/xpos/resources/js/Pages/Customers/IndexWithSharedTable.tsx`

**Example Pattern:**
```tsx
import { useTranslation } from 'react-i18next';

export default function Index({ data }: Props) {
    const { t } = useTranslation('customers'); // Use appropriate namespace

    const columns: Column[] = [
        {
            key: 'name',
            label: t('fields.customer'),
            // ... rest of config
        }
    ];

    const filters: Filter[] = [
        {
            key: 'type',
            type: 'dropdown',
            label: t('fields.customerType'),
            // ... rest of config
        }
    ];

    return (
        <SharedDataTable
            data={data}
            columns={columns}
            filters={filters}
            searchPlaceholder={t('placeholders.search')}
            // ... other props
        />
    );
}
```

## Pages Using TableConfigurations (Require Future Migration)

The following pages still import and use static configurations from TableConfigurations.tsx:

1. `/Pages/Alerts/Index.tsx` - uses `tableConfig`
2. `/Pages/AuditLogs/Index.tsx` - uses `auditLogTableConfig`
3. `/Pages/Branch/Index.tsx` - uses `tableConfig`
4. `/Pages/EmployeeSalaries/Index.tsx` - uses `tableConfig`
5. `/Pages/GoodsReceipts/Index.tsx` - uses `goodsReceiptsTableConfig`
6. `/Pages/ProductStock/Index.tsx` - uses `productStockTableConfig`
7. `/Pages/Products/Index.tsx` - uses `productTableConfig`
8. `/Pages/Reports/View.tsx` - uses `reportViewConfig`
9. `/Pages/StockMovements/Index.tsx` - uses `tableConfig`
10. `/Pages/SupplierPayments/Index.tsx` - uses `tableConfig`

**Migration Path:**
These pages should be gradually migrated to use inline configurations with i18next, following the pattern in `IndexWithSharedTable.tsx`.

## Usage Examples

### Using SharedDataTable with Translations

```tsx
import SharedDataTable from '@/Components/SharedDataTable';
import { useTranslation } from 'react-i18next';

function MyPage({ data }) {
    const { t } = useTranslation('myNamespace');

    return (
        <SharedDataTable
            data={data}
            columns={columns}
            searchPlaceholder={t('searchPlaceholder')} // Optional - defaults to common.dataTable.searchPlaceholder
            emptyState={{
                title: t('emptyState.title'),
                description: t('emptyState.description')
            }}
            // All UI strings are now automatically translated from common.dataTable namespace
        />
    );
}
```

### Fallback Behavior
If `searchPlaceholder` prop is not provided, SharedDataTable will automatically use `t('dataTable.searchPlaceholder')` from the common namespace.

## Translation Keys Reference

All SharedDataTable UI strings are now in the `common` namespace under `dataTable`:

- `dataTable.searchPlaceholder` - Search input placeholder
- `dataTable.filters` - Filters button text
- `dataTable.search` - Search button text
- `dataTable.refresh` - Refresh button text
- `dataTable.selectPlaceholder` - Dropdown default option
- `dataTable.selected` - Bulk selection message (supports {{count}} interpolation)
- `dataTable.loading` - Loading indicator text
- `dataTable.operations` - Actions column header
- `dataTable.emptyTitle` - Empty state title
- `dataTable.emptyDescription` - Empty state description
- `dataTable.detailsTitle` - Mobile detail modal title
- `dataTable.close` - Close button text

## Testing Recommendations

1. **Test language switching:** Verify all SharedDataTable UI elements update when language changes
2. **Test mobile view:** Verify mobile detail modal shows translated strings
3. **Test empty states:** Verify empty state messages are properly translated
4. **Test bulk selection:** Verify selection count message translates correctly with count interpolation
5. **Test filters:** Verify filter dropdown placeholders are translated

## Supported Languages

- English (en)
- Azerbaijani (az)

## Future Improvements

1. **Migrate pages from TableConfigurations.tsx:** Gradually move all pages to use inline configurations with i18next
2. **Add RTL support:** If Arabic or other RTL languages are added in future
3. **Add translation validation:** Create a script to validate all translation keys are present in all language files
4. **Consider dynamic imports:** For large translation files, implement code splitting per namespace

## Related Files

- `/resources/js/Components/SharedDataTable.tsx` - Main table component (translated)
- `/resources/js/Components/TableConfigurations.tsx` - Legacy static configs (not translated)
- `/resources/js/Pages/Customers/IndexWithSharedTable.tsx` - Example of best practice pattern
- `/public/locales/en/common.json` - English translations
- `/public/locales/az/common.json` - Azerbaijani translations
- `/resources/js/i18n/index.ts` - i18next configuration
- `/resources/js/Hooks/useTranslations.ts` - Backend enum translations hook

## Notes

- The `useTranslations` hook at `/resources/js/Hooks/useTranslations.ts` is for backend-provided enum translations (payment methods, expense types, etc.), not for component UI strings
- SharedDataTable now uses `react-i18next` for all UI strings
- All translation keys follow the pattern: `namespace.section.key`
- The `common` namespace is preloaded for optimal performance
