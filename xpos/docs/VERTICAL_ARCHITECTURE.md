# Vertical-Agnostic Platform Architecture

## 🎯 Executive Summary

This document defines the architecture for transforming the Onyx xPos platform from an auto-service-specific system into a **vertical-agnostic multi-tenant platform** that can serve ANY service-based or retail business.

### Key Principles
1. **Business Type Flexibility**: Support pure retail (inventory only) AND service+retail businesses
2. **Vertical Adaptability**: One codebase adapts to any industry vertical
3. **No Code Duplication**: Configuration-driven, not code-driven differences
4. **Backward Compatibility**: Existing auto-service accounts continue working
5. **Onboarding-Driven**: Business type and vertical selected during account creation

---

## 🏢 Business Type Categories

### Type 1: SERVICE + INVENTORY
**Description**: Businesses that provide services AND sell products/parts
**UI Elements**: Service Records, Vehicles/Devices, Customers, Inventory, POS, Reports

**Verticals**:
- Auto Service & Repair
- Mobile Phone Repair
- Computer/IT Services
- Appliance Repair
- HVAC Services
- Bicycle/Motorcycle Shop
- Jewelry Repair
- Watch Repair
- Musical Instrument Repair
- Medical Equipment Service
- Industrial Machinery Maintenance

### Type 2: INVENTORY ONLY (Retail/Wholesale)
**Description**: Businesses that ONLY sell products (no service tracking needed)
**UI Elements**: Inventory, POS, Sales, Customers, Suppliers, Reports
**Hidden Elements**: ❌ Service Records, ❌ Vehicles/Devices, ❌ Labor tracking

**Verticals**:
- Auto Parts Store (no repair service)
- Electronics Store
- Clothing/Fashion Retail
- Grocery/Convenience Store
- Pharmacy
- Hardware Store
- Office Supplies
- Beauty Products Store
- Pet Store
- Book Store
- Wholesale Distributor

---

## 📊 Data Model Architecture

### Core Abstraction: ServiceableEntity

**Current**: `Vehicle` model is auto-service specific
**Solution**: Rename and abstract to `ServiceableEntity` (keeps same table)

#### Flexible Field Mapping

| Abstract Field | Auto Service | Mobile Repair | Computer Service | Appliance Repair |
|---------------|--------------|---------------|------------------|------------------|
| `identifier` | Plate Number | IMEI | Asset Tag | Serial Number |
| `brand` | Make (Toyota) | Manufacturer (Apple) | Manufacturer (Dell) | Brand (Samsung) |
| `model` | Model (Camry) | Model (iPhone 15) | Model (Latitude 5420) | Model (WF80F5E0W2W) |
| `year` | Year (2020) | Release Year (2023) | Purchase Year | Manufacture Year |
| `secondary_id` | VIN | Serial Number | MAC Address | Model Number |
| `variant` | Engine Type | Storage/Carrier | OS/Specs | Appliance Type |
| `color` | Color | Color | ❌ Hidden | Color |
| `metric_value` | Mileage (km) | Warranty Status | Install Date | Purchase Date |
| `metric_label` | "Mileage" | "Warranty" | "Installed" | "Purchased" |

---

## 🗄️ Database Schema Changes

### Migration Strategy: Rename Columns (Backward Compatible)

```sql
-- Phase 1: Add new columns (keep old ones)
ALTER TABLE vehicles ADD COLUMN identifier VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN secondary_id VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN variant VARCHAR(255);
ALTER TABLE vehicles ADD COLUMN metric_value INTEGER;
ALTER TABLE vehicles ADD COLUMN metric_label VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN metadata JSON;

-- Phase 2: Migrate existing data
UPDATE vehicles SET
    identifier = plate_number,
    secondary_id = vin,
    variant = engine_type,
    metric_value = mileage,
    metric_label = 'Mileage (km)';

-- Phase 3: After migration, drop old columns (optional, can keep for rollback)
-- ALTER TABLE vehicles DROP COLUMN plate_number;
-- ALTER TABLE vehicles DROP COLUMN vin;
-- ALTER TABLE vehicles DROP COLUMN engine_type;
-- ALTER TABLE vehicles DROP COLUMN mileage;
```

