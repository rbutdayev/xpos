import 'i18next';

import common from '../i18n/locales/en/common.json';
import auth from '../i18n/locales/en/auth.json';
import products from '../i18n/locales/en/products.json';
import sales from '../i18n/locales/en/sales.json';
import customers from '../i18n/locales/en/customers.json';
import inventory from '../i18n/locales/en/inventory.json';
import reports from '../i18n/locales/en/reports.json';
import settings from '../i18n/locales/en/settings.json';
import dashboard from '../i18n/locales/en/dashboard.json';
import expenses from '../i18n/locales/en/expenses.json';
import suppliers from '../i18n/locales/en/suppliers.json';
import users from '../i18n/locales/en/users.json';
import profile from '../i18n/locales/en/profile.json';
import rentals from '../i18n/locales/en/rentals.json';
import services from '../i18n/locales/en/services.json';
import integrations from '../i18n/locales/en/integrations.json';
import giftcards from '../i18n/locales/en/giftcards.json';
import orders from '../i18n/locales/en/orders.json';

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
    };
  }
}
