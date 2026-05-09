# CLAUDE.md — EC-POS Project Reference

> Hand this file to a new Claude session to immediately understand the full project context.

---

## Project Overview

**Name:** EC-POS (Ecommerce + Point-of-Sale System)
**Type:** Full-stack MERN application
**Purpose:** Dual-mode platform — online store for customers + in-store POS terminal for staff/admin
**Domain:** Organic/grocery products

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB (local: `mongodb://127.0.0.1:27017/POSDash`) |
| Auth | JWT (HTTP-only cookies, 30-day expiry) |
| Payments | Stripe (React + JS SDK) |
| Icons | Lucide React |
| HTTP Client | Axios (with `withCredentials: true`) |
| Images | Cloudinary (wired, with local fallback to `frontend/public/uploads/`) |
| File Uploads | Multer |
| Exchange Rates | open.er-api.com (free, no key) |
| Weather | open-meteo.com (free, no key) |
| Location | ipwho.is (free, CORS-open IP geolocation) |
| Email | nodemailer + Gmail (needs EMAIL_USER/EMAIL_PASS in .env) |
| Charts | recharts |
| Rate Limiting | express-rate-limit |
| SEO | react-helmet-async |
| PWA | vite-plugin-pwa |

---

## Running the Project

```bash
# Backend (port 5000)
cd backend && npm start

# Frontend (port 5173)
cd frontend && npm run dev

# Seed database (run once, needs at least 1 user in DB)
cd backend && node seeder.js
```

**Frontend:** http://localhost:5173  
**Backend API:** http://localhost:5000

---

## Directory Structure

