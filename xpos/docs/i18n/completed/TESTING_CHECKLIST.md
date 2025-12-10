# ✅ i18n Implementation - Testing Checklist

**Use this checklist to validate that translations are working correctly across the entire application.**

---

## 🎯 Pre-Testing Setup

Before starting tests:

- [ ] All 7 batches have been completed
- [ ] `npm run build` completes without errors
- [ ] No TypeScript compilation errors
- [ ] Browser console shows no JavaScript errors on page load

---

## 🧪 Core Functionality Tests

### 1. Language Switcher
- [ ] Language switcher appears in top navigation
- [ ] Shows current language (flag + name)
- [ ] Dropdown shows both languages (EN & AZ)
- [ ] Click English → Page reloads in English
- [ ] Click Azerbaijani → Page reloads in Azerbaijani
- [ ] Language preference persists after logout/login
- [ ] No error messages during language switch

### 2. Navigation Menu
- [ ] All main menu items translate
- [ ] All submenu items translate
- [ ] Menu expands/collapses correctly
- [ ] No broken translations ("common:navigation.xyz")
- [ ] Icons remain correct
- [ ] Menu tooltips (if any) translate

---

## 📄 Page-by-Page Testing

### Dashboard
- [ ] Dashboard title
- [ ] KPI card labels (Total Sales, Revenue, etc.)
- [ ] Chart labels and legends
- [ ] Widget titles (Recent Sales, Top Products, etc.)
- [ ] "No data" messages

### POS
- [ ] POS page title
- [ ] Cart labels (Total, Subtotal, Tax, Discount)
- [ ] Buttons (Complete Sale, Clear Cart, Add Customer)
- [ ] Search placeholder text
- [ ] Payment method buttons (from backend enums)
- [ ] Empty cart message
- [ ] Success/error toast messages

### Products
- [ ] Product list page title and headers
- [ ] Table column headers
- [ ] Action buttons (Add, Edit, Delete, View)
- [ ] Search placeholder
- [ ] Filter labels
- [ ] Product form labels (Name, SKU, Price, etc.)
- [ ] Validation error messages
- [ ] Success messages

### Sales
- [ ] Sales list page
- [ ] Sale details page
- [ ] Return modal
- [ ] Payment status labels (from backend enums)
- [ ] Sale status labels (from backend enums)

### Inventory
- [ ] Inventory dashboard
- [ ] Warehouse selector
- [ ] Stock level indicators
- [ ] Goods receipt forms
- [ ] Stock movement labels

### Customers
- [ ] Customer list
- [ ] Customer form
- [ ] Customer details

### Suppliers
- [ ] Supplier list
- [ ] Supplier form
- [ ] Supplier payments

### Expenses
- [ ] Expense list
- [ ] Expense form
- [ ] Expense type labels (from backend enums)
- [ ] Payment method labels (from backend enums)

### Reports
- [ ] Report center
- [ ] Report types
- [ ] Date range labels
- [ ] Export buttons

### Settings
- [ ] Settings page title
- [ ] Company settings form
- [ ] User management
- [ ] Warehouse settings
- [ ] Printer configuration
- [ ] Integration settings

### Profile
- [ ] Profile page
- [ ] Edit profile form
- [ ] Change password form
- [ ] Form validation messages

---

## 🔍 Component Testing

### Common Components
- [ ] Pagination (Next, Previous, Page X of Y)
- [ ] Data tables (No data, Loading, Search)
- [ ] Modals (Close, Confirm, Cancel buttons)
- [ ] Buttons (Save, Update, Delete, etc.)
- [ ] Form inputs (placeholders, labels, errors)
- [ ] Status badges
- [ ] Dropdowns and selects

### Notifications
- [ ] Success toast messages
- [ ] Error toast messages
- [ ] Warning messages
- [ ] Confirmation dialogs

---

## 🌐 Backend Enum Translations

These should already work from previous implementation:

- [ ] Payment methods (Cash, Card, Bank Transfer)
  - In sales forms
  - In expense forms
  - In payment sections
- [ ] Expense types
- [ ] Subscription plans
- [ ] User roles
- [ ] Sale statuses

---

## 🔄 User Workflow Tests

Test complete workflows in both languages:

### Workflow 1: Complete a Sale
1. [ ] Navigate to POS
2. [ ] Search and add products
3. [ ] Select customer
4. [ ] Apply discount
5. [ ] Select payment method
6. [ ] Complete sale
7. [ ] View receipt/print
- Verify ALL text appears in selected language

### Workflow 2: Create a Product
1. [ ] Navigate to Products
2. [ ] Click "Add Product"
3. [ ] Fill form
4. [ ] Upload image
5. [ ] Save product
6. [ ] View product details
- Verify ALL text appears in selected language

### Workflow 3: Generate Report
1. [ ] Navigate to Reports
2. [ ] Select report type
3. [ ] Choose date range
4. [ ] Generate report
5. [ ] View report
6. [ ] Export to PDF
- Verify report content is in selected language

### Workflow 4: Manage User
1. [ ] Navigate to Settings > Users
2. [ ] Add new user
3. [ ] Assign role
4. [ ] Save user
5. [ ] Edit user
6. [ ] View user details
- Verify all labels and messages translate

---

## 📱 Responsive Testing

Test language switching on:

- [ ] Desktop (1920x1080)
- [ ] Tablet (768px width)
- [ ] Mobile (375px width)

Verify:
- [ ] Language switcher accessible
- [ ] Navigation menu translates
- [ ] Forms remain usable
- [ ] Tables remain readable

---

## 🚨 Error Handling

Test error scenarios:

- [ ] Form validation errors display in correct language
- [ ] 404 page (if customized) displays in correct language
- [ ] Network error messages translate
- [ ] Permission denied messages translate
- [ ] Session expired message translates

---

## 🎨 Visual Regression

Check for layout issues:

- [ ] No text overflow in buttons
- [ ] No truncated labels
- [ ] Dropdowns fit content in both languages
- [ ] Tables adjust to text length
- [ ] Modals remain centered
- [ ] No broken layouts due to text length differences

---

## 🔧 Browser Testing

Test in multiple browsers:

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on Mac)

---

## 📝 Console Checks

In browser console, verify:

- [ ] No "Missing translation" warnings
- [ ] No JavaScript errors
- [ ] No 404 errors for translation files
- [ ] No React warnings about keys or rendering

---

## 🐛 Known Issues

Document any issues found:

| Issue | Page/Component | Severity | Status |
|-------|----------------|----------|--------|
| Example: "Logout" button not translating | Profile page | Medium | Fixed |
|  |  |  |  |

---

## ✅ Sign-Off Checklist

Before marking i18n implementation as complete:

- [ ] All 7 batches completed
- [ ] All pages tested in both languages
- [ ] All workflows tested
- [ ] No critical bugs
- [ ] Performance acceptable (no lag when switching)
- [ ] Documentation updated
- [ ] Team trained on translation system
- [ ] Translation keys documented

---

## 🎉 Completion

When all checks pass:

1. Update `MASTER_PLAN.md` status to ✅ COMPLETE
2. Update `PROGRESS_TRACKER.md` with final statistics
3. Create summary report
4. Notify stakeholders
5. Close related tickets/issues

---

## 📞 Support

If issues are found:
1. Document in "Known Issues" section
2. Create bug ticket with reproduction steps
3. Assign priority (Critical/High/Medium/Low)
4. Fix and retest

---

**Testing completed on:** _______________
**Tested by:** _______________
**Status:** ⏳ Not Started / 🚧 In Progress / ✅ Complete
