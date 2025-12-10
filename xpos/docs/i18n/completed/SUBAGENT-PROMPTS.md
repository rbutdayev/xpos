# Subagent Prompts for Internationalization Implementation

## Overview
This document contains ready-to-use prompts for delegating i18n implementation tasks to specialized subagents. Each prompt is self-contained and can be used with the Task tool.

---

## Prompt 1: Database Migration Implementation

**Task Type:** Code Implementation
**Estimated Time:** 4-6 hours
**Subagent Type:** general-purpose

```
I need you to implement database migrations for internationalization in the XPOS Laravel application.

CONTEXT:
- Current database has Azerbaijani enum values ('nağd', 'kart', 'köçürmə', etc.)
- We have test data only (3 accounts, 52 sales, 204 customers) that can be wiped
- Target: Clean English enum values ('cash', 'card', 'bank_transfer', etc.)
- Reference documentation: /Users/ruslan/projects/xpos/xpos/docs/i18n/01-DATABASE-CHANGES.md

TASKS TO COMPLETE:

1. CREATE MIGRATION FILES:
   - 2025_12_09_001_update_payment_method_enums.php
   - 2025_12_09_002_update_expense_type_enums.php
   - 2025_12_09_003_update_subscription_plan_enums.php
   - 2025_12_09_004_add_user_language_column.php
   - 2025_12_09_005_add_currency_support_to_companies.php
   - 2025_12_09_006_create_currencies_table.php
   - 2025_12_09_007_update_account_language_defaults.php

2. IMPLEMENT ENUM MIGRATIONS:
   - Update payment methods: nağd→cash, kart→card, köçürmə→bank_transfer, bank_kredit→bank_credit, hədiyyə_kartı→gift_card
   - Update expense types: maaş→salary, xərclər→expenses, ödənişlər→payments, kommunal→utilities, nəqliyyat→transport, digər→other
   - Update subscription plans: başlanğıc→starter (professional/enterprise already English)

3. ADD LANGUAGE SUPPORT:
   - Add 'language' column to users table (nullable, index)
   - Update accounts.language default from 'az' to 'en'
   - Update companies.default_language default from 'az' to 'en'

4. ADD CURRENCY SUPPORT:
   - Add to companies table: currency_code (default 'USD'), currency_symbol (default '$'), currency_decimal_places (default 2), currency_symbol_position (enum: before/after, default 'before')
   - Create currencies reference table with columns: code (primary), name, symbol, decimal_places, symbol_position, active
   - Create seeder with currencies: USD, EUR, GBP, AZN, TRY, RUB, JPY, CNY, INR

5. CREATE PHP ENUM CLASSES:
   - app/Enums/PaymentMethod.php (enum with cases: CASH, CARD, BANK_TRANSFER, BANK_CREDIT, GIFT_CARD)
   - app/Enums/ExpenseType.php (enum with cases: SALARY, EXPENSES, PAYMENTS, UTILITIES, TRANSPORT, OTHER)
   - app/Enums/SubscriptionPlan.php (enum with cases: STARTER, PROFESSIONAL, ENTERPRISE)

6. UPDATE MODEL CONSTANTS:
   - Update Payment model to use PaymentMethod enum
   - Update Expense model to use ExpenseType enum
   - Update Account model to use SubscriptionPlan enum

7. UPDATE VALIDATION RULES:
   - Find all FormRequest classes that validate payment_method, expense_type, subscription_plan
   - Update validation rules to use new English enum values
   - Use Enum rule where applicable: new Enum(PaymentMethod::class)

8. TEST THE MIGRATIONS:
   - Run: php artisan migrate:fresh --seed
   - Verify all enums are in English
   - Verify currency table has 9 currencies
   - Verify language columns exist with correct defaults

IMPORTANT:
- Include both up() and down() methods in all migrations
- Use DB::statement() for enum updates
- Handle existing data with CASE statements
- Create comprehensive seeders
- DO NOT run migrations automatically - just create the files
- Return a summary of all files created and what was changed

OUTPUT FORMAT:
Provide a summary report including:
1. List of all migration files created
2. List of all enum classes created
3. List of models updated
4. List of validation rules updated
5. SQL preview of key enum conversions
6. Next steps to run the migrations
```

