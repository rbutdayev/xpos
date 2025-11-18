# SharedDataTable Mobile Responsiveness Guide

## Overview

The SharedDataTable component now includes comprehensive mobile responsiveness features that provide an optimal viewing experience on mobile devices without horizontal scrolling.

## Key Mobile Features

### 1. **Automatic Mobile Detection**
- Automatically detects screens smaller than 768px (md breakpoint)
- No configuration needed - works out of the box

### 2. **Column Hiding on Mobile**
- Hide non-essential columns on mobile devices
- Show only critical information to prevent clutter

### 3. **Clickable Rows**
- Make entire rows clickable on mobile
- Opens a detail modal showing all column data
- Actions are displayed in the modal

### 4. **Hidden Action Buttons**
- Action buttons hidden from table on mobile (default)
- Actions shown in mobile detail modal instead
- Reduces horizontal space requirements

### 5. **Responsive Table Layout**
- Removes minimum width constraint on mobile
- Table fits screen width perfectly
- No horizontal scrolling needed

## Implementation Guide

### Step 1: Configure Columns with Mobile Properties

Add the following optional properties to your column definitions:

```typescript
const columns: Column[] = [
    {
        key: 'name',
        label: 'Customer Name',
        mobileLabel: 'Name', // Shorter label for mobile detail view
        // No hideOnMobile - this is essential, always shown
    },
    {
        key: 'contact',
        label: 'Contact Information',
        mobileLabel: 'Phone / Email',
        // No hideOnMobile - important information
    },
    {
        key: 'additional_info',
        label: 'Additional Information',
        hideOnMobile: true, // Hide on mobile - less critical
    },
    {
        key: 'status',
        label: 'Status',
        // No hideOnMobile - shown on both mobile and desktop
    },
];
```

### Column Properties:

- **`hideOnMobile?: boolean`** - Set to `true` to hide this column on mobile devices
- **`mobileLabel?: string`** - Alternative label used in mobile detail view (optional, defaults to `label`)

### Step 2: Enable Mobile Features on SharedDataTable

Add the mobile props to your SharedDataTable component:

```typescript
<SharedDataTable
    data={data}
    columns={columns}
    actions={actions}
    // ... other props

    // Mobile-specific props
    mobileClickable={true}        // Enable row clicks on mobile
    hideMobileActions={true}      // Hide action buttons on mobile (default: true)
    // onMobileRowClick={handleClick} // Optional: custom click handler
/>
```

### Mobile Props:

- **`mobileClickable?: boolean`** - Makes rows clickable on mobile. When clicked, shows detail modal. Default: `false`
- **`hideMobileActions?: boolean`** - Hides action buttons from table on mobile. Actions shown in detail modal instead. Default: `true`
- **`onMobileRowClick?: (item: any) => void`** - Optional custom handler for mobile row clicks. If not provided, uses built-in detail modal

## Mobile Behavior

### Desktop View (≥768px)
- Shows all columns (except those explicitly hidden)
- Shows action buttons in table
- Minimum table width enforced
- Horizontal scrolling if needed
- Checkbox selection visible
- Expandable rows visible

### Mobile View (<768px)
- Shows only columns without `hideOnMobile: true`
- Hides action buttons from table (if `hideMobileActions` is true)
- No minimum table width - fits screen
- No horizontal scrolling
- Rows are clickable (if `mobileClickable` is true)
- Checkbox selection hidden
- Expandable rows hidden
- Opens detail modal on row click

### Mobile Detail Modal

When a user clicks a row on mobile:
1. Modal opens showing all column data
2. Each field displays with its label and value
3. All actions are shown as full-width buttons
4. User can perform actions or close modal

Modal includes:
- All columns (including those hidden in table view)
- Uses `mobileLabel` if provided, otherwise uses `label`
- Renders column `render` functions properly
- Shows all available actions as clickable buttons
- Close button at bottom

## Best Practices

### 1. Choose Visible Columns Wisely
Show 2-3 most important columns on mobile:
- **Always show**: Primary identifier (name, ID, title)
- **Consider showing**: Status, key dates, primary contact
- **Hide on mobile**: Detailed descriptions, secondary info, timestamps

