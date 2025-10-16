# Frontend Updates Needed - XPOS Transformation

**Created:** 2025-10-16
**Purpose:** Track all frontend changes needed for E-Service → XPOS transformation
**Status:** 🔴 Pending (Backend complete, frontend not started)

---

## 📋 Overview

The backend transformation from auto-service to clothes retail POS is **COMPLETE**. However, the **frontend React/Inertia components still reference old field names and pages** from the vehicle/service system.

**This document tracks ALL frontend updates needed to complete the transformation.**

---

## 🎯 Critical Priority Items

### 1. **CustomerItems Pages** (HIGH PRIORITY)
**Backend Status:** ✅ Complete (TASK-005)
**Frontend Status:** 🔴 Needs Updates

**Required Changes:**

#### **A. Response Key Changes**
The controller now returns different keys:
- `customerItems` → `items` (index)
- `customerItem` → `item` (show, edit)

**Files to Update:**
- `/resources/js/Pages/CustomerItems/Index.tsx`
- `/resources/js/Pages/CustomerItems/Show.tsx`
- `/resources/js/Pages/CustomerItems/Edit.tsx`
- `/resources/js/Pages/CustomerItems/Create.tsx`

**Example Fix:**
```tsx
// OLD (WRONG)
const { customerItems } = usePage().props;

// NEW (CORRECT)
const { items } = usePage().props;
```

---

#### **B. Field Name Changes**
| OLD Field | NEW Field | Impact |
|-----------|-----------|--------|
| `description` | `item_description` | Forms, Display |
| `fabric_type` | `fabric` | Forms, Display |
| `received_date` | `purchase_date` | Forms, Display |

**Example Fix:**
```tsx
// OLD (WRONG)
<Input name="description" />
<Input name="fabric_type" />

// NEW (CORRECT)
<Input name="item_description" />
<Input name="fabric" />
```

---

#### **C. New Fields to Add**
These fields are NEW and must be added to forms:
1. ✅ `size` - Customer item size (e.g., "M", "L", "42")
2. ✅ `purchase_date` - When item was purchased (renamed from received_date)
3. ✅ `special_instructions` - Special handling instructions

**Files to Update:**
- `/resources/js/Pages/CustomerItems/Create.tsx` - Add fields to form
- `/resources/js/Pages/CustomerItems/Edit.tsx` - Add fields to form
- `/resources/js/Pages/CustomerItems/Show.tsx` - Display these fields

**Example:**
```tsx
<FormField
  label="Size"
  name="size"
  placeholder="e.g., M, L, XL, 42"
/>

<FormField
  label="Special Instructions"
  name="special_instructions"
  type="textarea"
  placeholder="Any special handling instructions..."
/>
```

---

#### **D. Remove Old Vehicle Fields**
These fields NO LONGER EXIST and must be REMOVED:
- ❌ `measurements` (JSON field)
- ❌ `reference_number`
- ❌ `received_date` (renamed to purchase_date)
- ❌ `is_active` (boolean)
- ❌ `account_id` (auto-handled by backend)

**Action:** Search and remove these from all CustomerItems components

---

#### **E. Item Types Dropdown**
The backend now provides `itemTypes` array with Azerbaijani translations:

```typescript
const itemTypes = {
  'Jacket': 'Gödəkçə',
  'Dress': 'Paltar',
  'Suit': 'Kostyum',
  'Pants': 'Şalvar',
  'Shirt': 'Köynək',
  'Coat': 'Palto',
  'Other': 'Digər',
};
```

**Required:**
- Add dropdown/select for `item_type` in Create.tsx
- Add dropdown/select for `item_type` in Edit.tsx
- Display translated label in Show.tsx and Index.tsx

**Example:**
```tsx
<Select name="item_type" label="Item Type">
  <option value="">Select type...</option>
  {Object.entries(itemTypes).map(([value, label]) => (
    <option key={value} value={value}>{label}</option>
  ))}
</Select>
```

---

#### **F. Computed Attributes to Display**
The backend now provides computed attributes:
- `full_description` - Example: "Blue Cotton Jacket (Size M)"
- `display_name` - Example: "Jacket #123"

**Use in:**
- Index page - Show `display_name` in table
- Show page - Display `full_description`
- Search results - Show `display_name`

---