```
ecommerce-pos-system/
├── CLAUDE.md               ← this file
├── progress.md             ← feature progress tracker
├── frontend/
│   ├── src/
│   │   ├── App.jsx         ← all routes defined here
│   │   ├── main.jsx        ← AuthProvider + CurrencyProvider + CartProvider + HelmetProvider
│   │   ├── components/
│   │   │   ├── Navbar.jsx          ← search, location flag, currency switcher, cart badge
│   │   │   ├── InfoBar.jsx         ← news ticker / weather / exchange rates (5s rotation)
│   │   │   ├── ProductCard.jsx     ← image, stock badge, ratings, units sold, favorites
│   │   │   ├── CartDrawer.jsx      ← slide-in cart drawer with related products strip
│   │   │   ├── SectionHeader.jsx
│   │   │   ├── FeatureBox.jsx
│   │   │   └── BlogCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx     ← login/register/logout + setUserFromData (post-OTP)
│   │   │   ├── CartContext.jsx     ← cart state + CartDrawer open/close
│   │   │   └── CurrencyContext.jsx ← PKR base currency, live rates, format()
│   │   ├── layouts/
│   │   │   ├── MainLayout.jsx      ← Navbar + InfoBar + CartDrawer
│   │   │   └── AdminLayout.jsx     ← auth guard → /admin/login if unauthenticated
│   │   ├── utils/
│   │   │   └── posOfflineQueue.js  ← IndexedDB queue for offline POS sales
│   │   └── pages/
│   │       ├── admin/
│   │       │   ├── AdminDashboard.jsx    ← charts, stats, sidebar nav, message beep
│   │       │   ├── AdminLogin.jsx        ← split-panel portal login (OTP + set-password)
│   │       │   ├── AdminPOS.jsx          ← POS terminal (barcode, offline queue, cashier)
│   │       │   ├── AdminOrderView.jsx    ← order detail + status stepper
│   │       │   ├── ActivityLog.jsx       ← audit trail with filters
│   │       │   ├── CategoryManage.jsx    ← 3-level category CRUD
│   │       │   ├── ComboManage.jsx       ← bundle deals CRUD
│   │       │   ├── CustomerView.jsx      ← customer detail (orders, POS sales, notes)
│   │       │   ├── Messages.jsx          ← two-panel admin messenger
│   │       │   ├── OrderList.jsx         ← order management with filters
│   │       │   ├── POSPeople.jsx         ← Customer + Vendor tabs (edit restriction for online users)
│   │       │   ├── ProductEdit.jsx       ← WordPress-style product editor
│   │       │   ├── ProductList.jsx       ← product list with bulk delete
│   │       │   ├── PurchaseLedger.jsx    ← vendor purchase recording
│   │       │   ├── ReturnsManage.jsx     ← sale/purchase returns
│   │       │   ├── ReviewsManage.jsx     ← all product reviews + admin delete
│   │       │   ├── StaffManage.jsx       ← staff creation + permissions (shows admins too)
│   │       │   ├── StaffView.jsx         ← staff detail + POS history
│   │       │   ├── UserEdit.jsx          ← edit user (role radio + permissions checklist)
│   │       │   ├── UserList.jsx          ← user list + inline staff toggle
│   │       │   ├── VendorView.jsx        ← vendor detail + purchase history + notes
│   │       │   ├── VoucherManage.jsx     ← voucher create/manage
│   │       │   └── WalletRequests.jsx    ← approve/reject wallet top-up requests
│   │       ├── staff/
│   │       │   └── StaffDashboard.jsx    ← staff POS stats + recent sales
│   │       ├── games/
│   │       │   ├── FlappyBird.jsx        ← canvas game (onGameStateChange callback)
│   │       │   └── CarRacing.jsx         ← top-down traffic dodge game
│   │       ├── AppDownload.jsx
│   │       ├── Cart.jsx
│   │       ├── Categories.jsx            ← all-categories grid with sub-chips
│   │       ├── CategoryPage.jsx
│   │       ├── Checkout.jsx              ← guest checkout, saved address auto-fill
│   │       ├── Compare.jsx               ← side-by-side product comparison (max 3)
│   │       ├── Contact.jsx               ← guest info cards / logged-in live chat
│   │       ├── GamesPage.jsx             ← game selector + 60min wallet reward timer
│   │       ├── Home.jsx                  ← Snoonu-style landing page
│   │       ├── Login.jsx                 ← 6-mode auth (login/register/verify/forgot/reset/setpassword)
│   │       ├── Order.jsx                 ← tracking timeline + bank payment routing
│   │       ├── PaymentInfo.jsx
│   │       ├── ProductDetails.jsx        ← multi-image zoom, variations, reviews, out-of-stock guard
│   │       ├── Profile.jsx               ← wallet, orders, favorites, rewards, saved address
│   │       ├── ReturnsPolicy.jsx
│   │       ├── Shop.jsx                  ← hierarchical filter, price range, sort, pagination
│   │       ├── ShippingInfo.jsx          ← dedicated shipping address form
│   │       └── TagPage.jsx               ← tag-filtered product page
│   ├── vite.config.js                    ← VitePWA plugin configured
│   ├── tailwind.config.js
│   └── package.json
└── backend/
    ├── server.js
    ├── config/db.js
    ├── middleware/
    │   └── authMiddleware.js             ← protect, admin, staff, optionalProtect
    ├── utils/
    │   ├── generateToken.js
    │   ├── sendEmail.js                  ← nodemailer Gmail, OTP + order email templates
    │   └── activityLogger.js            ← non-blocking logActivity() helper
    ├── models/
    │   ├── userModel.js
    │   ├── productModel.js
    │   ├── orderModel.js
    │   ├── categoryModel.js
    │   ├── voucherModel.js
    │   ├── transactionModel.js           ← PosSale, Purchase, Return
    │   ├── peopleModel.js                ← Customer, Vendor (with notes[])
    │   ├── walletRequestModel.js
    │   ├── activityLogModel.js
    │   ├── cashierSessionModel.js
    │   ├── comboModel.js
    │   ├── conversationModel.js
    │   └── messageModel.js
    ├── controllers/
    │   ├── userController.js
    │   ├── productController.js
    │   ├── orderController.js
    │   ├── categoryController.js
    │   ├── voucherController.js
    │   ├── transactionController.js
    │   ├── peopleController.js
    │   ├── stripeController.js
    │   ├── walletRequestController.js
    │   ├── activityController.js
    │   ├── cashierController.js
    │   ├── comboController.js
    │   └── messageController.js
    ├── routes/
    │   ├── userRoutes.js
    │   ├── productRoutes.js
    │   ├── orderRoutes.js
    │   ├── categoryRoutes.js
    │   ├── voucherRoutes.js
    │   ├── transactionRoutes.js
    │   ├── peopleRoutes.js
    │   ├── stripeRoutes.js
    │   ├── uploadRoutes.js               ← /api/upload (product), /api/upload/avatar
    │   ├── walletRoutes.js
    │   ├── activityRoutes.js
    │   ├── cashierRoutes.js
    │   ├── comboRoutes.js
    │   └── messageRoutes.js
    ├── data/
    │   ├── products.js                   ← 20 seeded products (2 per category)
    │   └── categories.js                 ← 10 seeded categories with subcategories
    ├── seeder.js
    └── .env
```