---

## Prompt 2: Backend Translation Infrastructure

**Task Type:** Code Implementation
**Estimated Time:** 4-6 hours
**Subagent Type:** general-purpose

```
I need you to set up the Laravel translation infrastructure for the XPOS application.

CONTEXT:
- Laravel application located at /Users/ruslan/projects/xpos/xpos
- Need to support English (en) and Azerbaijani (az) languages
- Reference documentation: /Users/ruslan/projects/xpos/xpos/docs/i18n/02-TRANSLATION-SETUP.md
- This is a multi-tenant system - always consider account_id (see CLAUDE.md)

TASKS TO COMPLETE:

1. CREATE DIRECTORY STRUCTURE:
   - Create lang/en/ directory
   - Create lang/az/ directory
   - Create subdirectories for both: common.php, validation.php, auth.php, models.php, enums.php, messages.php, fiscal.php

2. CREATE TRANSLATION FILES:
   - lang/en/common.php - Common UI strings (save, cancel, delete, edit, etc.)
   - lang/az/common.php - Azerbaijani equivalents
   - lang/en/enums.php - Payment methods, expense types, subscription plans, user roles, sale statuses
   - lang/az/enums.php - Azerbaijani equivalents
   - lang/en/validation.php - Validation messages (use Laravel's default as base, add custom ones)
   - lang/az/validation.php - Azerbaijani validation messages
   - lang/en/models.php - Model field labels (product, customer, sale, etc.)
   - lang/az/models.php - Azerbaijani model labels

3. CREATE SETLOCALE MIDDLEWARE:
   - File: app/Http/Middleware/SetLocale.php
   - Priority: 1) User's language, 2) Account's language, 3) Company's language, 4) Default 'en'
   - Support X-Locale header for API requests
   - Register in app/Http/Kernel.php in both web and api middleware groups

4. CREATE TRANSLATION SERVICE:
   - File: app/Services/TranslationService.php
   - Methods: enum($type, $value), enumOptions($type), paymentMethod($method), expenseType($type), currentLocale(), isAzerbaijani(), isEnglish()
   - Use __() helper for translations

5. UPDATE API RESOURCES:
   - Find all API Resource classes (PaymentResource, ExpenseResource, etc.)
   - Add translated labels alongside raw enum values
   - Example: 'method' => $this->method, 'method_label' => TranslationService::paymentMethod($this->method)

6. UPDATE VALIDATION MESSAGES:
   - Find all FormRequest classes with Azerbaijani validation messages
   - Move messages to lang/az/validation.php
   - Update FormRequest classes to use translation keys

7. CREATE LANGUAGE UPDATE ROUTES:
   - API route: POST /api/user/language
   - Controller method: UserController@updateLanguage
   - Validate language is 'en' or 'az'
   - Update auth()->user()->language
   - Return JSON success response

8. UPDATE .ENV CONFIGURATION:
   - Set APP_LOCALE=en
   - Set APP_FALLBACK_LOCALE=en
   - Keep APP_TIMEZONE=Asia/Baku (don't change)

IMPORTANT:
- Use Laravel's __() helper for translations
- Always provide fallback to English
- Keep translation keys consistent (snake_case)
- Don't translate fiscal printer strings yet (Azerbaijan-specific)
- Follow multi-tenant guidelines from CLAUDE.md

OUTPUT FORMAT:
Provide a summary report including:
1. List of all translation files created with key count
2. SetLocale middleware implementation summary
3. TranslationService methods summary
4. Number of API Resources updated
5. Number of FormRequest classes updated
6. Route added for language switching
7. Example usage of translation in code
8. Next steps for testing
```

---

## Prompt 3: Frontend Translation Infrastructure (i18next)

**Task Type:** Code Implementation
**Estimated Time:** 6-8 hours
**Subagent Type:** general-purpose

