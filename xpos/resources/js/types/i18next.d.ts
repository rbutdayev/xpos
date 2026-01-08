// TypeScript declarations for i18next - updated 2025-12-12
import 'i18next';

import type common from '../i18n/locales/en/common.json';
import type auth from '../i18n/locales/en/auth.json';
import type products from '../i18n/locales/en/products.json';
import type sales from '../i18n/locales/en/sales.json';
import type customers from '../i18n/locales/en/customers.json';
import type inventory from '../i18n/locales/en/inventory.json';
import type reports from '../i18n/locales/en/reports.json';
import type settings from '../i18n/locales/en/settings.json';
import type dashboard from '../i18n/locales/en/dashboard.json';
import type expenses from '../i18n/locales/en/expenses.json';
import type suppliers from '../i18n/locales/en/suppliers.json';
import type users from '../i18n/locales/en/users.json';
import type profile from '../i18n/locales/en/profile.json';
import type rentals from '../i18n/locales/en/rentals.json';
import type services from '../i18n/locales/en/services.json';
import type integrations from '../i18n/locales/en/integrations.json';
import type giftcards from '../i18n/locales/en/giftcards.json';
import type orders from '../i18n/locales/en/orders.json';
import type knowledge from '../i18n/locales/en/knowledge.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof common;
      auth: typeof auth;
      products: typeof products;
      sales: typeof sales;
      customers: typeof customers;
      inventory: typeof inventory;
      reports: typeof reports;
      settings: typeof settings;
      dashboard: typeof dashboard;
      expenses: typeof expenses;
      suppliers: typeof suppliers;
      users: typeof users;
      profile: typeof profile;
      rentals: typeof rentals;
      services: typeof services;
      integrations: typeof integrations;
      giftcards: typeof giftcards;
      orders: typeof orders;
      knowledge: typeof knowledge;
    };
  }
}