---

## Backend .env Variables

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/POSDash
JWT_SECRET=super_secret_key_123
NODE_ENV=development
STRIPE_SECRET_KEY=sk_test_<your_secret_key>
CLOUDINARY_CLOUD_NAME=<cloud_name>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

> **Note:** `STRIPE_SECRET_KEY` must be the secret key (`sk_test_...`), not the publishable key.  
> `EMAIL_USER` / `EMAIL_PASS` are required for OTP emails and order notifications.  
> Cloudinary is optional — falls back to local `frontend/public/uploads/`.

---

## Database Models

### User (`userModel.js`)
```
name, email, password (bcrypt), role: 'user'|'admin'|'staff'
walletBalance: Number (default 0)
bonusPoints: Number (default 0)
totalSpent: Number
phone: String
favorites: [Product ref]
usedVouchers: [String]
country, countryCode, preferredCurrency
profilePicture: String (Cloudinary URL or /uploads/avatars/filename)
bankAccounts: [{ bankName, accountTitle, accountNumber, iban, logo, isDefault }]
permissions: [String]  — staff feature access list
otp: String            — current OTP (plain text, short-lived)
otpExpiry: Date        — 2-minute expiry
isVerified: Boolean    — default true (existing users); false for new registrations
mustChangePassword: Boolean — true for admin-created staff (forced first-login change)
savedAddress: { fullName, addressLine1, addressLine2, city, state, postalCode, country, phone }
isDeleted: Boolean, deletedAt: Date  — soft delete
```

### Product (`productModel.js`)
```
name, slug (auto-generated, unique sparse index)
image (legacy), images: [String] (multiple)
brand, category, subcategory, subSubcategory
description, detailedDescription
price (piece), oldPrice, costPrice, boxPrice, boxContents, unitType: 'piece'|'box'|'both'
gstApplicable, gstRate
variations: [{ name, price, stock }]
featureTags: [String]  — 'organic'|'bestseller'|'new'|'hot'|'featured'|'sale'
dealEndsAt: Date
countInStock, lowStockThreshold (default 5), unitsSold, savedByCount
sku: String
reviews: [{ name, rating, comment, user ref, helpful, createdAt }]
rating, numReviews
deliveryCharge, freeDeliveryThreshold
status: 'draft'|'published'|'out_of_stock' (default: 'draft')
isVisible: Boolean (default: true)
discountPercent: Number (default: 0)
relatedProducts: [Product ref]
isDeleted: Boolean, deletedAt: Date  — soft delete
```

### Category (`categoryModel.js`)
```
name, slug, description, image, icon, color, sortOrder, isActive
subcategories: [{ name, slug, image, subSubcategories: [{ name, slug }] }]
```

### Voucher (`voucherModel.js`)
```
code, description
discountType: 'percentage'|'fixed', discountValue
minOrderValue, maxDiscountAmount, maxUses, usedCount
usedBy: [User ref], expiresAt, isActive
```

