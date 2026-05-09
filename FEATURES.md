# EC-POS — New Features Implementation Guide

> All features from the master checklist that were missing are now implemented.
> This document describes what was added, where it lives, and how to use it.

---

## 1. Rate Limiting (Security)

**What:** Prevents brute-force attacks on login and registration.

**Package:** `express-rate-limit` (installed)

**Where:** `backend/routes/userRoutes.js`

**Config:** 20 requests per 15-minute window on `POST /api/users/login` and `POST /api/users` (register). Returns HTTP 429 with a friendly message when exceeded.

---

## 2. Atomic Stock Updates (Data Integrity)

**What:** Eliminates race conditions when two customers buy the last item simultaneously.

**Where:** `backend/controllers/transactionController.js`, `backend/controllers/orderController.js`

**How:** All stock decrements now use MongoDB `$inc` operator via `findByIdAndUpdate` instead of load-modify-save:
```js
await Product.findByIdAndUpdate(id, { $inc: { countInStock: -qty, unitsSold: qty } });
```

---

## 3. Soft Deletes (Audit Trail)

**What:** Deleted products and users are marked `isDeleted: true` rather than removed from the database. Historical sales reports that reference deleted products remain intact.

**Model fields added:**
- `Product`: `isDeleted`, `deletedAt`, `lowStockThreshold` (default 5), `sku`
- `User`: `isDeleted`, `deletedAt`

**All public queries automatically filter** `isDeleted: { $ne: true }`.

**Routes:** `DELETE /api/products/:id` and `DELETE /api/users/:id` now soft-delete.

---

## 4. Activity Log System

**What:** A global audit trail recording who did what, when, from which IP.

**Model:** `backend/models/activityLogModel.js`
```
userId, userName, action, entity, entityId, details, ip, createdAt
```

**Logged events:** LOGIN, LOGOUT, CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, POS_SALE

**API Endpoints:**
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/activity` | admin | Paginated logs (filter by `entity`, `action`) |
| GET | `/api/activity/:entity/:id` | admin | Logs for a specific record |

**Admin UI:** `/admin/activity` — full table with filters, pagination, colour-coded action badges.

**Sidebar:** "Activity Log" link added to the Admin Dashboard sidebar under "Other".

---

## 5. Low Stock Alerts

**What:** Products with stock at or below their threshold trigger alerts.

**Threshold field:** `lowStockThreshold: Number` (default 5) on each Product — configurable per product in the edit form.

**API:**
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products/low-stock` | admin | All products where `countInStock <= lowStockThreshold` |

**Dashboard widget:** Admin Dashboard shows an amber alert card listing all low-stock products with their current stock count, linking directly to each product's edit page.

**Email notification:** When a POS sale brings a product's stock to or below its threshold, an automatic email is sent to `EMAIL_USER` (configured in `.env`).

---

## 6. Cashier Sessions (Register Open/Close)

**What:** Shift management — open the register at the start of a shift with an opening cash count, close it at end of shift to reconcile totals.

**Model:** `backend/models/cashierSessionModel.js`
```
openedBy, openedByName, openedAt, closedAt
openingCash, closingCash
totalCashSales, totalCardSales, totalOnlineSales
totalSalesCount, totalRevenue, notes, status: 'open'|'closed'
```

**API Endpoints:**
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/cashier/open` | staff/admin | Open register `{ openingCash }` |
| PUT | `/api/cashier/close` | staff/admin | Close register `{ closingCash, notes }` — auto-tallies sales |
| GET | `/api/cashier/current` | staff/admin | Current open session (null if none) |
| GET | `/api/cashier` | admin | All sessions history |

**POS UI:** "Open Register" / "Register Open" button in the POS terminal header. Green animated dot when open. Closing shows a summary (total revenue, transaction count).

---

## 7. Barcode / SKU Scanner

**What:** Fast product lookup in the POS via barcode scanner or manual SKU entry.

**Model field:** `sku: String` added to Product. Set via the product edit form.

**API:**
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/products/sku/:sku` | public | Lookup product by SKU |

**POS UI:** A "Scan barcode / enter SKU" input at the top of the POS product area. Barcode scanners (which act as keyboards) type the barcode and press Enter — the product is instantly added to the cart.

---

## 8. Guest Checkout

**What:** Customers can complete a purchase without creating an account.

**Backend changes:**
- `optionalProtect` middleware: sets `req.user = null` if no token, doesn't reject the request
- `POST /api/orders` now uses `optionalProtect` instead of `protect`
- `Order` model: `user` is optional (`required: false`), `guestEmail: String` added
- Order confirmation email sent to `guestEmail` when no logged-in user

**Frontend:** If the user is not logged in on `/checkout`, a blue "Checking out as guest" panel appears asking for their email. A "Sign in" link is shown for faster checkout. The email is passed as `guestEmail` in the order payload.

---

## 9. SEO Meta Tags

**Package:** `react-helmet-async` (installed)

**Setup:** `HelmetProvider` wraps the entire app in `frontend/src/main.jsx`.

**Pages with meta tags:**
| Page | Title | Description |
|---|---|---|
| Home | OrganicPOS — Fresh Organic Products | Shop fresh organic groceries... |
| Shop | Shop — OrganicPOS | Browse our full range... |
| ProductDetails | `{product.name}` — OrganicPOS | `{product.description[:155]}` + OG image |
| CategoryPage | `{category.name}` — OrganicPOS | Shop `{category.name}` at OrganicPOS |