#### **G. Tailor Services Relationship**
**OLD:** `serviceRecords`
**NEW:** `tailorServices`

**Files to Update:**
- `/resources/js/Pages/CustomerItems/Show.tsx` - Update relationship name

**Example:**
```tsx
// OLD (WRONG)
{item.serviceRecords?.map(record => ...)}

// NEW (CORRECT)
{item.tailorServices?.map(service => ...)}
```

---

### 2. **TailorServices Pages** (HIGH PRIORITY)
**Backend Status:** ✅ Complete (TASK-006)
**Frontend Status:** 🔴 Needs Updates

**Required Changes:**

#### **A. Page Renaming**
Rename directory:
- `/resources/js/Pages/ServiceRecords/` → `/resources/js/Pages/TailorServices/`

Rename all files:
- `Index.tsx`, `Create.tsx`, `Edit.tsx`, `Show.tsx`

---

#### **B. Field Name Changes**
| OLD Field | NEW Field | Impact |
|-----------|-----------|--------|
| `service_number` | `order_number` | Forms, Display, API |
| `vehicle_id` | `customer_item_id` | Forms, Dropdowns |
| `vehicle` | `customerItem` | Display, Relationships |
| `vehicle_mileage` | `customer_item_condition` | Forms, Display |
| `parts_total` | `materials_total` | Forms, Display |
| `labor_cost` | `labor_total` | Forms, Display |
| `total_cost` | `total` | Display |

**Files to Update:**
- All TailorServices pages

---

#### **C. New Fields to Add**
1. ✅ `service_type` - Dropdown: alteration, repair, custom
2. ✅ `customer_item_condition` - Text area for item condition
3. ✅ `delivery_date` - Date picker for promised delivery
4. ✅ `discount` - Numeric input for discount amount
5. ✅ `tax` - Numeric input for tax amount

**Service Type Dropdown:**
```tsx
const serviceTypes = {
  'alteration': 'Dəyişiklik',
  'repair': 'Təmir',
  'custom': 'Fərdi Tikiş',
};
```

---

#### **D. Order Number Display**
**NEW Format:** `TS-2025-0001`
- Auto-generated by backend
- Display prominently on show page
- Use in search/filter

---

#### **E. Computed Attributes**
Backend provides:
- `service_type_label` - Azerbaijani translation
- `status_text` - Status in Azerbaijani
- `is_overdue` - Boolean flag for overdue services

**Use:**
- Display labels instead of raw values
- Show warning badge if `is_overdue === true`

---

#### **F. Customer Item Selector**
**NEW:** Dynamic customer item dropdown
- When customer is selected, fetch their items
- Use endpoint: `GET /customers/{customer}/items`
- Display: `display_name` or `full_description`

**Example:**
```tsx
const fetchCustomerItems = async (customerId) => {
  const response = await axios.get(`/customers/${customerId}/items`);
  setCustomerItems(response.data);
};
```

---

#### **G. Status Update Button**
Add status quick-update feature:
- Endpoint: `POST /tailor-services/{id}/update-status`
- Dropdown with statuses: pending, in_progress, completed, cancelled
- Ajax update without page reload

---

#### **H. Overdue/Upcoming Filters**
Add filter buttons:
- "Overdue Services" - Uses `?overdue=true`
- "Upcoming Deliveries" - Uses `?upcoming=true`
- "By Service Type" - Dropdown filter

---

### 3. **Product Variants** (HIGH PRIORITY)
**Backend Status:** ✅ Complete (TASK-004)
**Frontend Status:** 🔴 Needs Creation (NEW PAGES)

**Required Components:**

#### **A. Variant Matrix Builder** (NEW COMPONENT)
**File:** `/resources/js/Pages/Products/Components/VariantMatrixBuilder.tsx`

**Purpose:** Create multiple variants at once (Size × Color matrix)

**Features:**
- Size selector: checkboxes for XS, S, M, L, XL, XXL, XXXL
- Color picker: Add multiple colors with hex codes
- Price adjustment per variant
- Preview matrix before submission
- Bulk create via API

**Example UI:**
```
Sizes:    [✓] S  [✓] M  [✓] L
Colors:   Red (#FF0000)   [Add Color]
          Blue (#0000FF)  [Add Color]

Preview Matrix:
- S × Red   ($100.00)
- S × Blue  ($100.00)
- M × Red   ($100.00)
- M × Blue  ($100.00)
- L × Red   ($105.00) [+$5]
- L × Blue  ($105.00) [+$5]

[Create 6 Variants]
```