```
I need you to set up i18next translation infrastructure for the React frontend of XPOS.

CONTEXT:
- React + TypeScript + Inertia.js application
- Located at /Users/ruslan/projects/xpos/xpos/resources/js
- Need to support English (en) and Azerbaijani (az)
- Reference documentation: /Users/ruslan/projects/xpos/xpos/docs/i18n/02-TRANSLATION-SETUP.md

TASKS TO COMPLETE:

1. INSTALL DEPENDENCIES:
   - Run: npm install i18next react-i18next i18next-browser-languagedetector
   - Verify installation in package.json

2. CREATE DIRECTORY STRUCTURE:
   - resources/js/i18n/index.ts
   - resources/js/i18n/locales/en/ (common.json, products.json, sales.json, customers.json, inventory.json, reports.json, settings.json, dashboard.json)
   - resources/js/i18n/locales/az/ (same files)

3. CONFIGURE I18NEXT:
   - Create resources/js/i18n/index.ts with full i18next configuration
   - Import all translation JSON files
   - Set up language detector (localStorage + navigator)
   - Set fallback language to 'en'
   - Configure namespaces: common, products, sales, customers, inventory, reports, settings, dashboard
   - Disable suspense for React

4. CREATE BASE TRANSLATION FILES:
   - resources/js/i18n/locales/en/common.json - Common UI strings (actions, labels, messages)
   - resources/js/i18n/locales/az/common.json - Azerbaijani equivalents
   - Create structure with sections: actions {}, labels {}, messages {}, navigation {}

5. CREATE MODULE-SPECIFIC TRANSLATION FILES:
   - products.json (en/az) - Product-related strings
   - sales.json (en/az) - Sales/POS strings
   - customers.json (en/az) - Customer strings
   - inventory.json (en/az) - Inventory strings
   - settings.json (en/az) - Settings strings
   - Start with essential keys, we'll expand later

6. CREATE LANGUAGE SWITCHER COMPONENT:
   - File: resources/js/Components/LanguageSwitcher.tsx
   - Show current language with flag (🇬🇧 English, 🇦🇿 Azərbaycan)
   - Dropdown with language options
   - On change: Update i18next, save to localStorage, POST to /api/user/language via Inertia
   - Styled with Tailwind CSS

7. INTEGRATE I18N INTO APP:
   - Import './i18n' at the top of resources/js/app.tsx
   - Ensure it loads before React components

8. CREATE TYPESCRIPT DEFINITIONS:
   - resources/js/types/i18next.d.ts - Type definitions for namespaces
   - Ensure TypeScript autocomplete works for translation keys

9. UPDATE ONE SAMPLE PAGE:
   - Choose resources/js/Pages/Products/Index.tsx
   - Convert all hardcoded Azerbaijani strings to use useTranslation
   - Add proper translation keys to products.json
   - Show before/after example

IMPORTANT:
- Use useTranslation hook in all components
- Use namespace-specific translations: const { t } = useTranslation('products')
- For multiple namespaces: const { t } = useTranslation(['products', 'common'])
- Translation key format: t('namespace:section.key') or t('section.key') if namespace is set
- Keep localStorage key as 'i18nextLng'

OUTPUT FORMAT:
Provide a summary report including:
1. List of dependencies installed
2. Directory structure created
3. Number of translation files created with key counts
4. i18next configuration summary
5. LanguageSwitcher component location and features
6. Sample page conversion (Products/Index.tsx) - show before/after code
7. TypeScript definitions added
8. How to use translations in new components (examples)
9. Next steps for translating more components
```

---

## Prompt 4: Extract and Translate Frontend Components (Batch 1: Core Modules)

**Task Type:** Code Implementation
**Estimated Time:** 15-20 hours
**Subagent Type:** general-purpose

