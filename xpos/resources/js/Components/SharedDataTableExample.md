# SharedDataTable Usage Guide

The `SharedDataTable` component is designed to handle large datasets (10,000+ records) efficiently with a clean, professional table interface.

## Features

- ✅ **High Performance**: Optimized for 10,000+ records
- ✅ **Advanced Search**: Multi-field search with real-time filtering
- ✅ **Flexible Filtering**: Dropdown, date, text filters
- ✅ **Sortable Columns**: Click-to-sort with visual indicators
- ✅ **Advanced Pagination**: Configurable page sizes (10/25/50/100)
- ✅ **Bulk Actions**: Select multiple rows for batch operations
- ✅ **Row Actions**: Contextual actions per row (view, edit, delete)
- ✅ **Expandable Rows**: Show additional details
- ✅ **Empty States**: Customizable no-data messages
- ✅ **Responsive Design**: Mobile-friendly table layout
- ✅ **Azerbaijani Language**: Full localization support

## Basic Usage

```tsx
import SharedDataTable, { Column, Filter, Action } from '@/Components/SharedDataTable';

// 1. Define your columns
const columns: Column[] = [
    {
        key: 'name',
        label: 'Ad',
        sortable: true,
        render: (item) => (
            <div className="font-medium">{item.name}</div>
        )
    },
    {
        key: 'email',
        label: 'Email',
        sortable: true
    },
    {
        key: 'status',
        label: 'Status',
        align: 'center',
        render: (item) => (
            <span className={`px-2 py-1 rounded ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {item.is_active ? 'Aktiv' : 'Qeyri-aktiv'}
            </span>
        )
    }
];

// 2. Define filters (optional)
const filters: Filter[] = [
    {
        key: 'status',
        type: 'dropdown',
        label: 'Status',
        value: selectedStatus,
        onChange: setSelectedStatus,
        options: [
            { value: '', label: 'Bütün statuslar' },
            { value: 'active', label: 'Aktiv' },
            { value: 'inactive', label: 'Qeyri-aktiv' }
        ]
    }
];

// 3. Define actions (optional)
const actions: Action[] = [
    {
        label: 'Bax',
        href: (item) => `/items/${item.id}`,
        icon: <EyeIcon className="w-4 h-4" />,
        variant: 'primary'
    },
    {
        label: 'Düzəliş',
        href: (item) => `/items/${item.id}/edit`,
        icon: <PencilIcon className="w-4 h-4" />,
        variant: 'secondary'
    },
    {
        label: 'Sil',
        onClick: (item) => handleDelete(item),
        icon: <TrashIcon className="w-4 h-4" />,
        variant: 'danger'
    }
];

// 4. Use the component
<SharedDataTable
    data={paginatedData}
    columns={columns}
    filters={filters}
    actions={actions}
    
    searchValue={search}
    onSearchChange={setSearch}
    onSearch={handleSearch}
    onReset={handleReset}
    
    onSort={handleSort}
    sortField={sortField}
    sortDirection={sortDirection}
    
    title="Məlumatlar"
    subtitle={`${data.total} nəticə tapıldı`}
    createButton={{
        label: "Yeni əlavə et",
        href: "/items/create"
    }}
/>
```

## Advanced Features

### Bulk Actions
```tsx
const bulkActions: BulkAction[] = [
    {
        label: 'Seçilənləri sil',
        onClick: (selectedIds) => handleBulkDelete(selectedIds),
        icon: <TrashIcon className="w-4 h-4" />,
        variant: 'danger'
    },
    {
        label: 'Aktivləşdir',
        onClick: (selectedIds) => handleBulkActivate(selectedIds),
        variant: 'primary'
    }
];

<SharedDataTable
    selectable={true}
    bulkActions={bulkActions}
    // ... other props
/>
```

### Expandable Rows
```tsx
<SharedDataTable
    expandable={true}
    expandedContent={(item) => (
        <div className="p-4">
            <h4 className="font-medium mb-2">Ətraflı məlumat</h4>
            <p>{item.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                    <strong>Yaradılma tarixi:</strong> {item.created_at}
                </div>
                <div>
                    <strong>Yenilənmə tarixi:</strong> {item.updated_at}
                </div>
            </div>
        </div>
    )}
    // ... other props
/>
```

### Custom Row Styling
```tsx
<SharedDataTable
    rowClassName={(item) => 
        item.is_urgent ? 'bg-red-50 border-l-4 border-red-400' : ''
    }
    // ... other props
/>
```

### Performance Options
```tsx
<SharedDataTable
    sticky={true}     // Sticky header for long tables
    dense={true}      // Compact row height
    loading={isLoading}  // Show loading state
    // ... other props
/>
```

## Pre-configured Table Configurations

Use the pre-built configurations from `TableConfigurations.tsx`:

```tsx
import { customerTableConfig, vehicleTableConfig } from '@/Components/TableConfigurations';

// For customers
<SharedDataTable
    {...customerTableConfig}
    data={customers}
    // ... event handlers
/>

// For vehicles  
<SharedDataTable
    {...vehicleTableConfig}
    data={vehicles}
    // ... event handlers
/>
```

## Backend Requirements

Your Laravel controller should return paginated data in this format:

```php
public function index(Request $request)
{
    $query = Model::query();
    
    // Apply search
    if ($request->search) {
        $query->where('name', 'like', "%{$request->search}%");
    }
    
    // Apply filters
    if ($request->status) {
        $query->where('is_active', $request->status === 'active');
    }
    
    // Apply sorting
    if ($request->sort_field) {
        $query->orderBy($request->sort_field, $request->sort_direction ?? 'asc');
    }
    
    return $query->paginate($request->per_page ?? 25);
}
```

## Best Practices

1. **Column Configuration**
   - Use `width` property for fixed-width columns (status, actions)
   - Set `className: 'min-w-0'` for flexible columns to prevent overflow
   - Use `align` property for numerical data alignment

2. **Performance**
   - Use `dense={true}` for tables with many rows
   - Enable `sticky={true}` for better UX with long tables
   - Implement proper pagination on backend

3. **Mobile Responsiveness**
   - Limit number of columns on mobile
   - Use icons in action buttons
   - Consider expandable rows for additional details

4. **Accessibility**
   - Use semantic column labels
   - Provide proper contrast for status badges
   - Include loading states

5. **User Experience**
   - Provide clear empty states
   - Use consistent action patterns
   - Show total record counts
   - Include reset functionality for filters