### Account/Company Schema Addition

```sql
-- Add to accounts table
ALTER TABLE accounts ADD COLUMN business_type VARCHAR(50) DEFAULT 'service_inventory';
-- Options: 'service_inventory' or 'inventory_only'

ALTER TABLE accounts ADD COLUMN vertical VARCHAR(50) DEFAULT 'auto_service';
-- Options: 'auto_service', 'mobile_repair', 'computer_service', etc.

ALTER TABLE accounts ADD COLUMN entity_name VARCHAR(50) DEFAULT 'Vehicle';
-- Dynamic entity name: 'Vehicle', 'Device', 'Equipment', 'Appliance', etc.

ALTER TABLE accounts ADD COLUMN vertical_config JSON;
-- Store vertical-specific configuration
```

---

## ⚙️ Configuration System

### File: `config/verticals.php`

This configuration file defines ALL vertical types and their field mappings.

```php
<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SERVICE + INVENTORY BUSINESSES
    |--------------------------------------------------------------------------
    */

    'auto_service' => [
        'category' => 'service_inventory',
        'name' => 'Auto Service & Repair',
        'icon' => 'car',
        'entity_name' => 'Vehicle',
        'entity_name_plural' => 'Vehicles',
        'fields' => [
            'identifier' => [
                'label' => 'Plate Number',
                'type' => 'text',
                'required' => true,
                'placeholder' => '10-AB-123',
            ],
            'brand' => [
                'label' => 'Make/Brand',
                'type' => 'text',
                'required' => true,
                'placeholder' => 'Toyota',
            ],
            'model' => [
                'label' => 'Model',
                'type' => 'text',
                'required' => true,
                'placeholder' => 'Camry',
            ],
            'year' => [
                'label' => 'Year',
                'type' => 'number',
                'required' => false,
                'min' => 1900,
                'max' => 2030,
            ],
            'secondary_id' => [
                'label' => 'VIN',
                'type' => 'text',
                'required' => false,
                'placeholder' => '1HGBH41JXMN109186',
            ],
            'variant' => [
                'label' => 'Engine Type',
                'type' => 'select',
                'required' => false,
                'options' => [
                    'petrol' => 'Petrol',
                    'diesel' => 'Diesel',
                    'electric' => 'Electric',
                    'hybrid' => 'Hybrid',
                ],
            ],
            'color' => [
                'label' => 'Color',
                'type' => 'text',
                'required' => false,
            ],
            'metric_value' => [
                'label' => 'Mileage',
                'type' => 'number',
                'required' => false,
                'suffix' => 'km',
            ],
        ],
    ],

    'mobile_repair' => [
        'category' => 'service_inventory',
        'name' => 'Mobile Phone Repair',
        'icon' => 'smartphone',
        'entity_name' => 'Device',
        'entity_name_plural' => 'Devices',
        'fields' => [
            'identifier' => [
                'label' => 'IMEI',
                'type' => 'text',
                'required' => true,
                'placeholder' => '352698765432101',
            ],
            'brand' => [
                'label' => 'Manufacturer',
                'type' => 'select',
                'required' => true,
                'options' => ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'OnePlus', 'Google', 'Other'],
            ],
            'model' => [
                'label' => 'Model',
                'type' => 'text',
                'required' => true,
                'placeholder' => 'iPhone 15 Pro',
            ],
            'year' => [
                'label' => 'Release Year',
                'type' => 'number',
                'required' => false,
            ],
            'secondary_id' => [
                'label' => 'Serial Number',
                'type' => 'text',
                'required' => false,
            ],
            'variant' => [
                'label' => 'Storage/Carrier',
                'type' => 'select',
                'required' => false,
                'options' => ['64GB', '128GB', '256GB', '512GB', '1TB'],
            ],
            'color' => [
                'label' => 'Color',
                'type' => 'text',
                'required' => false,
            ],
            'metric_value' => [
                'label' => 'Warranty Status',
                'type' => 'select',
                'required' => false,
                'options' => [
                    'in_warranty' => 'Under Warranty',
                    'expired' => 'Warranty Expired',
                    'unknown' => 'Unknown',
                ],
            ],
        ],
    ],

    'computer_service' => [
        'category' => 'service_inventory',
        'name' => 'Computer/IT Services',
        'icon' => 'monitor',
        'entity_name' => 'Equipment',
        'entity_name_plural' => 'Equipment',
        'fields' => [
            'identifier' => [
                'label' => 'Asset Tag',
                'type' => 'text',
                'required' => true,
                'placeholder' => 'IT-2024-001',
            ],
            'brand' => [
                'label' => 'Manufacturer',
                'type' => 'select',
                'required' => true,
                'options' => ['Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Other'],
            ],
            'model' => [
                'label' => 'Model',
                'type' => 'text',
                'required' => true,
            ],
            'year' => [
                'label' => 'Purchase Year',
                'type' => 'number',
                'required' => false,
            ],
            'secondary_id' => [
                'label' => 'Serial Number',
                'type' => 'text',
                'required' => false,
            ],
            'variant' => [
                'label' => 'Equipment Type',
                'type' => 'select',
                'required' => true,
                'options' => [
                    'desktop' => 'Desktop Computer',
                    'laptop' => 'Laptop',
                    'server' => 'Server',
                    'printer' => 'Printer',
                    'network' => 'Network Equipment',
                    'other' => 'Other',
                ],
            ],
            'color' => [
                'label' => 'Color',
                'type' => 'text',
                'required' => false,
                'hidden' => true, // Don't show for computers
            ],
            'metric_value' => [
                'label' => 'Install Date',
                'type' => 'date',
                'required' => false,
            ],
        ],
    ],

    'appliance_repair' => [
        'category' => 'service_inventory',
        'name' => 'Appliance Repair',
        'icon' => 'washing-machine',
        'entity_name' => 'Appliance',
        'entity_name_plural' => 'Appliances',
        'fields' => [
            'identifier' => [
                'label' => 'Serial Number',
                'type' => 'text',
                'required' => true,
            ],
            'brand' => [
                'label' => 'Brand',
                'type' => 'text',
                'required' => true,
            ],
            'model' => [
                'label' => 'Model',
                'type' => 'text',
                'required' => true,
            ],
            'year' => [
                'label' => 'Manufacture Year',
                'type' => 'number',
                'required' => false,
            ],
            'secondary_id' => [
                'label' => 'Model Number',
                'type' => 'text',
                'required' => false,
            ],
            'variant' => [
                'label' => 'Appliance Type',
                'type' => 'select',
                'required' => true,
                'options' => [
                    'washer' => 'Washing Machine',
                    'dryer' => 'Dryer',
                    'refrigerator' => 'Refrigerator',
                    'dishwasher' => 'Dishwasher',
                    'oven' => 'Oven/Stove',
                    'microwave' => 'Microwave',
                    'ac' => 'Air Conditioner',
                    'other' => 'Other',
                ],
            ],
            'color' => [
                'label' => 'Color',
                'type' => 'text',
                'required' => false,
            ],
            'metric_value' => [
                'label' => 'Purchase Date',
                'type' => 'date',
                'required' => false,
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | INVENTORY ONLY BUSINESSES (No Service Tracking)
    |--------------------------------------------------------------------------
    */

    'auto_parts_store' => [
        'category' => 'inventory_only',
        'name' => 'Auto Parts Store',
        'icon' => 'package',
        'entity_name' => null, // No serviceable entities
        'description' => 'Sell auto parts without repair services',
    ],

    'electronics_store' => [
        'category' => 'inventory_only',
        'name' => 'Electronics Store',
        'icon' => 'tv',
        'entity_name' => null,
        'description' => 'Retail electronics without repair services',
    ],

    'general_retail' => [
        'category' => 'inventory_only',
        'name' => 'General Retail Store',
        'icon' => 'shopping-bag',
        'entity_name' => null,
        'description' => 'Any retail business selling products',
    ],

    'pharmacy' => [
        'category' => 'inventory_only',
        'name' => 'Pharmacy',
        'icon' => 'pill',
        'entity_name' => null,
        'description' => 'Pharmacy and medical supplies',
    ],

    'grocery_store' => [
        'category' => 'inventory_only',
        'name' => 'Grocery/Convenience Store',
        'icon' => 'shopping-cart',
        'entity_name' => null,
        'description' => 'Grocery and convenience items',
    ],

    'clothing_store' => [
        'category' => 'inventory_only',
        'name' => 'Clothing/Fashion Store',
        'icon' => 'shirt',
        'entity_name' => null,
        'description' => 'Fashion and apparel retail',
    ],

    'hardware_store' => [
        'category' => 'inventory_only',
        'name' => 'Hardware Store',
        'icon' => 'wrench',
        'entity_name' => null,
        'description' => 'Tools and hardware supplies',
    ],

    'wholesale' => [
        'category' => 'inventory_only',
        'name' => 'Wholesale Distributor',
        'icon' => 'truck',
        'entity_name' => null,
        'description' => 'B2B wholesale distribution',
    ],

];
```

