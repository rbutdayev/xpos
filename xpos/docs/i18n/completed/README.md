# XPOS Internationalization Documentation

## Overview

This directory contains comprehensive documentation for implementing internationalization (i18n) and multi-currency support in XPOS.

**Current Status:** Azerbaijan-only system → **Target:** International-ready platform

**Languages:** English (default) + Azerbaijani
**Currencies:** 13 supported (USD, EUR, GBP, AZN, TRY, RUB, JPY, CNY, INR, SAR, AED, CAD, AUD)

---

## Documentation Structure

### 📄 Core Documentation Files

1. **[01-DATABASE-CHANGES.md](./01-DATABASE-CHANGES.md)**
   - Database schema changes required
   - Enum migration from Azerbaijani to English
   - Currency support tables
   - Language preference columns
   - Migration files specification
   - **Read First:** Understanding database changes

2. **[02-TRANSLATION-SETUP.md](./02-TRANSLATION-SETUP.md)**
   - Backend translation infrastructure (Laravel)
   - Frontend translation infrastructure (React + i18next)
   - Translation file structure
   - SetLocale middleware
   - TranslationService implementation
   - i18next configuration
   - **Read Second:** Understanding translation system

3. **[03-CURRENCY-SUPPORT.md](./03-CURRENCY-SUPPORT.md)**
   - Multi-currency implementation
   - CurrencyHelper and CurrencyService
   - Frontend currency formatting
   - Currency selection in onboarding/settings
   - No exchange rate conversion (each account = 1 currency)
   - **Read Third:** Understanding currency system

4. **[04-IMPLEMENTATION-PLAN.md](./04-IMPLEMENTATION-PLAN.md)**
   - Complete step-by-step execution plan
   - 9 phases breakdown
   - Timeline estimates (60-80 hours)
   - Risk management
   - Success criteria
   - Rollback plan
   - **Read for Execution:** Your implementation roadmap

5. **[SUBAGENT-PROMPTS.md](./SUBAGENT-PROMPTS.md)**
   - 9 ready-to-use prompts for delegating work
   - Each prompt is self-contained
   - Use with Task tool for parallel execution
   - Includes all context and requirements
   - **Read for Delegation:** How to use subagents

---

## Quick Start Guide

### For Reviewers (Understand the Plan)

```bash
# Read in this order:
1. This README (you are here)
2. 04-IMPLEMENTATION-PLAN.md (overview)
3. 01-DATABASE-CHANGES.md (database impacts)
4. 02-TRANSLATION-SETUP.md (technical implementation)
5. 03-CURRENCY-SUPPORT.md (currency features)
```

### For Implementers (Execute the Plan)

```bash
# Option 1: Manual Implementation
1. Read 04-IMPLEMENTATION-PLAN.md
2. Follow Phase 1-9 sequentially
3. Use other docs as reference

# Option 2: Using Subagents
1. Read SUBAGENT-PROMPTS.md
2. Copy Prompt 1 to Task tool
3. Execute prompts 1-9 in sequence (or parallel where possible)
4. Review and test each phase output
```

---

## Key Decisions Made

### ✅ Confirmed Decisions

1. **Database Enum Migration:**
   - Migrate from Azerbaijani to English (`'nağd'` → `'cash'`)
   - Safe because test data only

2. **Default Language:**
   - New accounts: English
   - Existing accounts: Keep Azerbaijani
   - User can override at profile level

3. **Default Currency:**
   - New accounts: USD
   - Existing accounts: Migrate to AZN
   - Can change in settings

4. **Language Preference Priority:**
   - 1st: User's language setting
   - 2nd: Account's default language
   - 3rd: Company's default language
   - 4th: Fallback to English

5. **Currency Model:**
   - Each company operates in ONE currency
   - No exchange rate conversion needed
   - Can add later if requested

6. **Fiscal Printer:**
   - Remains Azerbaijan-specific
   - Not translated
   - Disabled for non-Azerbaijan accounts

### ⚠️ Pending Decisions