### Order (`orderModel.js`)
```
user ref (optional — guest checkout supported), guestEmail: String
orderItems[], shippingAddress, paymentMethod
itemsPrice, shippingPrice, totalPrice
isPaid, paidAt, isDelivered, deliveredAt
isCancelled: Boolean
orderStatus: 'pending'|'processing'|'shipped'|'delivered'|'cancelled'
```

### Transaction (`transactionModel.js`)
```
PosSale:  products[{product, qty, price, name}], customer ref, totalAmount, discount
          paymentMethod: Cash|Card|Online|JazzCash|Easypaisa|NayaPay|SadaPay
          servedBy: User ref
Purchase: vendor ref, items[{product, qty, costPrice}], totalCost
Return:   type: 'sale_return'|'purchase_return', referenceId, items[]
```

### People (`peopleModel.js`)
```
Customer: name, phone, email, address, totalSpent
          notes: [{ text, addedBy, createdAt }]
Vendor:   name, company, phone, email, address
          notes: [{ text, addedBy, createdAt }]
```

### WalletRequest (`walletRequestModel.js`)
```
user ref, amount, transactionRef, bankName
status: 'pending'|'approved'|'rejected' (default: 'pending')
adminNote: String
```

### ActivityLog (`activityLogModel.js`)
```
userId, userName, action, entity, entityId, ip, createdAt
```

### CashierSession (`cashierSessionModel.js`)
```
openedBy: User ref, closedBy, openedAt, closedAt
openingFloat, closingFloat, totalSales, totalRevenue
```

### Combo (`comboModel.js`)
```
name, description, image
products: [{ product ref, qty }]
combinedPrice, isActive
```

### Conversation (`conversationModel.js`)
```
user: User ref (unique — one conversation per customer)
lastMessage: String, lastMessageAt: Date
userUnread: Number, adminUnread: Number
```

### Message (`messageModel.js`)
```
conversation: Conversation ref (indexed)
sender: User ref, senderRole: 'user'|'admin'|'staff'
text: String, isDeleted: Boolean (soft delete)
```

---

## API Endpoints

### Users — `/api/users`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | public | Register → `{ pendingVerification: true, email }` + OTP email |
| POST | `/login` | public | Login (403 + `EMAIL_NOT_VERIFIED` if unverified) |
| POST | `/logout` | public | Clear JWT cookie |
| POST | `/verify-otp` | public | Verify OTP → returns JWT + `mustChangePassword` flag |
| POST | `/resend-otp` | public | Resend OTP (`type: 'verify'` or `'forgot'`) |
| POST | `/forgot-password` | public | Send password reset OTP (generic success) |
| POST | `/reset-password` | public | Reset password with OTP |
| POST | `/staff` | admin | Create staff account → sends OTP welcome email |
| POST | `/set-password` | user | Forced first-login password change (clears `mustChangePassword`) |
| GET | `/profile` | user | Own profile + favorites |
| PUT | `/profile/picture` | user | Update profile picture URL |
| GET | `/favorites` | user | Saved products |
| GET | `/merchant/banks` | user | Admin's bank accounts (shown to users in wallet top-up) |
| POST | `/merchant/banks` | admin | Add merchant bank account |
| DELETE | `/merchant/banks/:idx` | admin | Delete merchant bank account |
| POST | `/wallet/topup` | user | Top up wallet |
| POST | `/wallet/deduct` | user | Deduct from wallet |
| POST | `/bonus` | user | Add bonus points |
| POST | `/bonus/redeem` | user | Redeem points → wallet |
| PUT | `/currency` | user | Update preferred currency |
| PUT | `/location` | user | Update country/code |
| GET | `/address` | user | Get saved shipping address |
| PUT | `/address` | user | Update saved shipping address |
| GET | `/` | admin | All users (supports `?roles=staff,admin` filter) |
| GET | `/:id` | admin | Get user by ID |
| PUT | `/:id` | admin | Update user (name, email, role, permissions, phone, savedAddress) |
| DELETE | `/:id` | admin | Soft delete user |