---

## 🎨 UI/UX Adaptation Strategy

### Navigation Menu Adaptation

**SERVICE + INVENTORY Business Type**:
```
Dashboard
├── POS (Sales)
├── Service Records ✓
├── Vehicles/Devices ✓
├── Customers
├── Inventory
│   ├── Products
│   ├── Categories
│   ├── Warehouses
│   ├── Stock Movements
├── Suppliers
├── Expenses
└── Reports
```

**INVENTORY ONLY Business Type**:
```
Dashboard
├── POS (Sales)
├── Customers
├── Inventory
│   ├── Products
│   ├── Categories
│   ├── Warehouses
│   ├── Stock Movements
├── Suppliers
├── Expenses
└── Reports

❌ Service Records (HIDDEN)
❌ Vehicles/Devices (HIDDEN)
```

### Dynamic Labels

Use vertical configuration to change UI labels:

```tsx
// Instead of hardcoded:
<h1>Vehicles</h1>

// Use dynamic:
<h1>{config.entity_name_plural}</h1>
// Output: "Devices" for mobile repair
// Output: "Equipment" for IT services
// Output: "Appliances" for appliance repair
```

---

## 🚀 Onboarding Flow

### Step 1: Business Type Selection

```
┌─────────────────────────────────────────────────┐
│  What type of business do you operate?          │
│                                                  │
│  ┌────────────────────┐  ┌──────────────────┐  │
│  │ 🔧 SERVICE +       │  │ 🏪 RETAIL/       │  │
│  │    INVENTORY       │  │    INVENTORY     │  │
│  │                    │  │    ONLY          │  │
│  │ I provide services │  │ I only sell      │  │
│  │ AND sell products  │  │ products         │  │
│  │                    │  │                  │  │
│  │ [Select]           │  │ [Select]         │  │
│  └────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Step 2a: Service + Inventory - Vertical Selection

```
┌─────────────────────────────────────────────────┐
│  What industry do you serve?                    │
│                                                  │
│  🚗 Auto Service & Repair                       │
│  📱 Mobile Phone Repair                         │
│  💻 Computer/IT Services                        │
│  🏠 Appliance Repair                            │
│  ❄️  HVAC Services                              │
│  🚲 Bicycle/Motorcycle Shop                     │
│  💍 Jewelry Repair                              │
│  ⚙️  Industrial Equipment Maintenance           │
│  🎸 Musical Instrument Repair                   │
│                                                  │
│  [Continue]                                      │
└─────────────────────────────────────────────────┘
```

### Step 2b: Inventory Only - Vertical Selection

```
┌─────────────────────────────────────────────────┐
│  What do you sell?                              │
│                                                  │
│  🔧 Auto Parts (no service)                     │
│  📺 Electronics Store                           │
│  👕 Clothing/Fashion                            │
│  🛒 Grocery/Convenience Store                   │
│  💊 Pharmacy                                    │
│  🔨 Hardware Store                              │
│  📚 Book Store                                  │
│  🚚 Wholesale Distributor                       │
│  🏪 General Retail                              │
│                                                  │
│  [Continue]                                      │
└─────────────────────────────────────────────────┘
```

### Step 3: Company Information

```
┌─────────────────────────────────────────────────┐
│  Company Details                                │
│                                                  │
│  Business Name: [____________________________]  │
│  Phone:         [____________________________]  │
│  Email:         [____________________________]  │
│  Address:       [____________________________]  │
│  Tax Number:    [____________________________]  │
│                                                  │
│  [Complete Setup]                               │
└─────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Checklist

