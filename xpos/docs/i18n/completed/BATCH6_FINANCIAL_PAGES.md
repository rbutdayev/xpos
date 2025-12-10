# 💰 BATCH 6: Financial & Reports Pages Translation

**Priority:** 🟢 Normal
**Status:** ⏳ Not Started
**Estimated Time:** 2-3 hours

---

## 📋 Files to Translate (15 files)

### Expenses
1. `Pages/Expenses/Index.tsx`
2. `Pages/Expenses/Create.tsx`
3. `Pages/Expenses/Edit.tsx`
4. `Pages/Expenses/Show.tsx`

### Employee Salaries
5. `Pages/EmployeeSalaries/*`

### Supplier Payments
6. `Pages/SupplierPayments/Index.tsx`
7. `Pages/SupplierPayments/Create.tsx`
8. `Pages/SupplierPayments/Edit.tsx`
9. `Pages/SupplierPayments/Show.tsx`

### Reports
10. `Pages/Reports/Index.tsx`
11. `Pages/Reports/View.tsx`
12. `Pages/Reports/Components/*`

---

## 🔑 Translation Keys

Add to `resources/js/i18n/locales/en/expenses.json`:

```json
{
  "title": "Expenses",
  "add_expense": "Add Expense",
  "expense_type": "Expense Type",
  "amount": "Amount",
  "date": "Date",
  "description": "Description",
  "payment_method": "Payment Method",
  "category": "Category",
  "receipt": "Receipt",
  "total_expenses": "Total Expenses"
}
```

Add to `resources/js/i18n/locales/en/reports.json`:

```json
{
  "title": "Reports",
  "report_center": "Report Center",
  "sales_report": "Sales Report",
  "inventory_report": "Inventory Report",
  "financial_report": "Financial Report",
  "customer_report": "Customer Report",
  "generate_report": "Generate Report",
  "date_range": "Date Range",
  "export_pdf": "Export PDF",
  "export_excel": "Export Excel",
  "summary": "Summary",
  "details": "Details"
}
```

---

## ✅ Completion Checklist

- [ ] All 15 financial files translated
- [ ] Expense types use backend enums (already handled)
- [ ] Payment methods use backend enums (already handled)
- [ ] Reports generate correctly in both languages
- [ ] Updated PROGRESS_TRACKER.md

**Next:** BATCH 7: Settings & Configuration Pages