### 2. Column Priority Guide
```typescript
// High priority - always show
{ key: 'name', label: 'Name' }
{ key: 'status', label: 'Status' }

// Medium priority - show if space allows
{ key: 'phone', label: 'Phone', hideOnMobile: true }

// Low priority - hide on mobile
{ key: 'created_at', label: 'Created', hideOnMobile: true }
{ key: 'notes', label: 'Notes', hideOnMobile: true }
```

### 3. Mobile Labels
Keep mobile labels short and clear:
```typescript
{
    label: 'Customer Contact Information',
    mobileLabel: 'Contact', // Shorter for mobile
}
```

### 4. Action Configuration
Let the component handle actions automatically:
- Set `mobileClickable={true}`
- Set `hideMobileActions={true}` (or omit - it's default)
- Actions will appear in mobile modal automatically

## Examples

### Example 1: Products Page

```typescript
const columns: Column[] = [
    {
        key: 'name',
        label: 'Product Name',
        mobileLabel: 'Product',
    },
    {
        key: 'price',
        label: 'Price',
    },
    {
        key: 'stock',
        label: 'Stock Quantity',
        mobileLabel: 'Stock',
        hideOnMobile: true, // Hide on mobile
    },
    {
        key: 'category',
        label: 'Category',
        hideOnMobile: true, // Hide on mobile
    },
    {
        key: 'status',
        label: 'Status',
    },
];

<SharedDataTable
    data={products}
    columns={columns}
    actions={actions}
    mobileClickable={true}
    hideMobileActions={true}
/>
```

Mobile view will show: Product Name, Price, Status
Detail modal will show: All fields including Stock and Category

### Example 2: Sales Page

```typescript
const columns: Column[] = [
    {
        key: 'invoice_number',
        label: 'Invoice #',
        mobileLabel: 'Invoice',
    },
    {
        key: 'customer',
        label: 'Customer',
    },
    {
        key: 'total',
        label: 'Total Amount',
        mobileLabel: 'Total',
    },
    {
        key: 'payment_method',
        label: 'Payment Method',
        hideOnMobile: true,
    },
    {
        key: 'date',
        label: 'Date',
        hideOnMobile: true,
    },
    {
        key: 'status',
        label: 'Status',
    },
];

<SharedDataTable
    data={sales}
    columns={columns}
    actions={actions}
    mobileClickable={true}
/>
```

### Example 3: Custom Mobile Click Handler

```typescript
const handleMobileClick = (customer: Customer) => {
    // Custom behavior - navigate to detail page
    router.visit(route('customers.show', customer.id));
};

<SharedDataTable
    data={customers}
    columns={columns}
    actions={actions}
    mobileClickable={true}
    onMobileRowClick={handleMobileClick} // Custom handler
/>
```

## Migration Checklist

For each page using SharedDataTable:

1. [ ] Review all columns and decide which to hide on mobile
2. [ ] Add `hideOnMobile: true` to non-essential columns
3. [ ] Add `mobileLabel` to columns with long labels
4. [ ] Add `mobileClickable={true}` to SharedDataTable
5. [ ] Add `hideMobileActions={true}` (or omit - it's default)
6. [ ] Test on mobile device or browser dev tools
7. [ ] Verify detail modal shows all information
8. [ ] Verify actions work correctly in modal

## Testing

### Browser Dev Tools
1. Open Chrome/Firefox Dev Tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone, Samsung, etc.)
4. Test table functionality:
   - Verify hidden columns don't appear
   - Click row to open detail modal
   - Test actions in modal
   - Verify no horizontal scrolling

### Recommended Test Devices
- iPhone SE (375px) - smallest modern phone
- iPhone 12/13 (390px)
- Samsung Galaxy S20 (360px)
- iPad Mini (768px) - breakpoint edge case

## Summary

The mobile responsiveness features make SharedDataTable perfect for mobile users by:
- **Eliminating horizontal scrolling** - table fits screen width
- **Reducing visual clutter** - only essential columns shown
- **Maintaining full functionality** - all data accessible via detail modal
- **Improving usability** - large clickable areas, easy-to-tap actions
- **Zero configuration for basic use** - works automatically with sensible defaults

Start by updating high-traffic pages (Customers, Products, Sales) first, then gradually migrate all pages using the checklist above.
