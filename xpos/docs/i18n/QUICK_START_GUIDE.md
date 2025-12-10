# SharedDataTable i18n Quick Start Guide

## For Developers Using SharedDataTable

### Basic Usage (Recommended)

The SharedDataTable component is now fully internationalized. All UI strings are automatically translated based on the user's language preference.

```tsx
import SharedDataTable from '@/Components/SharedDataTable';
import { useTranslation } from 'react-i18next';

export default function MyPage({ data }) {
    const { t } = useTranslation('myNamespace');

    const columns = [
        {
            key: 'name',
            label: t('columns.name'),
            sortable: true,
        },
        // ... more columns
    ];

    return (
        <SharedDataTable
            data={data}
            columns={columns}
            // All built-in UI strings are auto-translated!
            // No need to translate: filters button, search button, loading text, etc.
        />
    );
}
```

### Auto-Translated Elements

The following UI elements are **automatically translated** in SharedDataTable:
- Search button ("Search" / "Axtar")
- Filters button ("Filters" / "Filtrlər")
- Refresh button ("Refresh" / "Yenilə")
- Loading indicator ("Loading..." / "Yüklənir...")
- Actions column header ("Operations" / "Əməliyyatlar")
- Empty state default messages
- Mobile detail modal ("Details" / "Ətraflı məlumat")
- Close button ("Close" / "Bağla")
- Dropdown placeholders ("Select" / "Seçin")
- Bulk selection count ("X items selected" / "X element seçildi")

### Custom Translations (Optional)

You can override defaults by providing your own translations:

```tsx
<SharedDataTable
    data={data}
    columns={columns}
    searchPlaceholder={t('customSearch')}  // Custom search placeholder
    emptyState={{
        title: t('emptyState.title'),       // Custom empty title
        description: t('emptyState.desc')   // Custom empty description
    }}
/>
```

### Migration from TableConfigurations

