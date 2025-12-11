## Multitenant System Guidelines

This is a multitenant POS system. Always consider account_id on each database request!

### Database Access Rules
- ALWAYS filter queries by `account_id` using `where('account_id', auth()->user()->account_id)` or `byAccount()` scope
- ALWAYS set `account_id` when creating new records: `'account_id' => auth()->user()->account_id`
- Never use `Model::all()` or `Model::find()` without account filtering
- Super admin role bypasses account filtering for system management

### Authorization Rules
**Use Laravel Gates exclusively for authorization** (defined in `AuthorizationServiceProvider.php`)

In every controller method, call the appropriate gate:
```php
Gate::authorize('access-account-data');        // For viewing data
Gate::authorize('manage-products');            // For creating/editing
Gate::authorize('delete-account-data');        // For deleting
Gate::authorize('access-account-data', $model); // Verify model belongs to user's account
```

Do NOT use RoleBasedAccess middleware - it exists for reference only. Gates are the single source of truth. 


System is multilang structure!