### Products — `/api/products`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | public | All products (search/filter/sort/paginate) — `?showAll=1` for admin |
| POST | `/` | admin | Create product (slug auto-generated) |
| GET | `/brands` | public | Distinct brand list |
| GET | `/reviews` | admin | All reviews across all products (newest first) |
| GET | `/slug/:slug` | public | Product by slug |
| GET | `/low-stock` | admin | Products below `lowStockThreshold` |
| GET | `/sku/:sku` | public | Product by SKU |
| GET | `/:id` | public | Product by ID |
| PUT | `/:id` | admin | Update product |
| DELETE | `/:id` | admin | Soft delete product |
| GET | `/:id/related` | public | Related products (same category) |
| POST | `/:id/reviews` | user | Add review (one per user per product) |
| DELETE | `/:id/reviews/:reviewId` | admin | Delete a review + recalculate product rating |
| PUT | `/:id/favorite` | user | Toggle save/unsave |

**GET /api/products query params:**  
`search`, `category`, `subcategory`, `subSubcategory`, `brand`, `minPrice`, `maxPrice`, `tag`, `sort` (newest|price_asc|price_desc|rating|popular), `page`, `pageSize`, `showAll`

### Categories — `/api/categories`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | public | All active categories |
| GET | `/slug/:slug` | public | Category by slug |
| POST | `/` | admin | Create category |
| PUT | `/:id` | admin | Update category |
| DELETE | `/:id` | admin | Delete category |

### Vouchers — `/api/vouchers`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | All vouchers |
| POST | `/` | admin | Create voucher |
| DELETE | `/:id` | admin | Delete voucher |
| POST | `/validate` | user | Validate code + return discount |
| POST | `/apply` | user | Mark voucher used by current user |

### Orders — `/api/orders`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | optional | Create order (guest or logged-in) |
| GET | `/` | admin | All orders (filter: search, status, from, to) |
| GET | `/myorders` | user | User's own orders |
| GET | `/stats/revenue` | admin | Revenue per day (`?days=7`) |
| PUT | `/:id/pay` | user | Mark paid via Stripe |
| PUT | `/:id/pay-admin` | admin | Manual mark paid (no Stripe) |
| PUT | `/:id/deliver` | admin | Mark delivered |
| PUT | `/:id/status` | admin | Advance orderStatus enum |
| PUT | `/:id/cancel` | user/admin | Cancel unpaid order |

### Stripe — `/api/stripe`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/create-payment-intent` | user | Create Stripe PaymentIntent |
| POST | `/webhook` | public | Stripe webhook (marks order paid on `payment_intent.succeeded`) |

### Uploads — `/api/upload`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | admin | Upload product image → Cloudinary or local fallback |
| POST | `/avatar` | user | Upload profile picture → Cloudinary or local fallback |

### Wallet Requests — `/api/wallet`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/` | user | Submit top-up request (amount, transactionRef, bankName) |
| GET | `/mine` | user | Own request history (last 20) |
| GET | `/` | admin | All requests (`?status=pending\|approved\|rejected`) |
| PUT | `/:id/approve` | admin | Approve + credit wallet immediately |
| PUT | `/:id/reject` | admin | Reject with admin note |

### POS Transactions — `/api/transactions`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/pos` | admin | Create POS sale (atomic stock decrement, unitsSold++) |
| GET | `/pos` | admin | All POS sales (filter by date, customer, servedBy) |
| GET | `/pos/stats` | admin | Today + all-time revenue/count + payment breakdown |
| POST | `/purchases` | admin | Record vendor purchase (stock increment, costPrice update) |
| GET | `/purchases` | admin | Purchase history (filter by vendor) |
| POST | `/return` | admin | Create return (restocks on sale_return) |