### Phase 1: Database & Configuration
- [ ] Create `config/verticals.php` with all vertical definitions
- [ ] Add migration to add `business_type`, `vertical`, `entity_name`, `vertical_config` to `accounts` table
- [ ] Create migration to add abstract fields to `vehicles` table
- [ ] Write data migration script to copy existing data to new fields
- [ ] Test backward compatibility with existing data

### Phase 2: Backend Model Changes
- [ ] Rename `Vehicle` model to `ServiceableEntity` (keep table name)
- [ ] Update `ServiceableEntity` to use abstract field names
- [ ] Create `VerticalService` to load and cache vertical configs
- [ ] Update all controllers to use vertical-aware logic
- [ ] Add middleware to inject vertical config into requests
- [ ] Update API responses to include vertical metadata

### Phase 3: Onboarding Flow
- [ ] Create `OnboardingController` with business type selection
- [ ] Create React onboarding wizard component
- [ ] Build business type selection screen
- [ ] Build vertical selection screens (two variants)
- [ ] Store vertical selection in account record
- [ ] Send welcome email with vertical-specific guidance

### Phase 4: UI Adaptation
- [ ] Create `useVertical()` React hook to access config
- [ ] Create `<DynamicLabel>` component for entity names
- [ ] Create `<VerticalEntityForm>` component for dynamic forms
- [ ] Update navigation menu to hide service-related items for inventory-only
- [ ] Update all hardcoded "Vehicle" text to use dynamic labels
- [ ] Create dashboard widgets that adapt to business type