1. **Translation Review:**
   - Who will review Azerbaijani translation quality?
   - Recommendation: Native speaker review

2. **Performance Threshold:**
   - What's acceptable performance impact?
   - Recommendation: <100ms page load increase

3. **Deployment Strategy:**
   - Big bang or gradual rollout?
   - Recommendation: Gradual with feature flag

---

## Project Metrics

### Scope
| Metric | Count |
|--------|-------|
| Migration Files | 7 |
| Backend Translation Files | 14 (7 en + 7 az) |
| Frontend Translation Files | 16 (8 en + 8 az) |
| Components to Update | ~100 |
| Hardcoded Strings | ~478 |
| PHP Enum Classes | 3 |
| Supported Currencies | 13 |

### Effort Estimate
| Phase | Hours | Days |
|-------|-------|------|
| Database Migration | 12-16 | 1.5-2 |
| Backend i18n | 8-12 | 1-1.5 |
| Frontend i18n Setup | 8-12 | 1-1.5 |
| Component Translation Batch 1 | 20-25 | 2.5-3 |
| Component Translation Batch 2 | 15-20 | 2-2.5 |
| Shared Components | 10-12 | 1.5-2 |
| Currency Support | 8-10 | 1-1.5 |
| Language Switching UI | 4-6 | 0.5-1 |
| Testing & QA | 10-12 | 1.5-2 |
| **TOTAL** | **60-80** | **8-10** |

### Risk Assessment
| Risk Level | Count | Mitigation Status |
|-----------|-------|-------------------|
| High | 2 | Mitigated (test data only) |
| Medium | 3 | Planned mitigation |
| Low | 3 | Acceptable |

---

## Implementation Approaches

### Sequential (Conservative) - 10 days
```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
```
- **Pros:** Safest, easiest to manage
- **Cons:** Longest duration
- **Resource:** 1 developer

### Parallel (Aggressive) - 5-6 days
```
Phase 1 → Phase 2 → Phase 3
                      ↓
        Phase 4 + Phase 5 + Phase 6 + Phase 7 + Phase 8
                      ↓
                   Phase 9
```
- **Pros:** Fastest completion
- **Cons:** Requires coordination, 3 developers
- **Resource:** 3 developers

### Hybrid (Recommended) - 7-8 days
```
Phase 1 → Phase 2 → Phase 3
                      ↓
                Phase 4 + Phase 5
                      ↓
                   Phase 6
                      ↓
                Phase 7 + Phase 8
                      ↓
                   Phase 9
```
- **Pros:** Balanced speed and risk
- **Cons:** Requires 2 developers
- **Resource:** 2 developers

---

## Testing Strategy

### Automated Tests
- Backend: PHPUnit tests for translation service, currency helper
- Frontend: Jest tests for translation hooks, currency utilities
- Integration: Test language switching end-to-end

### Manual Tests
- Visual inspection: All pages in both languages
- Currency: Test with 3+ different currencies
- Performance: Page load time measurement
- Accessibility: Screen reader testing

### Test Coverage Goals
- Backend: >80% coverage
- Frontend: >70% coverage
- Critical paths: 100% coverage

---

## Success Metrics

### Technical Metrics
- ✅ 0 hardcoded Azerbaijani strings in core modules
- ✅ All enums translated
- ✅ Language switch < 500ms
- ✅ Build size increase < 200KB
- ✅ Page load impact < 100ms

### Business Metrics
- ✅ Support English-speaking customers
- ✅ Support 13 currencies
- ✅ Reduce onboarding friction for international users
- ✅ Enable international expansion

---

## Rollback Plan

### Scenario 1: Critical Production Bug
```bash
git revert [i18n-merge-commit]
php artisan migrate:rollback --step=7
php artisan cache:clear
deploy
```

### Scenario 2: Performance Issues
- Disable language switching
- Fallback to English only
- Optimize bundle size
- Re-enable gradually

### Scenario 3: Translation Quality Issues
- Keep system running
- Fix translations incrementally
- No rollback needed