### People — `/api/people`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET/POST | `/customers` | admin | List (search) + create POS customer |
| GET | `/customers/:id` | admin | Customer detail |
| PUT/DELETE | `/customers/:id` | admin | Update/delete POS customer |
| POST | `/customers/:id/notes` | admin | Add note to customer |
| DELETE | `/customers/:id/notes/:noteId` | admin | Delete customer note |
| GET/POST | `/vendors` | admin | List (search) + create vendor |
| GET | `/vendors/:id` | admin | Vendor detail |
| PUT/DELETE | `/vendors/:id` | admin | Update/delete vendor |
| POST | `/vendors/:id/notes` | admin | Add note to vendor |
| DELETE | `/vendors/:id/notes/:noteId` | admin | Delete vendor note |

### Messages — `/api/messages`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/conversations` | user | Get or create own support conversation |
| GET | `/conversations` | admin | All conversations (sorted by lastMessageAt desc) |
| GET | `/conversations/:id` | user/admin | Messages for conversation; marks read for caller |
| POST | `/conversations/:id` | user/admin | Send message; increments other party's unread |
| DELETE | `/:id` | user/admin | Soft-delete message (sender or admin only) |

### Activity Log — `/api/activity`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | admin | Paginated activity log (filter: user, action, entity) |
| GET | `/:entity/:id` | admin | Activity for a specific entity |

### Cashier Sessions — `/api/cashier`
| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/open` | admin/staff | Open register with opening float |
| PUT | `/close` | admin/staff | Close register (auto-tallies from PosSales) |
| GET | `/current` | admin/staff | Current open session |
| GET | `/` | admin | All sessions |

### Combos — `/api/combos`
| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/` | public | All active combos (with product population) |
| POST | `/` | admin | Create combo |
| PUT | `/:id` | admin | Update combo |
| DELETE | `/:id` | admin | Delete combo |

---

## Frontend Pages & Routes

