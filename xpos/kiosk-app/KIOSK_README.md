# xPOS Kiosk - Offline-First Point of Sale

A modern, offline-first kiosk POS application built with React, TypeScript, and Electron. Features full offline capability with automatic background synchronization to the xPOS Laravel backend.

## Features

- **100% Offline Sales Capability** - Continue selling even without internet
- **Automatic Background Sync** - Sales sync automatically when connection is restored
- **Direct Fiscal Printer Integration** - Print fiscal receipts without additional bridge software
- **Multi-tenant Support** - Secure account-based isolation
- **Touch-Optimized UI** - Large buttons and touch-friendly interface for kiosk screens
- **Real-time Inventory** - Local SQLite cache of products and customers
- **Customer Loyalty** - Support for loyalty cards and points

## Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **React Router** - Navigation
- **Zustand** - Lightweight state management
- **Tailwind CSS** - Utility-first styling
- **React Hot Toast** - Toast notifications

### Backend (Main Process)
- **Electron** - Desktop app framework
- **better-sqlite3** - Local SQLite database
- **Kysely** - Type-safe SQL query builder
- **Axios** - HTTP client with retry logic

## Project Structure

```
kiosk-app/
├── src/
│   ├── main/                    # Electron main process (to be implemented)
│   │   ├── database/           # SQLite schema and queries
│   │   ├── services/           # Sync, API, Fiscal services
│   │   └── index.ts           # Main entry point
│   │
│   ├── renderer/               # React UI
│   │   ├── pages/
│   │   │   ├── Setup.tsx      # Initial device setup
│   │   │   ├── POS.tsx        # Main sales screen
│   │   │   ├── SyncStatus.tsx # Sync monitoring dashboard
│   │   │   └── Settings.tsx   # App settings
│   │   │
│   │   ├── components/
│   │   │   ├── ProductSearch.tsx     # Product search with barcode
│   │   │   ├── ShoppingCart.tsx      # Cart management
│   │   │   ├── CustomerLookup.tsx    # Customer search
│   │   │   ├── PaymentModal.tsx      # Payment processing
│   │   │   ├── ConnectionStatus.tsx  # Online/offline indicator
│   │   │   └── Navigation.tsx        # App navigation
│   │   │
│   │   └── App.tsx            # Main app component
│   │
│   ├── stores/                 # Zustand state stores
│   │   ├── cart-store.ts      # Shopping cart state
│   │   ├── sync-store.ts      # Sync status state
│   │   └── config-store.ts    # App configuration
│   │
│   ├── types/                  # TypeScript types
│   │   └── index.ts           # Global type definitions
│   │
│   ├── utils/                  # Utilities
│   │   └── mock-ipc.ts        # Mock IPC for development
│   │
│   ├── main.tsx               # React entry point
│   └── index.css              # Global styles
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── KIOSK_README.md
```

## Installation

```bash
# Install dependencies
npm install

# Development mode (web browser with mock data)
npm run dev

# Build for production
npm run build

# Package for Windows
npm run package:win
```

## Development

### Running in Browser (Development)
The app includes mock IPC implementation for browser-based development:

```bash
npm run dev
```

This will start Vite dev server at `http://localhost:3000` with mock data.

### Running in Electron
For full Electron development with actual IPC:

```bash
# Terminal 1: Build main process
npm run dev:main

# Terminal 2: Start renderer with Vite
npm run dev:renderer

# Terminal 3: Start Electron
npm start
```

## Pages & Components

### Pages

1. **Setup Screen** (`/setup`)
   - Token entry form
   - Device registration
   - Initial data sync
   - Error handling

2. **POS Screen** (`/pos`)
   - Product search with barcode scanner support
   - Shopping cart management
   - Customer lookup and selection
   - Payment processing
   - Connection status indicator

3. **Sync Status Screen** (`/sync`)
   - Online/offline status
   - Queued sales count
   - Last sync timestamp
   - Manual sync trigger
   - Sync error display

4. **Settings Screen** (`/settings`)
   - Device information
   - Cache statistics
   - Clear cache option
   - Logout/reset device

### Core Components

1. **ProductSearch** - Search products by name, SKU, or barcode
2. **ShoppingCart** - Manage cart items with quantity controls
3. **CustomerLookup** - Search and select customers
4. **PaymentModal** - Process payments (cash, card, gift card)
5. **ConnectionStatus** - Real-time online/offline indicator
6. **Navigation** - App navigation with sync badge

## State Management

### Cart Store
```typescript
- items: CartItem[]
- customer: Customer | null
- payments: Payment[]
- subtotal, taxAmount, discountAmount, total
- addItem, updateQuantity, removeItem
- setCustomer, addPayment
- clearCart
```

### Sync Store
```typescript
- isOnline: boolean
- lastSyncAt: string | null
- queuedSalesCount: number
- isSyncing: boolean
- syncError: string | null
```

### Config Store
```typescript
- config: AppConfig | null
- isLoading: boolean
- error: string | null
```

## IPC API

The app communicates with Electron main process via IPC:

```typescript
interface IPCApi {
  // Config
  getConfig(): Promise<AppConfig | null>
  saveConfig(config: AppConfig): Promise<void>
  clearConfig(): Promise<void>

  // Products
  searchProducts(query: string): Promise<Product[]>
  getProductByBarcode(barcode: string): Promise<Product | null>
  getAllProducts(): Promise<Product[]>

  // Customers
  searchCustomers(query: string): Promise<Customer[]>
  getCustomerById(id: number): Promise<Customer | null>

  // Sales
  createSale(sale: Sale): Promise<number>
  getQueuedSales(): Promise<Sale[]>

  // Sync
  getSyncStatus(): Promise<SyncStatus>
  triggerSync(): Promise<void>

  // Fiscal
  getFiscalConfig(): Promise<FiscalConfig | null>
  printFiscalReceipt(sale: Sale): Promise<{fiscalNumber, fiscalDocumentId}>

  // Registration
  registerDevice(token, apiUrl, deviceName): Promise<AppConfig>
}
```

## Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Touch-Optimized** - Large buttons (min 44x44px)
- **Responsive** - Works on various screen sizes
- **Professional Design** - Clean, modern interface
- **Accessibility** - High contrast, readable fonts

## Next Steps

### Backend Integration (Main Process)
1. Implement SQLite database layer
2. Create sync service with background worker
3. Implement API client with retry logic
4. Add fiscal printer integration
5. Setup IPC handlers for all endpoints

### Testing
1. Unit tests for stores and components
2. Integration tests for IPC
3. E2E tests for complete flows
4. Offline/online transition tests

### Build & Deployment
1. Setup electron-builder
2. Create Windows installer
3. Add auto-updater
4. Code signing

## License

Proprietary - xPOS System

## Support

For issues and questions, contact the development team.