---

## Frequently Asked Questions

### Q1: Will existing Azerbaijani customers be affected?
**A:** No. Existing accounts will default to Azerbaijani language. They can optionally switch to English.

### Q2: Do we need exchange rate conversion?
**A:** No. Each company operates in ONE currency. Prices are stored in that currency.

### Q3: Can we add more languages later?
**A:** Yes. The infrastructure supports unlimited languages. Add new language files and update language selector.

### Q4: What about fiscal printer for other countries?
**A:** Fiscal printer remains Azerbaijan-specific. Can be made modular later if needed.

### Q5: How long until we can sell internationally?
**A:** After implementation (8-10 days) + testing (1 week) + marketing prep = 3-4 weeks total.

### Q6: What if translation key is missing?
**A:** i18next shows the key name. Console warning logged. Fallback to English if available.

### Q7: Can users mix languages?
**A:** Yes, if user-level override is enabled. User can use English while account default is Azerbaijani.

### Q8: Performance impact?
**A:** Expected <100ms page load increase. i18next is lightweight and uses lazy loading.

---

## File Locations Reference

### Backend
```
xpos/
├── app/
│   ├── Enums/
│   │   ├── PaymentMethod.php
│   │   ├── ExpenseType.php
│   │   └── SubscriptionPlan.php
│   ├── Services/
│   │   ├── TranslationService.php
│   │   └── CurrencyService.php
│   ├── Helpers/
│   │   └── CurrencyHelper.php
│   └── Http/
│       └── Middleware/
│           └── SetLocale.php
├── lang/
│   ├── en/
│   │   ├── common.php
│   │   ├── enums.php
│   │   ├── validation.php
│   │   └── ...
│   └── az/
│       └── (same structure)
└── database/
    ├── migrations/
    │   └── 2025_12_09_00*_*.php
    └── seeders/
        └── CurrencySeeder.php
```

### Frontend
```
xpos/resources/js/
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en/
│       │   ├── common.json
│       │   ├── products.json
│       │   └── ...
│       └── az/
│           └── (same structure)
├── Components/
│   ├── LanguageSwitcher.tsx
│   └── CurrencySelector.tsx
└── Utils/
    └── currency.ts
```

---

## Getting Help

### Documentation Issues
- Missing information: Create GitHub issue
- Unclear instructions: Ask in team chat
- Technical questions: Tag @senior-dev

### Implementation Issues
- Stuck on a phase: Review the specific doc again
- Subagent not working: Check prompt formatting
- Tests failing: Check test requirements in docs

### Translation Issues
- Azerbaijani review needed: Contact native speaker
- Business term unclear: Ask product owner
- Technical term: Use English in both languages

---

## Changelog

### Version 1.0 (2025-12-09)
- Initial documentation created
- All 5 docs completed
- 9 subagent prompts ready
- Implementation plan finalized

### Future Versions
- Add translation coverage reporting
- Add performance benchmarks
- Add case studies from implementation
- Add troubleshooting guide

---

## Next Actions

### Immediate Next Steps:
1. ✅ Read this README
2. ✅ Review 04-IMPLEMENTATION-PLAN.md
3. ⏭️ **Decide: Manual or Subagent approach**
4. ⏭️ **Create feature branch: `git checkout -b feature/internationalization`**
5. ⏭️ **Start Phase 1: Database Migrations**

### Before You Start:
- [ ] Backup database
- [ ] Confirm test data status
- [ ] Set up development environment
- [ ] Review all documentation
- [ ] Identify Azerbaijani translator
- [ ] Get approval from stakeholders

---

## Contact & Support

**Document Owner:** Development Team
**Last Updated:** 2025-12-09
**Version:** 1.0
**Status:** Ready for Implementation

**For questions:**
- Technical: #dev-team channel
- Business: Product Owner
- Urgent: @on-call-dev

---

**Ready to start?** → Begin with [04-IMPLEMENTATION-PLAN.md](./04-IMPLEMENTATION-PLAN.md)
