# ⚙️ BATCH 7: Settings & Configuration Pages Translation

**Priority:** 🟢 Normal
**Status:** ⏳ Not Started
**Estimated Time:** 3-4 hours

---

## 📋 Files to Translate (20 files)

### Settings
1. `Pages/Settings/Index.tsx`
2. `Pages/Settings/ShopSettings.tsx`
3. `Pages/Settings/FiscalPrinter/*`
4. `Pages/Settings/StorageSettings.tsx`

### Company & Branches
5. `Pages/Companies/*`
6. `Pages/Branches/*`

### Users
7. `Pages/Users/Index.tsx`
8. `Pages/Users/Create.tsx`
9. `Pages/Users/Edit.tsx`
10. `Pages/Users/Show.tsx`

### Warehouses
11. `Pages/Warehouses/*`

### Printer Configuration
12. `Pages/PrinterConfigs/*`
13. `Pages/ReceiptTemplates/*`

### Integrations
14. `Pages/Integrations/Index.tsx`
15. `Pages/Integrations/Telegram/Settings.tsx`
16. `Pages/SMS/*`

### Profile
17. `Pages/Profile/Edit.tsx`
18. `Pages/Profile/Partials/*`

### System
19. `Pages/FiscalPrinterJobs/*`
20. `Pages/AuditLogs/*`

---

## 🔑 Translation Keys

Add to `resources/js/i18n/locales/en/settings.json`:

```json
{
  "title": "Settings",
  "general": "General Settings",
  "company": {
    "title": "Company",
    "company_name": "Company Name",
    "address": "Address",
    "phone": "Phone",
    "email": "Email",
    "tax_number": "Tax Number",
    "logo": "Logo"
  },
  "users": {
    "title": "Users",
    "add_user": "Add User",
    "username": "Username",
    "email": "Email",
    "role": "Role",
    "status": "Status",
    "permissions": "Permissions"
  },
  "warehouses": {
    "title": "Warehouses",
    "add_warehouse": "Add Warehouse",
    "warehouse_name": "Warehouse Name",
    "warehouse_type": "Warehouse Type",
    "location": "Location"
  },
  "printers": {
    "title": "Printer Configuration",
    "receipt_printer": "Receipt Printer",
    "fiscal_printer": "Fiscal Printer",
    "test_print": "Test Print",
    "printer_status": "Printer Status"
  },
  "integrations": {
    "title": "Integrations",
    "telegram": "Telegram",
    "sms": "SMS",
    "enabled": "Enabled",
    "disabled": "Disabled",
    "configure": "Configure"
  },
  "profile": {
    "title": "Profile",
    "edit_profile": "Edit Profile",
    "change_password": "Change Password",
    "current_password": "Current Password",
    "new_password": "New Password",
    "confirm_password": "Confirm Password",
    "update_profile": "Update Profile"
  }
}
```

---

## ⚠️ Important Notes

- **User roles** use backend enums (already translated)
- **Warehouse types** may need new translations
- **Profile pages** are critical - test thoroughly
- **Language switcher** itself is in this batch - already done!

---

## ✅ Completion Checklist

- [ ] All 20 settings files translated
- [ ] Company settings work in both languages
- [ ] User management fully translated
- [ ] Profile page fully translated
- [ ] Integrations page translated
- [ ] Updated PROGRESS_TRACKER.md

---

## 🎉 Final Step

After completing this batch:
1. Review ALL batches
2. Test complete user workflows in both languages
3. Create final testing report
4. Mark i18n implementation as **COMPLETE**!

**See:** `TESTING_CHECKLIST.md` for final validation
