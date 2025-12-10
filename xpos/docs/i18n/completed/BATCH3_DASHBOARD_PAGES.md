# 📊 BATCH 3: Dashboard Pages Translation

**Priority:** 🟡 Medium
**Status:** ⏳ Not Started
**Estimated Time:** 2-3 hours
**Dependencies:** BATCH 1 & 2 must be completed first

---

## 🎯 Objective

Translate all dashboard-related pages and components that users see after logging in.

---

## 📋 Files to Translate

### Main Dashboard
1. `Pages/Dashboard.tsx` - Main dashboard container
2. `Pages/Dashboard/AccountOwnerDashboard.tsx`
3. `Pages/Dashboard/BranchManagerDashboard.tsx`
4. `Pages/Dashboard/CashierDashboard.tsx`
5. `Pages/Dashboard/AccountantDashboard.tsx`
6. `Pages/Dashboard/SalesStaffDashboard.tsx`
7. `Pages/Dashboard/TailorDashboard.tsx`
8. `Pages/Dashboard/WarehouseManagerDashboard.tsx`

### Dashboard Components
9. `Components/KPICard.tsx`
10. `Components/FinancialSummary.tsx`
11. `Components/RecentSales.tsx`
12. `Components/TopProducts.tsx`
13. `Components/LowStock.tsx`
14. `Components/SalesChart.tsx`

---

## 🔑 Common Translation Keys Needed

Add to `resources/js/i18n/locales/en/dashboard.json`:

```json
{
  "title": "Dashboard",
  "welcome": "Welcome",
  "overview": "Overview",
  "kpi": {
    "total_sales": "Total Sales",
    "total_revenue": "Total Revenue",
    "total_orders": "Total Orders",
    "total_customers": "Total Customers",
    "total_products": "Total Products",
    "low_stock_items": "Low Stock Items",
    "pending_orders": "Pending Orders",
    "this_month": "This Month",
    "today": "Today",
    "this_week": "This Week",
    "vs_last_month": "vs Last Month",
    "increase": "Increase",
    "decrease": "Decrease"
  },
  "financial": {
    "title": "Financial Summary",
    "revenue": "Revenue",
    "expenses": "Expenses",
    "profit": "Profit",
    "cash": "Cash",
    "card": "Card",
    "bank_transfer": "Bank Transfer"
  },
  "recent_sales": {
    "title": "Recent Sales",
    "view_all": "View All",
    "no_sales": "No recent sales",
    "sale_number": "Sale #",
    "customer": "Customer",
    "amount": "Amount",
    "date": "Date"
  },
  "top_products": {
    "title": "Top Products",
    "product_name": "Product",
    "quantity_sold": "Quantity Sold",
    "revenue": "Revenue",
    "no_data": "No product data available"
  },
  "low_stock": {
    "title": "Low Stock Alert",
    "product": "Product",
    "current_stock": "Current Stock",
    "min_stock": "Min Stock",
    "action_needed": "Action Needed",
    "no_alerts": "No low stock alerts"
  },
  "sales_chart": {
    "title": "Sales Trend",
    "daily": "Daily",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "revenue": "Revenue",
    "orders": "Orders"
  }
}
```

And Azerbaijani in `az/dashboard.json`:

```json
{
  "title": "İdarə Paneli",
  "welcome": "Xoş gəlmisiniz",
  "overview": "Ümumi Baxış",
  "kpi": {
    "total_sales": "Ümumi Satış",
    "total_revenue": "Ümumi Gəlir",
    "total_orders": "Ümumi Sifarişlər",
    "total_customers": "Ümumi Müştərilər",
    "total_products": "Ümumi Məhsullar",
    "low_stock_items": "Az Stoklu Məhsullar",
    "pending_orders": "Gözləyən Sifarişlər",
    "this_month": "Bu Ay",
    "today": "Bu Gün",
    "this_week": "Bu Həftə",
    "vs_last_month": "Keçən Ayla Müqayisə",
    "increase": "Artım",
    "decrease": "Azalma"
  },
  // ... rest of translations
}
```

---

## 🔧 Implementation Pattern

### 1. Dashboard.tsx

```typescript
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t } = useTranslation('dashboard');

    return (
        <AuthenticatedLayout header={
            <h2>{t('title')}</h2>
        }>
            <div>
                <h1>{t('welcome')}</h1>
                {/* Rest of dashboard */}
            </div>
        </AuthenticatedLayout>
    );
}
```

### 2. KPICard.tsx

```typescript
import { useTranslation } from 'react-i18next';

export default function KPICard({ title, value, trend }) {
    const { t } = useTranslation('dashboard');

    return (
        <div className="kpi-card">
            <h3>{t(`kpi.${title}`)}</h3>
            <p>{value}</p>
            <span>
                {trend > 0 ? t('kpi.increase') : t('kpi.decrease')}
            </span>
        </div>
    );
}
```

---

## 🧪 Testing

1. Navigate to `/dashboard`
2. Log in as different roles:
   - Account Owner
   - Branch Manager
   - Cashier
   - Sales Staff
3. Switch languages and verify:
   - Page title
   - KPI cards
   - Charts
   - Recent sales widget
   - Top products widget
   - Low stock alerts

---

## ✅ Completion Checklist

- [ ] All 14 dashboard files translated
- [ ] Translation keys added to `dashboard.json` (EN & AZ)
- [ ] Tested with multiple user roles
- [ ] Language switching works on dashboard
- [ ] No console errors
- [ ] Updated PROGRESS_TRACKER.md

---

**Next:** BATCH 4: POS & Sales Pages
