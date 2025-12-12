<?php

return [
    // General errors
    'error' => 'Error',
    'unknown' => 'Unknown',

    // Warehouse and branch errors
    'warehouse_not_found' => 'Warehouse not found',
    'warehouse_not_found_stock_cannot_update' => 'Warehouse not found. Stock cannot be updated.',
    'warehouse_not_found_stock_cannot_restore' => 'Warehouse not found. Stock cannot be restored.',
    'branch_not_found' => 'Branch not found',

    // Order errors
    'order_not_found' => 'This order was not found',
    'order_already_exists' => 'Order already exists',

    // Product errors
    'product_not_found' => 'Product not found',
    'product_not_found_identifier' => 'Product not found: :identifier',

    // Module errors
    'shop_module_not_enabled' => 'Online shop module is not enabled',
    'shop_requires_sms' => 'You must configure SMS service first before enabling the online shop',
    'online_orders_not_enabled' => 'Online orders are not enabled. Please enable either the online shop module or a delivery platform integration (Wolt, Yango, or Bolt).',

    // Authentication errors
    'authentication_failed' => 'Authentication failed',
    'platform_integration_not_enabled' => ':platform integration is not enabled for this account',
];