```
I need you to extract hardcoded Azerbaijani strings from React components and replace them with i18next translations.

CONTEXT:
- React + TypeScript application with ~478 hardcoded Azerbaijani strings
- i18next is already set up (see previous prompts)
- Translation files exist in resources/js/i18n/locales/
- Work on CORE MODULES only in this batch

MODULES TO TRANSLATE (Priority Order):

1. PRODUCTS MODULE (resources/js/Pages/Products/*)
   - Index.tsx, Create.tsx, Edit.tsx, Show.tsx
   - Extract strings to i18n/locales/en/products.json and az/products.json
   - Estimated strings: ~60-80

2. SALES MODULE (resources/js/Pages/Sales/*)
   - Index.tsx, Create.tsx, Show.tsx, POS.tsx
   - Extract strings to i18n/locales/en/sales.json and az/sales.json
   - Estimated strings: ~80-100

3. CUSTOMERS MODULE (resources/js/Pages/Customers/*)
   - Index.tsx, Create.tsx, Edit.tsx, Show.tsx
   - Extract strings to i18n/locales/en/customers.json and az/customers.json
   - Estimated strings: ~50-60

4. DASHBOARD (resources/js/Pages/Dashboard.tsx)
   - Extract strings to i18n/locales/en/dashboard.json and az/dashboard.json
   - Estimated strings: ~30-40

PROCESS FOR EACH COMPONENT:

1. READ THE COMPONENT FILE
2. IDENTIFY ALL HARDCODED STRINGS:
   - Azerbaijani text in JSX
   - Hardcoded labels in objects
   - Button text, headings, labels, placeholders
   - Error messages, success messages

3. CREATE TRANSLATION KEYS:
   - Use descriptive snake_case keys
   - Group by sections (titles, labels, buttons, messages, placeholders, errors)
   - Example: products.json -> { "title": "Products", "new_product": "New Product", "labels": { "name": "Product Name" } }

4. ADD TO TRANSLATION FILES:
   - Add English translation to locales/en/[module].json
   - Add Azerbaijani translation to locales/az/[module].json
   - Keep original Azerbaijani text exactly as-is

5. UPDATE COMPONENT:
   - Import: import { useTranslation } from 'react-i18next';
   - Add hook: const { t } = useTranslation('module_name');
   - Replace strings: "Məhsullar" -> {t('title')}
   - Replace nested: "Məhsulun Adı" -> {t('labels.name')}

6. HANDLE SPECIAL CASES:
   - Dynamic strings with variables: t('welcome', { name: userName })
   - Plurals: t('product_count', { count: products.length })
   - Conditional text: t(isActive ? 'active' : 'inactive')

IMPORTANT:
- DO NOT translate API endpoint URLs
- DO NOT translate database field names
- DO NOT translate enum values (just their display labels)
- Keep component functionality exactly the same
- Test each component after translation (npm run build should succeed)
- Maintain TypeScript types

OUTPUT FORMAT:
For each module, provide:
1. Component files updated (list)
2. Translation keys added (count per file)
3. Before/after code example (one component per module)
4. Any issues or edge cases encountered
5. Components that need human review for translation quality

Final summary:
- Total components updated
- Total translation keys added
- Build status (npm run build)
- Next batch of components to translate
```

---

## Prompt 5: Extract and Translate Frontend Components (Batch 2: Secondary Modules)

**Task Type:** Code Implementation
**Estimated Time:** 12-15 hours
**Subagent Type:** general-purpose

```
I need you to continue extracting hardcoded Azerbaijani strings from the remaining React components.

CONTEXT:
- This is BATCH 2 - Core modules already done
- i18next is set up and working
- Follow same process as Batch 1

MODULES TO TRANSLATE (Priority Order):

1. INVENTORY MODULE (resources/js/Pages/Inventory/*)
   - Stock management, transfers, adjustments
   - Extract to i18n/locales/en/inventory.json and az/inventory.json
   - Estimated strings: ~40-50

2. REPORTS MODULE (resources/js/Pages/Reports/*)
   - All report pages
   - Extract to i18n/locales/en/reports.json and az/reports.json
   - Estimated strings: ~50-60

3. SETTINGS MODULE (resources/js/Pages/Settings/*)
   - Company settings, user settings, system settings
   - Extract to i18n/locales/en/settings.json and az/settings.json
   - Estimated strings: ~60-70

4. EXPENSES MODULE (resources/js/Pages/Expenses/*)
   - Extract to i18n/locales/en/expenses.json and az/expenses.json
   - Estimated strings: ~30-40

5. SUPPLIERS MODULE (resources/js/Pages/Suppliers/*)
   - Extract to i18n/locales/en/suppliers.json and az/suppliers.json
   - Estimated strings: ~40-50

PROCESS:
Same as Batch 1 - read component, identify strings, create translation keys, add to JSON files, update components.

IMPORTANT:
- Reuse common translations from common.json where applicable (save, cancel, delete, etc.)
- Don't duplicate keys - reference common: t('common:actions.save')
- Keep consistency with Batch 1 naming conventions

OUTPUT FORMAT:
Same as Batch 1 - list of updated components, translation key counts, before/after examples, issues, summary.
```