| Route | File | Description |
|---|---|---|
| `/` | `Home.jsx` | Snoonu-style landing: category grid, tabs, deals, combos, recently viewed |
| `/shop` | `Shop.jsx` | Catalog: hierarchical filter, price range, sort, grid/list, pagination |
| `/product/:slug` | `ProductDetails.jsx` | Multi-image zoom, variations, GST, countdown, reviews, out-of-stock guard |
| `/cart` | `Cart.jsx` | Shopping cart with currency-aware prices |
| `/checkout` | `Checkout.jsx` | Guest checkout, saved address auto-fill, 8 payment methods, voucher |
| `/login` | `Login.jsx` | 6-mode: login / register / verify-OTP / forgot / reset / set-password |
| `/profile` | `Profile.jsx` | Wallet, orders, favorites, rewards, saved address, bank accounts |
| `/order/:id` | `Order.jsx` | Tracking timeline, bank payment routing, call support |
| `/profile/shipping` | `ShippingInfo.jsx` | Dedicated shipping address form |
| `/category/:slug` | `CategoryPage.jsx` | Category hero, subcategory pills, sort, product grid |
| `/categories` | `Categories.jsx` | All categories grid with sub-chips |
| `/tag/:tag` | `TagPage.jsx` | Tag-filtered product page with sort + pagination |
| `/games` | `GamesPage.jsx` | Flappy Bird + Car Racing, 60-min session → 10 wallet units |
| `/compare` | `Compare.jsx` | Side-by-side comparison (max 3 products), best-value highlight |
| `/contact` | `Contact.jsx` | Guest: info cards; logged-in: live chat with polling |
| `/app` | `AppDownload.jsx` | App download hero + features + reviews |
| `/payment-info` | `PaymentInfo.jsx` | Payment info page |
| `/returns-policy` | `ReturnsPolicy.jsx` | Returns policy page |
| `/favorites` | redirects to `/profile` | |
| `/admin/login` | `AdminLogin.jsx` | Split-panel portal login; OTP + set-password flows; redirects admin/staff |
| `/admin` | `AdminDashboard.jsx` | Stats, charts, low-stock alerts, sidebar, message beep notifications |
| `/admin/pos` | `AdminPOS.jsx` | POS terminal: barcode scanner, offline queue, cashier sessions, thermal receipt |
| `/admin/pos-people` | `POSPeople.jsx` | Customers tab (POS edit + online edit name/phone/address only) + Vendors tab |
| `/admin/productlist` | `ProductList.jsx` | Product list with filters + bulk delete |
| `/admin/product/:id/edit` | `ProductEdit.jsx` | WordPress-style editor: 10 sections, cascading category dropdowns |
| `/admin/categories` | `CategoryManage.jsx` | 3-level hierarchical category CRUD |
| `/admin/vouchers` | `VoucherManage.jsx` | Voucher create/list/delete |
| `/admin/combos` | `ComboManage.jsx` | Bundle deal CRUD with product picker |
| `/admin/orderlist` | `OrderList.jsx` | Order list with search, status, date filters |
| `/admin/order/:id` | `AdminOrderView.jsx` | Order detail + status stepper + Advance Status buttons |
| `/admin/userlist` | `UserList.jsx` | User list with avatar + inline staff toggle |
| `/admin/user/:id/edit` | `UserEdit.jsx` | Edit user: role radio + staff permissions checklist |
| `/admin/staff-manage` | `StaffManage.jsx` | Staff creation + permissions; shows admins (purple badge) + staff |
| `/admin/staff/:id` | `StaffView.jsx` | Staff detail: profile, POS stats, sales history |
| `/admin/purchase-ledger` | `PurchaseLedger.jsx` | Record vendor purchases, stock auto-increment, stock overview |
| `/admin/returns` | `ReturnsManage.jsx` | Sale/purchase returns, sale return restocks |
| `/admin/customer/:id` | `CustomerView.jsx` | Customer detail: stats, online orders, POS sales, notes |
| `/admin/vendor/:id` | `VendorView.jsx` | Vendor detail: stats, purchase history, notes |
| `/admin/wallet-requests` | `WalletRequests.jsx` | Approve/reject wallet top-up requests |
| `/admin/reviews` | `ReviewsManage.jsx` | All product reviews: stats, rating breakdown, search/filter, admin delete |
| `/admin/messages` | `Messages.jsx` | Two-panel messenger: conversation list + full chat |
| `/admin/activity` | `ActivityLog.jsx` | Audit trail with filters + pagination |
| `/staff` | `StaffDashboard.jsx` | Staff: POS stats, quick links, recent POS + online orders |

---

## Key Features Implemented

### Authentication & Staff Flow
- JWT HTTP-only cookie auth (30-day expiry)
- OTP email verification on registration (6-digit, 2-min TTL)
- Forgot password via OTP
- Admin-created staff: `mustChangePassword` flag forces password set on first login
- Staff first-login flow: OTP verify → Set Password → Dashboard
- Admin/Staff portal login at `/admin/login` (separate from customer login)
- AdminLayout auth guard: unauthenticated → `/admin/login`

### Product System
- Multiple images, hover zoom, slug-based URLs
- Piece / box / both pricing, GST breakdown
- Variations (name + price + stock)
- Feature tags, deal countdown timer
- Related products, delivery charge, free threshold
- Product status: draft / published / out_of_stock
- Soft delete, SKU field, costPrice (set by purchases)
- Out-of-stock blocks Add to Cart + Buy Now buttons

### Reviews & Comments
- Users post one review per product (star rating + comment)
- Admin can view all reviews at `/admin/reviews`
- Stats: total, average rating, 5-star count, poor review count, rating distribution bar
- Search by reviewer, product, or comment text
- Filter by star rating (1–5), sort by newest/oldest/rating
- Admin delete with confirmation modal → recalculates product rating + count

### Shop / Filters
- Hierarchical category filter (3 levels), brand checkboxes
- Dynamic price range slider, tag filter
- Sort: newest, price asc/desc, rating, popular
- Grid/list toggle, URL param sync, pagination (pageSize=12)