---

## 10. PWA (Progressive Web App)

**Package:** `vite-plugin-pwa` (installed)

**Config:** `frontend/vite.config.js` — VitePWA plugin with:
- App name: OrganicPOS
- Theme color: `#16a34a` (green)
- `registerType: 'autoUpdate'`
- Workbox `NetworkFirst` caching for product API calls (5-minute TTL, max 50 entries)
- Offline fallback via service worker

**Required:** Add `frontend/public/pwa-192x192.png` and `frontend/public/pwa-512x512.png` (192×192 and 512×512 PNG icons) for full PWA install support.

---

## 11. Thermal Receipt Printing (80mm)

**What:** POS receipts are formatted for standard 80mm thermal printers when `window.print()` is called.

**Where:** `frontend/src/pages/admin/AdminPOS.jsx` — `THERMAL_RECEIPT_CSS` constant injected via `<style>`.

**Print CSS:**
```css
@page { size: 80mm auto; margin: 0; }
body * { visibility: hidden; }
.thermal-receipt, .thermal-receipt * { visibility: visible; }
.thermal-receipt { width: 80mm; font-family: 'Courier New', monospace; font-size: 11px; }
```

The receipt modal content div carries the `thermal-receipt` class. Only that div prints.

---

## 12. Offline POS with IndexedDB

**What:** POS sales are queued locally when there's no internet connection and automatically synced when reconnected.

**Utility:** `frontend/src/utils/posOfflineQueue.js`
- Uses native `IndexedDB` API (no external dependency)
- DB name: `pos-offline-db`, store: `pending-sales`
- Exports: `queueSale`, `getPendingSales`, `deletePendingSale`, `clearAllPending`

**POS behaviour:**
- Red banner at top: "You are offline. Sales will be saved locally..." with pending count
- Completing a sale while offline calls `queueSale()` and increments `pendingCount`
- When the browser comes back online, `syncOfflineSales()` auto-runs: replays each queued sale against `POST /api/transactions/pos`, deletes each from IndexedDB on success, alerts with sync count

---

## Environment Variables Required

Add to `backend/.env`:
```env
EMAIL_USER=your@gmail.com     # For low-stock alerts + order confirmations
EMAIL_PASS=your_app_password  # Gmail app password (not account password)
```

---

## Summary of Files Changed / Created

### New Backend Files
| File | Purpose |
|---|---|
| `backend/models/activityLogModel.js` | Activity log schema |
| `backend/models/cashierSessionModel.js` | Cashier shift schema |
| `backend/utils/activityLogger.js` | Non-blocking log helper |
| `backend/controllers/activityController.js` | Activity log API |
| `backend/controllers/cashierController.js` | Register open/close API |
| `backend/routes/activityRoutes.js` | `/api/activity` routes |
| `backend/routes/cashierRoutes.js` | `/api/cashier` routes |

### Modified Backend Files
| File | Change |
|---|---|
| `backend/server.js` | Added activity + cashier routes |
| `backend/routes/userRoutes.js` | Rate limiter on login + register |
| `backend/routes/orderRoutes.js` | `optionalProtect` for guest checkout |
| `backend/routes/productRoutes.js` | `/low-stock`, `/sku/:sku` endpoints |
| `backend/middleware/authMiddleware.js` | Added `optionalProtect` |
| `backend/models/productModel.js` | `isDeleted`, `deletedAt`, `lowStockThreshold`, `sku` |
| `backend/models/userModel.js` | `isDeleted`, `deletedAt` |
| `backend/models/orderModel.js` | `user` optional, `guestEmail` field |
| `backend/controllers/productController.js` | Soft delete, low-stock endpoint, SKU lookup, activity logging |
| `backend/controllers/userController.js` | Soft delete, activity logging |
| `backend/controllers/orderController.js` | Guest checkout support |
| `backend/controllers/transactionController.js` | `$inc` atomic updates, low-stock email, activity logging |
| `backend/utils/sendEmail.js` | Added `sendLowStockAlert` |

### New Frontend Files
| File | Purpose |
|---|---|
| `frontend/src/utils/posOfflineQueue.js` | IndexedDB offline sale queue |
| `frontend/src/pages/admin/ActivityLog.jsx` | Admin activity log page |

### Modified Frontend Files
| File | Change |
|---|---|
| `frontend/src/main.jsx` | `HelmetProvider` wrapper |
| `frontend/vite.config.js` | `VitePWA` plugin |
| `frontend/src/App.jsx` | `/admin/activity` route |
| `frontend/src/pages/admin/AdminDashboard.jsx` | Low stock widget, Activity Log nav link |
| `frontend/src/pages/admin/AdminPOS.jsx` | Barcode scanner, offline detection, cashier sessions, thermal receipt CSS |
| `frontend/src/pages/Checkout.jsx` | Guest checkout UI + `guestEmail` in order payload |
| `frontend/src/pages/Home.jsx` | Helmet meta tags |
| `frontend/src/pages/Shop.jsx` | Helmet meta tags |
| `frontend/src/pages/ProductDetails.jsx` | Helmet meta tags + OG image |
| `frontend/src/pages/CategoryPage.jsx` | Helmet meta tags |