---

## Prompt 6: Extract and Translate Shared Components

**Task Type:** Code Implementation
**Estimated Time:** 8-10 hours
**Subagent Type:** general-purpose

```
I need you to translate all shared/reusable components in the XPOS application.

CONTEXT:
- Located in resources/js/Components/
- These components are used across multiple pages
- Must not break any existing functionality

COMPONENTS TO TRANSLATE:

1. LAYOUT COMPONENTS:
   - AuthenticatedLayout.tsx
   - GuestLayout.tsx
   - Navigation components
   - Sidebar components

2. FORM COMPONENTS:
   - Input components
   - Select components
   - Button components
   - Form validation components

3. UI COMPONENTS:
   - Modal components
   - Alert components
   - Card components
   - Table components
   - Pagination components

4. BUSINESS COMPONENTS:
   - ProductSelector.tsx
   - CustomerSelector.tsx
   - BarcodeScanner.tsx
   - PaymentForm.tsx
   - Any other domain-specific components

PROCESS:

1. Identify which strings should go in common.json vs module-specific JSON
2. Update common.json with shared strings
3. Update components to use translations
4. Ensure all parent components still work correctly

SPECIAL CONSIDERATIONS:
- Props that accept text labels - these should be translated at the parent component level
- Reusable validation messages - use common.json
- Icons and symbols - don't translate
- Technical terms - keep consistent across languages

OUTPUT FORMAT:
1. List of all components updated
2. New keys added to common.json
3. Breaking changes (if any)
4. Components that accept text props - document how to use with translations
5. Full test run results
```

---

## Prompt 7: Currency Support Implementation

**Task Type:** Code Implementation
**Estimated Time:** 6-8 hours
**Subagent Type:** general-purpose

```
I need you to implement multi-currency support for the XPOS application.

CONTEXT:
- Database migrations for currency already completed (see Prompt 1)
- Companies table has currency_code, currency_symbol, currency_decimal_places, currency_symbol_position
- Currencies table exists with reference data
- NO exchange rate conversion needed - each account uses ONE currency

TASKS TO COMPLETE:

1. CREATE CURRENCY HELPER:
   - File: app/Helpers/CurrencyHelper.php
   - Methods:
     - format($amount, $currencyCode = null) - Format amount with currency symbol
     - symbol($currencyCode) - Get currency symbol
     - decimals($currencyCode) - Get decimal places
     - position($currencyCode) - Get symbol position
   - Default to current company's currency if not specified

2. CREATE CURRENCY SERVICE:
   - File: app/Services/CurrencyService.php
   - Methods:
     - getCompanyCurrency() - Get current company's currency settings
     - formatMoney($amount) - Format using company currency
     - getAllCurrencies() - Get all active currencies
     - updateCompanyCurrency($code) - Update company currency

3. ADD TO ONBOARDING FLOW:
   - Locate onboarding/registration controller
   - Add currency selection step
   - Show dropdown with all currencies (code + name + symbol)
   - Default to USD
   - Save to companies table

4. ADD TO SETTINGS PAGE:
   - Create/update Company Settings page
   - Add currency selection dropdown
   - Show current currency with preview: "$1,234.56" format
   - Allow changing currency (warning: affects all pricing displays)

5. CREATE API ENDPOINTS:
   - GET /api/currencies - List all currencies
   - GET /api/company/currency - Get current company currency
   - PUT /api/company/currency - Update company currency

6. CREATE CURRENCY RESOURCE:
   - File: app/Http/Resources/CurrencyResource.php
   - Return: code, name, symbol, decimal_places, symbol_position, formatted_example

7. UPDATE FRONTEND HELPERS:
   - File: resources/js/Utils/currency.ts
   - Function: formatCurrency(amount, currency) - Format on frontend
   - Use Intl.NumberFormat for proper formatting

8. UPDATE PRICE DISPLAYS:
   - Find all components that display prices/amounts
   - Use formatCurrency() helper
   - Test with different currencies (USD, EUR, AZN)

9. ADD CURRENCY TO INERTIA SHARED DATA:
   - File: app/Http/Middleware/HandleInertiaRequests.php
   - Add company currency to shared data
   - Available globally as: $page.props.currency

IMPORTANT:
- No currency conversion - each company has ONE currency
- Respect currency_symbol_position (before: $100, after: 100₼)
- Respect decimal_places (USD: 2, JPY: 0)
- Update fiscal printer config if needed (tax amounts)

OUTPUT FORMAT:
1. List of helper/service files created
2. API endpoints added
3. Onboarding step added (with screenshot if possible)
4. Settings page updated (with screenshot if possible)
5. Number of components updated with currency formatting
6. Test results with 3 different currencies (USD, AZN, EUR)
7. Next steps
```

