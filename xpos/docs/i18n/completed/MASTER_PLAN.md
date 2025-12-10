# 🌍 Frontend i18n Implementation - Master Plan

**Status:** In Progress
**Last Updated:** 2025-12-09
**Goal:** Make the entire frontend UI translatable between English and Azerbaijani

---

## 📊 Current Status

### ✅ What's Already Working
- ✅ Backend enum translations (payment methods, expense types, etc.)
- ✅ Language switcher component
- ✅ User language preference storage
- ✅ SetLocale middleware
- ✅ Translation infrastructure (react-i18next)
- ✅ Translation files structure (`/resources/js/i18n/locales/{en,az}/`)

### ❌ What's NOT Working
- ❌ Navigation menu (hardcoded in Azerbaijani)
- ❌ Page titles and headers
- ❌ Buttons, labels, and form fields
- ❌ Error messages
- ❌ Table headers and content
- ❌ Modals and dialogs
- ❌ Toast notifications

---

## 🎯 Implementation Strategy

We'll implement translations in **7 batches**, each focusing on a specific area of the application.

### Batch Priority Order
1. **BATCH 1:** Navigation Menu (AuthenticatedLayout) - **HIGH PRIORITY**
2. **BATCH 2:** Common Components (Buttons, Forms, Modals)
3. **BATCH 3:** Dashboard Pages
4. **BATCH 4:** POS & Sales Pages
5. **BATCH 5:** Inventory & Warehouse Pages
6. **BATCH 6:** Financial & Reports Pages
7. **BATCH 7:** Settings & Configuration Pages

---

## 📦 Batch Breakdown

| Batch | Area | Files | Priority | Est. Time |
|-------|------|-------|----------|-----------|
| 1 | Navigation Menu | AuthenticatedLayout.tsx | 🔴 Critical | 2-3 hours |
| 2 | Common Components | ~30 components | 🟠 High | 3-4 hours |
| 3 | Dashboard | ~10 pages | 🟡 Medium | 2-3 hours |
| 4 | POS & Sales | ~15 pages | 🟡 Medium | 3-4 hours |
| 5 | Inventory | ~20 pages | 🟢 Normal | 3-4 hours |
| 6 | Financial | ~15 pages | 🟢 Normal | 2-3 hours |
| 7 | Settings | ~20 pages | 🟢 Normal | 3-4 hours |

**Total Estimated Time:** 18-25 hours

---

## 🛠️ Standard Pattern

Every component that needs translation will follow this pattern:

### 1. Add Import
```typescript
import { useTranslation } from 'react-i18next';
```

### 2. Add Hook
```typescript
const { t } = useTranslation();
```

### 3. Replace Strings
```typescript
// Before
<button>Yadda saxla</button>

// After
<button>{t('common:actions.save')}</button>
```

### 4. For Namespace-Specific Translations
```typescript
const { t } = useTranslation('products'); // Use 'products' namespace
<h1>{t('title')}</h1> // Translates 'products:title'
```

---

## 📝 Translation File Structure

```
resources/js/i18n/locales/
├── en/
│   ├── common.json      # Shared: buttons, labels, actions
│   ├── products.json    # Product-related translations
│   ├── sales.json       # Sales-related translations
│   ├── customers.json   # Customer-related translations
│   ├── inventory.json   # Inventory-related translations
│   ├── dashboard.json   # Dashboard-related translations
│   ├── expenses.json    # Financial translations
│   ├── reports.json     # Reports translations
│   ├── suppliers.json   # Supplier translations
│   └── settings.json    # Settings translations
└── az/
    └── (same structure)
```

---

## 🚀 How to Execute Each Batch

### For Agents:
1. Read the batch-specific document (e.g., `BATCH1_NAVIGATION_MENU.md`)
2. Follow the step-by-step instructions
3. Run the build after changes: `npm run build`
4. Test language switching
5. Update the progress tracker
6. Move to next batch

### For Each File:
1. ✅ Add `useTranslation()` hook
2. ✅ Replace ALL hardcoded strings with `t('key')`
3. ✅ Verify translation keys exist in JSON files
4. ✅ Test both EN and AZ languages
5. ✅ Mark as completed in tracker

---

## 🧪 Testing Checklist

After implementing translations in a component:

- [ ] Component imports `useTranslation` hook
- [ ] All visible text uses `t()` function
- [ ] No hardcoded Azerbaijani or English strings remain
- [ ] `npm run build` completes without errors
- [ ] Switch to AZ → Text shows in Azerbaijani
- [ ] Switch to EN → Text shows in English
- [ ] No console errors in browser
- [ ] No missing translation warnings

---

## 📋 Progress Tracking

Track progress in `docs/i18n/PROGRESS_TRACKER.md`:

```markdown
## BATCH 1: Navigation Menu
- [x] AuthenticatedLayout.tsx
- Status: ✅ Completed on 2025-12-09

## BATCH 2: Common Components
- [ ] Button.tsx
- [ ] Modal.tsx
- ...
- Status: 🚧 In Progress
```

---

## 🎯 Success Criteria

The implementation is complete when:

1. ✅ All UI text responds to language switching
2. ✅ No hardcoded strings in components
3. ✅ All translation keys exist in both EN and AZ
4. ✅ Language switch triggers full UI update
5. ✅ User preference persists across sessions
6. ✅ All pages tested in both languages

---

## 📚 Additional Resources

- **Translation Pattern Guide:** `HARDCODED_STRINGS_FIX_GUIDE.md`
- **Quick Reference:** `QUICK_FIX_CHEATSHEET.md`
- **Batch Instructions:**
  - `BATCH1_NAVIGATION_MENU.md`
  - `BATCH2_COMMON_COMPONENTS.md`
  - `BATCH3_DASHBOARD_PAGES.md`
  - `BATCH4_POS_PAGES.md`
  - `BATCH5_INVENTORY_PAGES.md`
  - `BATCH6_FINANCIAL_PAGES.md`
  - `BATCH7_SETTINGS_PAGES.md`
- **Testing Guide:** `TESTING_CHECKLIST.md`

---

## 🚦 Getting Started

**Agents should start with BATCH 1:**

```bash
# Read the batch document
cat docs/i18n/BATCH1_NAVIGATION_MENU.md

# Follow the instructions
# Make the changes
# Build and test
npm run build
```

**Then proceed to subsequent batches in order.**

---

## 💡 Tips for Agents

1. **Work in batches** - Don't try to do everything at once
2. **Test frequently** - Build and test after each file
3. **Use consistent keys** - Follow the naming convention in existing JSON files
4. **Check for duplicates** - Reuse existing translation keys when possible
5. **Update progress** - Mark completed files in the tracker
6. **Report blockers** - Document any issues or missing translations

---

**Next Step:** Start with `BATCH1_NAVIGATION_MENU.md`