### POS System
- Barcode/SKU scanner input
- Offline mode: IndexedDB queue, auto-sync on reconnect
- Cashier open/close register sessions
- 7 payment methods, discount field, customer selector
- Stock decrement + unitsSold increment (atomic `$inc`)
- Low-stock email notification after each sale
- Thermal 80mm receipt CSS (`@media print`)
- Receipt modal + `window.print()`

### Admin Dashboard
- Stat cards, 7-day revenue line chart, channel performance gauge
- POS payment method bar chart, top-3 products bar chart
- Low-stock alert widget → edit links
- Message unread badge on sidebar Messages link
- **Beep notifications**: double beep on new unread messages; single beep reminder every 60s while unread > 0 (Web Audio API, no external file)

### Currency System
- **PKR is the base** — all prices stored as PKR
- `CurrencyContext.format(pkrAmount)` converts to selected currency
- Supported: PKR, USD, EUR, GBP, AED, SAR
- Live rates from open.er-api.com (30-min refresh), static fallback
- Persisted in localStorage

### User Wallet & Rewards
- Wallet top/deduct, bonus points earn/redeem
- Top-up via bank transfer request → admin approve/reject flow
- Voucher/coupon codes at checkout
- 60 minutes of gameplay → 10 PKR credited to wallet

### POSPeople Edit Restriction
- POS customers (local): full edit (name/phone/email/address)
- Online customers (User model): edit name/phone/address only — email is read-only, no role-change
- Save online customer edits via `PUT /api/users/:id` (only sends name/phone/savedAddress)

### Messaging
- Customer live chat at `/contact` (4s polling, optimistic send)
- Admin two-panel messenger at `/admin/messages` (10s conv poll, 3s message poll)
- Unread counter badges, soft delete, deterministic avatars

---

## OTP Auth Flow

- Register → `{ pendingVerification: true }` — no JWT yet, OTP sent
- Login unverified → 403 `EMAIL_NOT_VERIFIED` → frontend auto-resends OTP + shows verify screen
- `POST /verify-otp` → validates OTP + expiry → marks isVerified → returns JWT + `mustChangePassword`
- If `mustChangePassword`: frontend shows set-password screen → `POST /set-password` → navigate to dashboard
- `isVerified: true` default makes all existing DB users migration-safe

## Staff Permissions

Stored as `user.permissions: [String]`. Keys:
- `pos_sales` — POS terminal
- `view_orders` — view orders
- `manage_products` — edit products/stock
- `view_reports` — stats/reports
- `manage_customers` — customer + vendor management
- `manage_inventory` — purchases + returns

Managed in `UserEdit.jsx` (checklist shown when role = 'staff') and `StaffManage.jsx` (on creation).

## Coding Conventions

- **Backend:** MVC — models → controllers → routes → server.js
- **Frontend:** Functional components + hooks + Context API
- **Styling:** Tailwind utility classes throughout
- **Error handling:** `express-async-handler` on all async controllers
- **Passwords:** bcrypt pre-save mongoose hook (async, no `next` param)
- **Soft delete:** `isDeleted + deletedAt` on User and Product (never hard-deleted)
- **Stock updates:** MongoDB `$inc` operator (atomic) in transactionController
- **IDs:** MongoDB `_id` used directly; product links use `slug || _id`

---

## Config-Only Items (code is wired, just needs .env)

| Feature | Required .env keys |
|---|---|
| OTP + order emails | `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password) |
| Cloudinary image upload | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Stripe payments | `STRIPE_SECRET_KEY` (must be `sk_test_...`, not `pk_test_...`) |

---

## Current Branch Info

- Main branch: `main`
- Active feature branch: `Stripe/add`

---

## Session Notes

- Update CLAUDE.md and progress.md after every prompt
- Analyze existing code before adding features
- User wants full implementations, not stubs