---

## Prompt 8: Language Switching UI Implementation

**Task Type:** Code Implementation
**Estimated Time:** 3-4 hours
**Subagent Type:** general-purpose

```
I need you to implement the language switching UI and ensure it works seamlessly across the application.

CONTEXT:
- Backend i18n setup complete (SetLocale middleware, translation files)
- Frontend i18next setup complete
- LanguageSwitcher component created
- Need to integrate and test end-to-end

TASKS TO COMPLETE:

1. ADD LANGUAGE SWITCHER TO LAYOUT:
   - Add LanguageSwitcher component to AuthenticatedLayout.tsx (top-right corner)
   - Add to navigation bar next to user menu
   - Ensure proper spacing and styling

2. ADD LANGUAGE PREFERENCE TO USER PROFILE:
   - Add to Profile/Edit.tsx
   - Dropdown: English / Azərbaycan
   - Save to user.language field
   - Show success message on update

3. ADD LANGUAGE PREFERENCE TO ACCOUNT SETTINGS:
   - Add default language setting for account
   - Admin can set default for all users
   - Located in Settings page

4. SYNCHRONIZE FRONTEND AND BACKEND:
   - When user changes language via LanguageSwitcher:
     - Update i18next (frontend)
     - Save to localStorage
     - POST to /api/user/language (backend)
     - Reload page data with new locale
   - Ensure Inertia requests include X-Locale header

5. HANDLE LANGUAGE PERSISTENCE:
   - On app load, check localStorage for language preference
   - If user is logged in, sync with database preference
   - Priority: User DB preference > localStorage > Browser language > Default (en)

6. ADD LANGUAGE INDICATOR:
   - Small flag icon showing current language
   - Tooltip: "Current language: English"
   - Consistent placement across all pages

7. TEST LANGUAGE SWITCHING:
   - Test switching from English to Azerbaijani and back
   - Verify all translated components update
   - Verify backend returns translated validation messages
   - Verify enum labels are translated
   - Test on multiple pages (Products, Sales, Customers, Dashboard)

8. HANDLE EDGE CASES:
   - What happens if translation key is missing? (Show key name)
   - What if backend doesn't have translation? (Fallback to English)
   - Guest users (not logged in) - use localStorage only

IMPORTANT:
- Language should persist across sessions
- Page refresh should maintain selected language
- No console errors on language switch
- All components should re-render with new language

OUTPUT FORMAT:
1. LanguageSwitcher placement locations
2. User profile update implementation
3. Account settings implementation
4. Synchronization flow diagram (frontend <-> backend)
5. Test results (checklist of all pages tested)
6. Edge cases handled
7. Screenshots of language switcher in action
8. Known issues or limitations
```

---

## Prompt 9: Testing and Validation

**Task Type:** Testing & QA
**Estimated Time:** 6-8 hours
**Subagent Type:** general-purpose

