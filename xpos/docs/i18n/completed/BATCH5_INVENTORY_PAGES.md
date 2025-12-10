# 📦 BATCH 5: Inventory & Warehouse Pages Translation

**Priority:** 🟢 Normal
**Status:** ⏳ Not Started
**Estimated Time:** 3-4 hours

---

## 📋 Files to Translate (20 files)

### Inventory Pages
1. `Pages/Inventory/Index.tsx`
2. `Pages/Inventory/WarehouseInventory.tsx`
3. `Pages/Inventory/Components/InventoryDashboard.tsx`
4. `Pages/Inventory/Components/InventoryActions.tsx`

### Products
5. `Pages/Products/Index.tsx`
6. `Pages/Products/Create.tsx`
7. `Pages/Products/Edit.tsx`
8. `Pages/Products/Show.tsx`
9. `Pages/Products/BulkCreate.tsx`

### Goods Receipts & Stock
10. `Pages/GoodsReceipts/*`
11. `Pages/StockMovements/*`
12. `Pages/WarehouseTransfers/*`

### Suppliers
13. `Pages/Suppliers/Index.tsx`
14. `Pages/Suppliers/Create.tsx`
15. `Pages/Suppliers/Edit.tsx`
16. `Pages/Suppliers/Show.tsx`

### Returns
17. `Pages/ProductReturns/*`

---

## 🔑 Translation Keys

Add to `resources/js/i18n/locales/en/inventory.json`:

```json
{
  "title": "Inventory Management",
  "products": {
    "title": "Products",
    "list": "Product List",
    "add_new": "Add New Product",
    "edit_product": "Edit Product",
    "product_details": "Product Details",
    "bulk_create": "Bulk Create Products",
    "sku": "SKU",
    "barcode": "Barcode",
    "name": "Product Name",
    "category": "Category",
    "price": "Price",
    "cost": "Cost",
    "stock": "Stock",
    "min_stock": "Minimum Stock",
    "description": "Description",
    "images": "Images",
    "variants": "Variants"
  },
  "stock": {
    "in_stock": "In Stock",
    "out_of_stock": "Out of Stock",
    "low_stock": "Low Stock",
    "stock_level": "Stock Level",
    "stock_movements": "Stock Movements",
    "adjust_stock": "Adjust Stock",
    "transfer_stock": "Transfer Stock"
  },
  "warehouse": {
    "title": "Warehouse",
    "select_warehouse": "Select Warehouse",
    "warehouse_inventory": "Warehouse Inventory",
    "transfer": "Transfer",
    "from_warehouse": "From Warehouse",
    "to_warehouse": "To Warehouse"
  },
  "goods_receipt": {
    "title": "Goods Receipt",
    "new_receipt": "New Receipt",
    "receipt_number": "Receipt #",
    "supplier": "Supplier",
    "received_date": "Received Date",
    "items": "Items",
    "total_cost": "Total Cost"
  },
  "supplier": {
    "title": "Suppliers",
    "supplier_name": "Supplier Name",
    "contact_person": "Contact Person",
    "phone": "Phone",
    "email": "Email",
    "address": "Address",
    "balance": "Balance"
  }
}
```

---

## ✅ Completion Checklist

- [ ] All 20 inventory files translated
- [ ] Translation keys added to `inventory.json`
- [ ] Tested product CRUD operations
- [ ] Tested goods receipts
- [ ] Tested stock transfers
- [ ] Updated PROGRESS_TRACKER.md

**Next:** BATCH 6: Financial & Reports Pages