### Phase 5: Testing & Migration
- [ ] Test all verticals in development
- [ ] Create demo accounts for each vertical
- [ ] Test existing auto-service accounts (backward compatibility)
- [ ] Create migration guide for existing users
- [ ] Test inventory-only businesses (service menus hidden)

### Phase 6: Documentation & Launch
- [ ] Write user documentation for each vertical
- [ ] Create video tutorials for onboarding
- [ ] Build vertical-specific landing pages
- [ ] Update marketing materials
- [ ] Soft launch with beta testers from 3 different verticals

---

## 📝 Code Examples

### Backend: Vertical Service

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class VerticalService
{
    protected array $verticals;

    public function __construct()
    {
        $this->verticals = config('verticals');
    }

    public function getVertical(string $verticalKey): ?array
    {
        return $this->verticals[$verticalKey] ?? null;
    }

    public function getBusinessTypeVerticals(string $businessType): array
    {
        return array_filter($this->verticals, function($vertical) use ($businessType) {
            return $vertical['category'] === $businessType;
        });
    }

    public function getEntityName(string $verticalKey): ?string
    {
        return $this->verticals[$verticalKey]['entity_name'] ?? null;
    }

    public function getEntityNamePlural(string $verticalKey): ?string
    {
        return $this->verticals[$verticalKey]['entity_name_plural'] ?? null;
    }

    public function getFields(string $verticalKey): array
    {
        return $this->verticals[$verticalKey]['fields'] ?? [];
    }

    public function isServiceBusiness(string $verticalKey): bool
    {
        return ($this->verticals[$verticalKey]['category'] ?? '') === 'service_inventory';
    }
}
```

### Frontend: React Hook

```typescript
// hooks/useVertical.ts
import { usePage } from '@inertiajs/react';