```
I need you to comprehensively test the internationalization implementation and create a validation report.

CONTEXT:
- All i18n implementation complete (database, backend, frontend)
- Need to verify everything works correctly in both English and Azerbaijani
- Identify any missing translations or bugs

TESTING CHECKLIST:

1. DATABASE VERIFICATION:
   - Run: php artisan tinker
   - Verify all payment methods are English enums
   - Verify all expense types are English enums
   - Verify currencies table has 9 currencies
   - Check users table has language column
   - Check accounts.language and companies.default_language

2. BACKEND TRANSLATION TESTING:
   - Test SetLocale middleware with different user languages
   - Test validation messages in both languages (submit invalid form)
   - Test enum translations via TranslationService
   - Test API responses include translated labels
   - Test X-Locale header works for API requests

3. FRONTEND TRANSLATION TESTING:
   Test EVERY module page in BOTH languages:
   - Dashboard
   - Products (Index, Create, Edit, Show)
   - Sales (Index, Create, POS)
   - Customers (Index, Create, Edit)
   - Inventory pages
   - Reports pages
   - Settings pages
   - Expenses pages
   - Suppliers pages

   For each page verify:
   - All text is translated (no hardcoded Azerbaijani/English)
   - Buttons work correctly
   - Forms submit correctly
   - Validation messages appear in correct language
   - Enum dropdowns show translated labels

4. LANGUAGE SWITCHING TESTING:
   - Switch from English to Azerbaijani - verify all content updates
   - Switch back to English - verify all content updates
   - Refresh page - verify language persists
   - Logout and login - verify user's language preference loads
   - Test as different user with different language preference

5. CURRENCY TESTING:
   - Change company currency to EUR - verify all prices update
   - Change to JPY - verify 0 decimal places
   - Change to AZN - verify symbol appears after amount (100₼)
   - Change back to USD - verify symbol before amount ($100)
   - Test in different modules (Sales, Products, Reports)

6. MISSING TRANSLATIONS:
   - Use browser devtools console
   - Check for i18next warnings about missing keys
   - List all missing translation keys
   - Check for untranslated text (visual inspection)

7. PERFORMANCE TESTING:
   - Measure page load time in English vs Azerbaijani
   - Check bundle size increase due to i18next
   - Verify no memory leaks on language switching
   - Test on slow connection

8. EDGE CASES:
   - Missing translation keys - should show key name
   - Very long translated text - UI should not break
   - Special characters in Azerbaijani (ə, ğ, ı, ö, ş, ü, ç)
   - RTL languages (future) - note any potential issues

9. ACCESSIBILITY:
   - Test with screen reader
   - Verify lang attribute updates on <html> tag
   - Check ARIA labels are translated

10. BROWSER COMPATIBILITY:
    - Test in Chrome, Firefox, Safari
    - Test on mobile browsers
    - Test on tablets (PWA)

OUTPUT FORMAT:
Provide detailed test report with:

1. PASS/FAIL STATUS:
   - Database migrations: PASS/FAIL
   - Backend translations: PASS/FAIL
   - Frontend translations: PASS/FAIL
   - Language switching: PASS/FAIL
   - Currency support: PASS/FAIL

2. MODULE-BY-MODULE RESULTS:
   Table with columns: Module, English, Azerbaijani, Issues
   List every page tested

3. MISSING TRANSLATIONS:
   - List of all missing translation keys
   - List of untranslated hardcoded strings found

4. BUGS FOUND:
   - Description, severity (critical/major/minor), affected page, steps to reproduce

5. PERFORMANCE METRICS:
   - Bundle size before/after i18n
   - Page load time comparison
   - Language switch speed

6. RECOMMENDATIONS:
   - Priority fixes needed
   - Optional improvements
   - Future enhancements

7. SIGN-OFF:
   - Ready for production: YES/NO
   - Blockers (must-fix before launch)
   - Nice-to-haves (can fix post-launch)
```

---

## How to Use These Prompts

### Sequential Execution:
1. Start with Prompt 1 (Database Migration)
2. Then Prompt 2 (Backend Translation)
3. Then Prompt 3 (Frontend Translation Infrastructure)
4. Then Prompts 4-6 (Component Translation - can be done in parallel)
5. Then Prompt 7 (Currency Support)
6. Then Prompt 8 (Language Switching UI)
7. Finally Prompt 9 (Testing)

### Using with Task Tool:

```typescript
// Example usage:
<Task
  subagent_type="general-purpose"
  description="Implement database migrations for i18n"
  prompt="[Copy Prompt 1 here]"
/>
```

### Parallel Execution:
Prompts 4, 5, 6 (component translation batches) can run in parallel if you have multiple agents available.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-09
**Status:** Ready for Use