**Old way (don't do this):**
```tsx
import { productTableConfig } from '@/Components/TableConfigurations';

<SharedDataTable
    data={data}
    {...productTableConfig}  // ❌ Contains hardcoded strings
/>
```

**New way (do this):**
```tsx
import { useTranslation } from 'react-i18next';

export default function Index({ data }) {
    const { t } = useTranslation('products');

    const columns = [
        {
            key: 'name',
            label: t('fields.name'),
            sortable: true,
        },
        {
            key: 'price',
            label: t('fields.price'),
            sortable: true,
        }
    ];

    const filters = [
        {
            key: 'status',
            type: 'dropdown',
            label: t('filters.status'),
            options: [
                { value: '', label: t('filters.allStatuses') },
                { value: 'active', label: t('status.active') },
                { value: 'inactive', label: t('status.inactive') }
            ]
        }
    ];

    return (
        <SharedDataTable
            data={data}
            columns={columns}
            filters={filters}
            title={t('title')}
            searchPlaceholder={t('searchPlaceholder')}
        />
    );
}
```

## Available Translation Keys

All in `common` namespace:

```ts
// Search & Filters
t('dataTable.searchPlaceholder')   // "Search..." / "Axtar..."
t('dataTable.search')              // "Search" / "Axtar"
t('dataTable.filters')             // "Filters" / "Filtrlər"
t('dataTable.refresh')             // "Refresh" / "Yenilə"

// Table UI
t('dataTable.operations')          // "Operations" / "Əməliyyatlar"
t('dataTable.loading')             // "Loading..." / "Yüklənir..."
t('dataTable.selectPlaceholder')   // "Select" / "Seçin"

// Bulk Actions
t('dataTable.selected', { count: 5 })  // "5 items selected" / "5 element seçildi"

// Empty State
t('dataTable.emptyTitle')          // "No data found" / "Məlumat tapılmadı"
t('dataTable.emptyDescription')    // "Try changing the search criteria."

// Mobile
t('dataTable.detailsTitle')        // "Details" / "Ətraflı məlumat"
t('dataTable.close')               // "Close" / "Bağla"
```

## Common Patterns

### 1. Status Badges
```tsx
{
    key: 'status',
    label: t('fields.status'),
    render: (item) => (
        <span className={...}>
            {item.is_active ? t('status.active') : t('status.inactive')}
        </span>
    )
}
```

### 2. Date Formatting
```tsx
{
    key: 'created_at',
    label: t('fields.createdAt'),
    render: (item) => (
        new Date(item.created_at).toLocaleDateString(
            locale === 'az' ? 'az-AZ' : 'en-US'
        )
    )
}
```

### 3. Action Buttons
```tsx
const actions = [
    {
        label: t('actions.view'),
        href: (item) => `/items/${item.id}`,
        icon: <EyeIcon className="w-4 h-4" />,
        variant: 'primary'
    },
    {
        label: t('actions.edit'),
        href: (item) => `/items/${item.id}/edit`,
        icon: <PencilIcon className="w-4 h-4" />,
        variant: 'secondary'
    },
    {
        label: t('actions.delete'),
        onClick: (item) => handleDelete(item),
        icon: <TrashIcon className="w-4 h-4" />,
        variant: 'danger'
    }
];
```

### 4. Filter Dropdowns
```tsx
const filters = [
    {
        key: 'type',
        type: 'dropdown',
        label: t('filters.type'),
        options: [
            { value: '', label: t('filters.allTypes') },
            { value: 'type1', label: t('types.type1') },
            { value: 'type2', label: t('types.type2') }
        ]
    }
];
```

## Language Switching

Users can switch languages via the LanguageSwitcher component. When the language changes:
1. All SharedDataTable UI elements update automatically
2. Your custom translations (columns, filters, etc.) update via your `t()` calls
3. No page reload required

## Namespace Organization

- **common** - Shared UI strings (buttons, labels, messages)
  - Includes `dataTable` section
- **products** - Product-specific translations
- **customers** - Customer-specific translations
- **sales** - Sales-specific translations
- **[module]** - Module-specific translations

## Troubleshooting

### Problem: Translation not showing
**Solution:** Check that the key exists in both:
- `/public/locales/{lang}/common.json`
- `/resources/js/i18n/locales/{lang}/common.json`

### Problem: TypeScript error on translation key
**Solution:** The key might not exist in type definitions. Add it to `/resources/js/i18n/locales/en/common.json`

### Problem: Empty string instead of translation
**Solution:** Ensure you're importing and using the `useTranslation` hook correctly:
```tsx
const { t } = useTranslation('common');  // ✅ Correct
const t = useTranslation('common');      // ❌ Wrong
```

### Problem: Translation doesn't update when language changes
**Solution:** Make sure you're using the `t()` function in the render, not storing the translated value in a variable outside the component.

```tsx
// ❌ Wrong - stored value won't update
const title = t('title');
return <h1>{title}</h1>;

// ✅ Correct - function call updates on language change
return <h1>{t('title')}</h1>;
```

## Examples

### Complete Example: Products Page

```tsx
import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SharedDataTable from '@/Components/SharedDataTable';
import { CubeIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Index({ products, filters }) {
    const { t } = useTranslation('products');
    const [search, setSearch] = useState(filters.search || '');

    const columns = [
        {
            key: 'name',
            label: t('fields.name'),
            sortable: true,
        },
        {
            key: 'sku',
            label: t('fields.sku'),
            sortable: true,
        },
        {
            key: 'price',
            label: t('fields.price'),
            sortable: true,
            render: (product) => `${product.price} AZN`
        },
        {
            key: 'stock',
            label: t('fields.stock'),
            sortable: true,
            align: 'center'
        }
    ];

    const tableFilters = [
        {
            key: 'status',
            type: 'dropdown',
            label: t('filters.status'),
            value: filters.status || '',
            onChange: (value) => {/* handle change */},
            options: [
                { value: '', label: t('filters.allStatuses') },
                { value: 'active', label: t('status.active') },
                { value: 'inactive', label: t('status.inactive') }
            ]
        }
    ];

    return (
        <AuthenticatedLayout>
            <Head title={t('title')} />

            <SharedDataTable
                data={products}
                columns={columns}
                filters={tableFilters}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder={t('searchPlaceholder')}
                title={t('title')}
                subtitle={t('subtitle', { count: products.total })}
                createButton={{
                    label: t('addProduct'),
                    href: '/products/create'
                }}
                emptyState={{
                    icon: <CubeIcon className="w-12 h-12" />,
                    title: t('emptyState.title'),
                    description: t('emptyState.description'),
                    action: (
                        <Link href="/products/create" className="...">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            {t('addProduct')}
                        </Link>
                    )
                }}
            />
        </AuthenticatedLayout>
    );
}
```

## Need Help?

- Check the main documentation: `SHAREDTABLE_TRANSLATION_SUMMARY.md`
- See a working example: `/Pages/Customers/IndexWithSharedTable.tsx`
- Read i18next docs: https://react.i18next.com/
