# 🤖 Agent Execution Guide - i18n Implementation

**Quick Start Guide for AI Agents**

---

## 🎯 Mission

Implement full internationalization (i18n) support across the entire XPOS frontend, enabling users to switch between English and Azerbaijani languages seamlessly.

---

## 📚 Documentation Structure

```
docs/i18n/
├── MASTER_PLAN.md              ← Start here! Overview & strategy
├── AGENT_EXECUTION_GUIDE.md    ← You are here
├── BATCH1_NAVIGATION_MENU.md   ← Execute first
├── BATCH2_COMMON_COMPONENTS.md
├── BATCH3_DASHBOARD_PAGES.md
├── BATCH4_POS_PAGES.md
├── BATCH5_INVENTORY_PAGES.md
├── BATCH6_FINANCIAL_PAGES.md
├── BATCH7_SETTINGS_PAGES.md
├── TESTING_CHECKLIST.md        ← Final validation
└── PROGRESS_TRACKER.md         ← Track your progress
```

---

## 🚀 Quick Start for Agents

### Step 1: Read the Master Plan
```bash
cat docs/i18n/MASTER_PLAN.md
```

**Key takeaways:**
- Current status: Backend enums work, frontend doesn't
- Goal: Translate all UI components
- Strategy: 7 batches, in order
- Pattern: Add `useTranslation()` hook, replace strings with `t()`

---

### Step 2: Start with BATCH 1
```bash
cat docs/i18n/BATCH1_NAVIGATION_MENU.md
```

**Action items:**
1. Open `resources/js/Layouts/AuthenticatedLayout.tsx`
2. Add `import { useTranslation } from 'react-i18next';`
3. Add `const { t } = useTranslation(['common', 'navigation']);`
4. Replace all `name: 'Azerbaijani String'` with `name: t('common:navigation.key')`
5. Build: `npm run build`
6. Test language switching

---

### Step 3: Verify Translation Keys

Before replacing strings, ensure keys exist in:
- `resources/js/i18n/locales/en/common.json`
- `resources/js/i18n/locales/az/common.json`

**If missing, add them:**
```json
{
  "navigation": {
    "products": "Products",
    "dashboard": "Dashboard"
  }
}
```

---

### Step 4: Test Your Changes

```bash
npm run build
```

Then in browser:
1. Switch to English → Check text
2. Switch to Azerbaijani → Check text
3. Verify no console errors
4. Check for "missing translation" warnings

---

### Step 5: Update Progress Tracker

Edit `docs/i18n/PROGRESS_TRACKER.md`:

```markdown
## BATCH 1: Navigation Menu
- [x] AuthenticatedLayout.tsx ✅ Completed 2025-12-09
Status: ✅ Complete
```

---

### Step 6: Move to Next Batch

Repeat steps 2-5 for:
- BATCH 2: Common Components
- BATCH 3: Dashboard Pages
- BATCH 4: POS Pages
- BATCH 5: Inventory Pages
- BATCH 6: Financial Pages
- BATCH 7: Settings Pages

---

## 📋 Standard Pattern (Copy-Paste Template)

For every component/page:

```typescript
// 1. Add import at top
import { useTranslation } from 'react-i18next';

// 2. Add hook inside component
export default function ComponentName() {
    const { t } = useTranslation('namespace'); // common, sales, products, etc.

    // 3. Replace strings
    return (
        <div>
            {/* OLD: <h1>Məhsullar</h1> */}
            <h1>{t('title')}</h1>

            {/* OLD: <button>Yadda saxla</button> */}
            <button>{t('actions.save')}</button>
        </div>
    );
}
```

---

## 🎯 Batch Priorities

Execute in this order:

| # | Batch | Priority | Why |
|---|-------|----------|-----|
| 1 | Navigation | 🔴 Critical | Most visible, affects every page |
| 2 | Components | 🟠 High | Reused everywhere |
| 3 | Dashboard | 🟡 Medium | First page users see |
| 4 | POS | 🟡 Medium | Core business function |
| 5 | Inventory | 🟢 Normal | Important but less urgent |
| 6 | Financial | 🟢 Normal | Backend already translated |
| 7 | Settings | 🟢 Normal | Least frequently used |

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find name 't'"
**Fix:** Add `const { t } = useTranslation();` inside component

### Issue: Text shows as "common:navigation.products"
**Fix:** Missing translation key. Add to JSON files.

### Issue: Build fails with TypeScript errors
**Fix:** Check import syntax. Should be:
```typescript
import { useTranslation } from 'react-i18next';
```

### Issue: Translations don't update on language switch
**Fix:** Already fixed! LanguageSwitcher now uses `window.location.reload()`

---

## ✅ Definition of Done (for each batch)

A batch is complete when:
- [ ] All files in batch have been modified
- [ ] All translation keys exist in EN and AZ JSON files
- [ ] `npm run build` completes successfully
- [ ] Tested language switching (EN ↔ AZ)
- [ ] No console errors or warnings
- [ ] Progress tracker updated

---

## 🧪 Quick Test Commands

```bash
# Build frontend
npm run build

# Find remaining hardcoded strings (example)
grep -rn "Məhsullar\|Xidmətlər" resources/js/Pages

# Check for missing imports
grep -L "useTranslation" resources/js/Pages/Products/*.tsx
```

---

## 📊 Progress Tracking

Always update `PROGRESS_TRACKER.md` after completing files:

```markdown
## Current Status: BATCH 2 - In Progress

### Completed Batches:
- ✅ BATCH 1: Navigation Menu (1/1 files)

### In Progress:
- 🚧 BATCH 2: Common Components (5/20 files)
  - [x] Pagination.tsx
  - [x] DataTable.tsx
  - [ ] Modal.tsx
  - [ ] ...

### Remaining:
- ⏳ BATCH 3-7: Not started
```

---

## 🎉 Final Validation

When all batches complete, run through `TESTING_CHECKLIST.md`:
- Test all pages in both languages
- Test all workflows
- Check all components
- Verify no broken translations

---

## 💡 Pro Tips for Agents

1. **Work in small increments** - Complete one file, test, commit
2. **Reuse existing keys** - Check JSON files before adding new keys
3. **Follow the pattern** - Every file should look similar
4. **Test frequently** - Don't wait until the end
5. **Document blockers** - If stuck, note it and move on
6. **Update progress** - Keep tracker current
7. **Ask questions** - If unclear, document and ask user

---

## 📞 Getting Help

If you encounter issues:
1. Check the specific BATCH document for detailed instructions
2. Review `MASTER_PLAN.md` for patterns and examples
3. Check `QUICK_FIX_CHEATSHEET.md` for common patterns
4. Look at completed files for reference
5. Document the issue in progress tracker

---

## 🎯 Success Metrics

Implementation is successful when:
- ✅ 100% of UI text responds to language switching
- ✅ No hardcoded Azerbaijani or English strings remain
- ✅ User can work entirely in English or Azerbaijani
- ✅ Language preference persists across sessions
- ✅ No translation errors in console
- ✅ All workflows tested and working

---

## 🚦 Current Status

**Overall Progress:** 0% (0/7 batches complete)

**Next Action:** Start with `BATCH1_NAVIGATION_MENU.md`

---

**Good luck! 🚀**
