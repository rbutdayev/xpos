# Loyalty Card System - Implementation Tasks

## Overview
Physical loyalty cards with unique 14-digit identifiers. Tenants buy cards from system owner and assign them to customers.

---

## Phase 1: Database & Models

### 1.1 Create Migration
- [ ] Create `loyalty_cards` table migration
  - `id` - primary key
  - `card_number` - string(14), unique, indexed
  - `status` - enum('free', 'used', 'inactive'), default 'free', indexed
  - `account_id` - nullable, foreign key to accounts
  - `customer_id` - nullable, foreign key to customers
  - `assigned_at` - nullable timestamp (when card was assigned)
  - `timestamps`
  - Add indexes on frequently searched columns

### 1.2 Create LoyaltyCard Model
- [ ] Create model with relationships
- [ ] Add fillable fields
- [ ] Add status constants
- [ ] Add scopes: `byAccount()`, `free()`, `used()`, `inactive()`
- [ ] Add relationships: `account()`, `customer()`
- [ ] Add mutators for card_number (uppercase)
- [ ] **Note:** Cards are managed by super admin globally, regular filtering by account_id only applies to used cards

### 1.3 Update Customer Model
- [ ] Add `loyalty_card_id` foreign key to customers table
- [ ] Add relationship `loyaltyCard()` in Customer model
- [ ] Add card info to customer views

---

## Phase 2: Admin Dashboard - Card Management

### 2.1 Card Generation
- [ ] Create admin route: `admin.loyalty-cards.index`
- [ ] Create admin route: `admin.loyalty-cards.generate` (POST)
- [ ] Create controller: `Admin\LoyaltyCardController`
- [ ] Implement bulk card generation logic
  - Generate unique 14-character alphanumeric codes
  - Validate uniqueness before saving
  - Create in batches (100, 500, 1000)
- [ ] Create admin view: card generation form
- [ ] Add success/error notifications

### 2.2 Card Listing & Search
- [ ] Create admin route: `admin.loyalty-cards.index`
- [ ] Build card listing page with filters:
  - Search by card number
  - Filter by status (free/used/inactive)
  - Filter by account (for used cards)
  - Pagination
- [ ] Display card details: number, status, assigned account, customer, date

### 2.3 Card Actions
- [ ] Create route: `admin.loyalty-cards.deactivate` (POST)
- [ ] Create route: `admin.loyalty-cards.activate` (POST)
- [ ] Create route: `admin.loyalty-cards.unassign` (POST)
- [ ] Implement deactivate card logic
- [ ] Implement activate card logic
- [ ] Implement unassign card logic (free up card)
- [ ] Add confirmation modals for actions

### 2.4 Card Inventory Dashboard
- [ ] Create admin dashboard widget
- [ ] Show statistics:
  - Total cards
  - Free cards count
  - Used cards count
  - Inactive cards count
  - Cards by account (top 10)
- [ ] Add charts/graphs (optional)

### 2.5 Card Reports
- [ ] Create route: `admin.loyalty-cards.reports`
- [ ] Cards by tenant report
- [ ] Card assignment history
- [ ] Unused cards report
- [ ] Export to CSV/Excel (optional)

---

## Phase 3: Tenant Functionality - Card Assignment

### 3.1 Customer Form - Add Card Field
- [ ] Add card_number input field to customer create form
- [ ] Add card_number input field to customer edit form
- [ ] Add client-side validation (14 characters)
- [ ] Add card lookup/validation indicator (AJAX)
- [ ] Show real-time card status (available/already used)

### 3.2 Card Validation Logic
- [ ] Create card validation request class
- [ ] Validate card number format (exactly 14 characters)
- [ ] Check card exists in database
- [ ] Check card status is 'free'
- [ ] Return user-friendly error messages

### 3.3 Card Assignment Logic
- [ ] Update CustomerController@store
  - Validate card if provided
  - Assign card to customer
  - Update card status to 'used'
  - Set account_id and customer_id
  - Set assigned_at timestamp