**API:**
```tsx
POST /products/{product}/variants
{
  "variants": [
    {"size": "S", "color": "Red", "color_code": "#FF0000", "price_adjustment": 0},
    {"size": "M", "color": "Red", "color_code": "#FF0000", "price_adjustment": 0},
    // ...
  ]
}
```

---

#### **B. Variant List Page** (NEW PAGE)
**File:** `/resources/js/Pages/Products/Variants/Index.tsx`

**Purpose:** List all variants for a product

**Features:**
- Table with: Size, Color (with swatch), SKU, Barcode, Stock, Price, Status
- Edit button per variant
- Delete button per variant (with stock check)
- Toggle active/inactive status
- Bulk barcode generation button
- Link back to product

**API:**
- GET `/products/{product}/variants` - List variants
- POST `/variants/{variant}/toggle-status` - Toggle status
- DELETE `/variants/{variant}` - Delete variant

---

#### **C. Variant Selector Component** (NEW COMPONENT)
**File:** `/resources/js/Components/VariantSelector.tsx`

**Purpose:** Select variant when adding product to sale/receipt/transfer

**Features:**
- Dropdown showing: Size - Color (Stock: X)
- Color swatch display
- Stock level indicator (green/yellow/red)
- Barcode quick entry
- Used in: POS, Goods Receipt, Stock Transfer

**Example:**
```tsx
<VariantSelector
  product={product}
  onSelect={(variant) => addToCart(variant)}
  warehouseId={currentWarehouse}
/>
```

---

#### **D. Variant Display Component** (NEW COMPONENT)
**File:** `/resources/js/Components/VariantDisplay.tsx`

**Purpose:** Compact display of variant info in carts/receipts/reports

**Example Output:**
```
M / Red [●]  Stock: 15
```

**Props:**
- `variant` - Variant object
- `showStock` - Boolean
- `compact` - Boolean (minimal view)

---

#### **E. Barcode Generation Modal** (NEW COMPONENT)
**File:** `/resources/js/Pages/Products/Components/BarcodeGenerateModal.tsx`

**Purpose:** Bulk barcode generation for variants

**Features:**
- Shows count of variants without barcodes
- Confirmation dialog
- Progress indicator
- Success message with count

**API:**
```tsx
POST /products/{product}/variants/generate-barcodes
```

---

### 4. **Navigation Updates** (MEDIUM PRIORITY)
**File:** `/resources/js/Layouts/AuthenticatedLayout.tsx`

**Required Changes:**

```tsx
// REMOVE these menu items:
- { name: 'Avtomaşınlar', href: '/vehicles' }
- { name: 'Servis', href: '/service-records' }

// ADD these menu items:
- { name: 'Müştəri Məhsulları', href: '/customer-items', icon: ShirtIcon }
- { name: 'Dərzi Xidmətləri', href: '/tailor-services', icon: ScissorsIcon }
```

---

### 5. **POS Updates** (HIGH PRIORITY)
**File:** `/resources/js/Pages/POS/Index.tsx`

**Required Changes:**

#### **A. Product Search Updates**
- After selecting product, show variant selector if `product.has_variants`
- If no variant selected, prevent adding to cart
- Store both `product_id` and `variant_id` in cart

#### **B. Cart Display Updates**
- Show variant info: "Product Name - Size Color"
- Display color swatch
- Show variant-specific price

#### **C. Barcode Scanner Updates**
- Search by variant barcode (not just product)
- Auto-select variant if barcode matches
- API: Search `product_variants.barcode` first, then `products.barcode`

---

### 6. **Stock Management Updates** (HIGH PRIORITY)

**Files to Update:**
- `/resources/js/Pages/GoodsReceipt/Create.tsx`
- `/resources/js/Pages/GoodsReceipt/Edit.tsx`
- `/resources/js/Pages/StockMovement/Create.tsx`
- `/resources/js/Pages/WarehouseTransfer/Create.tsx`

**Required Changes:**
- Add variant selector after product selection
- Store `variant_id` along with `product_id`
- Display variant info in item lists
- Update stock queries to include variant_id

---

### 7. **Reports Updates** (MEDIUM PRIORITY)