export interface VerticalConfig {
    category: 'service_inventory' | 'inventory_only';
    name: string;
    icon: string;
    entity_name: string | null;
    entity_name_plural: string | null;
    fields: Record<string, any>;
}

export function useVertical() {
    const { auth } = usePage().props;
    const account = auth.user.account;

    const vertical = account.vertical || 'auto_service';
    const businessType = account.business_type || 'service_inventory';
    const config: VerticalConfig = account.vertical_config;

    const isServiceBusiness = businessType === 'service_inventory';
    const isInventoryOnly = businessType === 'inventory_only';

    const getEntityName = (plural = false) => {
        if (!config.entity_name) return null;
        return plural ? config.entity_name_plural : config.entity_name;
    };

    return {
        vertical,
        businessType,
        config,
        isServiceBusiness,
        isInventoryOnly,
        getEntityName,
    };
}
```

### Frontend: Dynamic Component

```tsx
// components/DynamicEntityForm.tsx
import { useVertical } from '@/hooks/useVertical';

export default function DynamicEntityForm({ entity, onSubmit }) {
    const { config, getEntityName } = useVertical();

    return (
        <form onSubmit={onSubmit}>
            <h2>Add New {getEntityName()}</h2>

            {Object.entries(config.fields).map(([key, field]) => {
                if (field.hidden) return null;

                return (
                    <div key={key}>
                        <label>{field.label}</label>
                        {field.type === 'select' ? (
                            <select name={key} required={field.required}>
                                {field.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type={field.type}
                                name={key}
                                placeholder={field.placeholder}
                                required={field.required}
                            />
                        )}
                    </div>
                );
            })}

            <button type="submit">Save {getEntityName()}</button>
        </form>
    );
}
```

---

## 🎯 Success Metrics

### Technical Metrics
- ✅ All existing auto-service accounts work without changes
- ✅ New accounts can select from 15+ verticals
- ✅ Inventory-only businesses never see service menus
- ✅ Entity forms render dynamically based on vertical
- ✅ No code duplication between verticals

### Business Metrics
- 📈 10x increase in addressable market
- 📈 Faster onboarding (< 5 minutes)
- 📈 Higher conversion rate (vertical-specific landing pages)
- 📈 Reduced support tickets (intuitive for each vertical)

---

## 🚨 Critical Considerations

### DO
✅ Test backward compatibility thoroughly
✅ Provide migration scripts for existing data
✅ Keep vertical configs simple and extensible
✅ Hide irrelevant features based on business type
✅ Use clear, industry-specific terminology

### DON'T
❌ Add vertical-specific code in core business logic
❌ Force service businesses to configure unnecessary fields
❌ Show auto-service terminology to other verticals
❌ Make inventory-only businesses see service menus
❌ Over-complicate vertical configurations

---

## 📚 AI Agent Instructions

When implementing features for this system:

1. **Always check vertical context**: Use `useVertical()` hook or `VerticalService` class
2. **Use dynamic labels**: Never hardcode "Vehicle", use `getEntityName()`
3. **Respect business type**: Check `isServiceBusiness` before showing service features
4. **Follow field mapping**: Use abstract field names (`identifier`, not `plate_number`)
5. **Extend via config**: Add new verticals in `config/verticals.php`, not in code
6. **Maintain backward compatibility**: Existing accounts must continue working

---

## 📞 Questions for Product Team

Before full implementation, clarify:

1. Should existing accounts be prompted to select a vertical, or default to "auto_service"?
2. Can accounts change their vertical after onboarding, or is it permanent?
3. Do we need multi-vertical support (one account, multiple business types)?
4. Should vertical selection be at Account level or Company level?
5. Do we need vertical-specific reporting templates?

---

**Document Version**: 1.0
**Last Updated**: 2025-10-13
**Author**: Architecture Team
**Status**: Ready for Implementation