- [ ] Update CustomerController@update
  - Handle card change (unassign old, assign new)
  - Handle card removal (unassign)
  - Validate new card if provided
- [ ] Ensure account_id is set correctly

### 3.4 Card Unassignment
- [ ] Create route: `customers.unassign-card` (POST)
- [ ] Implement unassign logic in controller
- [ ] Update card: set status to 'free', clear account_id, customer_id
- [ ] Add confirmation modal
- [ ] Update customer view

---

## Phase 4: UI/UX Enhancements

### 4.1 Customer Views
- [ ] Show assigned card number on customer detail page
- [ ] Show assigned card number in customer list (optional column)
- [ ] Add "Remove Card" button on customer detail
- [ ] Add card badge/indicator

### 4.2 Search & Filters
- [ ] Add "Search by Card Number" to customer search
- [ ] Filter customers with/without loyalty cards
- [ ] Quick card lookup tool for tenants

### 4.3 Admin Navigation
- [ ] Add "Loyalty Cards" menu item in admin panel
- [ ] Add submenu: Generate, Manage, Reports
- [ ] Update admin dashboard with card stats

---

## Phase 5: Authorization & Security

### 5.1 Gates & Policies
- [ ] Create LoyaltyCardPolicy
- [ ] Add gates in AuthorizationServiceProvider:
  - `manage-loyalty-cards` (super admin only)
  - `assign-loyalty-cards` (tenants can assign to their customers)
  - `view-loyalty-cards` (super admin only)
- [ ] Apply gates to all card routes/controllers

### 5.2 Middleware
- [ ] Ensure admin routes require super admin role
- [ ] Ensure tenant routes check account ownership
- [ ] Add CSRF protection to forms

### 5.3 Validation
- [ ] Prevent assigning used cards
- [ ] Prevent cross-tenant card access
- [ ] Validate card format (alphanumeric, 14 chars)
- [ ] Case-insensitive card lookup

---

## Phase 6: Data Integrity & Edge Cases

### 6.1 Customer Deletion Handling
- [ ] When customer is soft deleted, free up their card
- [ ] When customer is restored, card remains unassigned (manual reassignment)

### 6.2 Duplicate Prevention
- [ ] Database unique constraint on card_number
- [ ] Retry logic for card generation if collision occurs
- [ ] Transaction handling for card assignment

### 6.3 Card History (Optional)
- [ ] Create `loyalty_card_history` table
- [ ] Track: card_id, customer_id, account_id, action (assigned/unassigned), created_at
- [ ] Log all card assignments/unassignments

---

## Phase 7: Testing & Documentation

### 7.1 Testing
- [ ] Test card generation (uniqueness, format)
- [ ] Test card assignment (validation, authorization)
- [ ] Test card unassignment
- [ ] Test customer deletion → card freed
- [ ] Test cross-tenant isolation
- [ ] Test admin actions (deactivate, activate)

### 7.2 Documentation
- [ ] Update user manual for tenants (how to assign cards)
- [ ] Create admin guide (how to generate/manage cards)
- [ ] Document card number format and generation logic

---

## Implementation Order
1. Phase 1: Database & Models ✅ Foundation
2. Phase 2.1-2.3: Admin card generation & management ✅ Core admin features
3. Phase 3: Tenant card assignment ✅ Core tenant features
4. Phase 5: Authorization & Security ✅ Secure the system
5. Phase 6: Data integrity ✅ Handle edge cases
6. Phase 2.4-2.5: Admin dashboard & reports ✅ Nice to have
7. Phase 4: UI/UX enhancements ✅ Polish
8. Phase 7: Testing & documentation ✅ Final validation

---

## Notes
- Card numbers: 14-character alphanumeric (uppercase for consistency)
- Cards are a global resource managed by super admin
- Only used cards have account_id set (links to tenant)
- Free cards have null account_id and customer_id
- Status transitions: free → used → free (via unassignment) or inactive