**Files to Update:**
- `/resources/js/Pages/Reports/Stock.tsx`
- `/resources/js/Pages/Reports/Sales.tsx`
- `/resources/js/Pages/Reports/PurchaseHistory.tsx`

**Required Changes:**
- Add variant column to reports
- Filter by variant (optional)
- Group by variant in analytics
- Show variant details in exports

---

## 📊 Summary Statistics

| Category | Pages to Update | Components to Create | Priority |
|----------|----------------|---------------------|----------|
| CustomerItems | 4 pages | 0 | HIGH |
| TailorServices | 4 pages | 1 component | HIGH |
| Product Variants | 1 page | 4 components | HIGH |
| POS System | 3 pages | 1 component | HIGH |
| Stock Management | 6 pages | 0 | HIGH |
| Reports | 3 pages | 0 | MEDIUM |
| Navigation | 1 file | 0 | MEDIUM |

**Total:**
- Pages to update: 21
- New components to create: 6
- High priority items: 17
- Medium priority items: 4

---

## 🎯 Recommended Implementation Order

### **Phase 1: Core Data (Week 1)**
1. ✅ Update CustomerItems pages (4 pages)
2. ✅ Update TailorServices pages (4 pages)
3. ✅ Update Navigation menu

### **Phase 2: Variants (Week 2)**
4. ✅ Create VariantMatrixBuilder component
5. ✅ Create Variants Index page
6. ✅ Create VariantSelector component
7. ✅ Create VariantDisplay component
8. ✅ Create BarcodeGenerateModal

### **Phase 3: POS & Stock (Week 3)**
9. ✅ Update POS system with variant support
10. ✅ Update Stock Management pages
11. ✅ Update barcode scanner logic

### **Phase 4: Reports (Week 4)**
12. ✅ Update all reports with variant columns
13. ✅ Add variant filtering
14. ✅ Testing & bug fixes

---

## 🔗 Backend Tasks Completed

All backend work is DONE:
- ✅ TASK-001 & TASK-001-B: Migration fixes
- ✅ TASK-002: ProductVariant model
- ✅ TASK-003: CustomerItem & TailorService models
- ✅ TASK-004: ProductVariantController
- ✅ TASK-005: CustomerItemController
- ✅ TASK-006: TailorServiceController (pending verification)

**Backend is production-ready and waiting for frontend!**

---

## 📝 Notes for Frontend Developers

### **API Endpoints Reference**

**CustomerItems:**
- GET `/customer-items` - List
- POST `/customer-items` - Create
- GET `/customer-items/{id}` - Show
- PUT `/customer-items/{id}` - Update
- DELETE `/customer-items/{id}` - Delete
- GET `/customer-items/search?q=...` - Search

**TailorServices:**
- GET `/tailor-services` - List
- POST `/tailor-services` - Create
- GET `/tailor-services/{id}` - Show
- PUT `/tailor-services/{id}` - Update
- DELETE `/tailor-services/{id}` - Delete
- GET `/customers/{customer}/items` - Get customer's items (AJAX)
- POST `/tailor-services/{id}/update-status` - Quick status update

**Product Variants:**
- GET `/products/{product}/variants` - List variants
- POST `/products/{product}/variants` - Create variant(s)
- PUT `/variants/{variant}` - Update variant
- DELETE `/variants/{variant}` - Delete variant
- POST `/products/{product}/variants/generate-barcodes` - Generate barcodes
- POST `/variants/{variant}/toggle-status` - Toggle active status

---

## ✅ Testing Checklist (After Implementation)

- [ ] CustomerItems CRUD works with new fields
- [ ] TailorServices CRUD works with new fields
- [ ] Order number displays correctly (TS-YYYY-NNNN format)
- [ ] Variant matrix builder creates multiple variants
- [ ] Variant selector shows in POS/Stock pages
- [ ] Barcode scanner recognizes variant barcodes
- [ ] Stock tracking works per variant
- [ ] Reports show variant details
- [ ] Multi-tenant isolation works (test with 2 accounts)
- [ ] Overdue services show warning badge
- [ ] Customer item selector updates dynamically
- [ ] All old vehicle/service references removed

---

**Last Updated:** 2025-10-16
**Status:** Ready for frontend implementation
**Created By:** Team Lead (Claude)
