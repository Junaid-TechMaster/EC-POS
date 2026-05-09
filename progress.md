# EC-POS — Progress & Feature Tracker

> Updated after every session. Use alongside CLAUDE.md to resume work instantly.

---

## Last Updated: 2026-05-05 (Session 20)

---

## Completed Features

### Core E-commerce
- [x] User registration + login (JWT, HTTP-only cookies)
- [x] Role-based access: user, admin, staff
- [x] Product CRUD (admin)
- [x] Shopping cart (localStorage persistence)
- [x] Checkout flow with shipping address
- [x] Stripe payment integration (CardElement + PaymentIntent)
- [x] Order creation and tracking
- [x] Order history (user's own orders)
- [x] Admin order/user management

### Enhanced Product System (Session 2)
- [x] Multiple product images array (`images[]`)
- [x] Hover zoom on product detail page (CSS transform origin)
- [x] Product sold as piece / box / both with separate pricing
- [x] GST / tax rate field + breakdown on product page
- [x] Product variations (name + price, selectable)
- [x] Feature tags (organic, bestseller, new, sale, hot, featured)
- [x] Deal countdown timer (dealEndsAt field + useCountdown hook)
- [x] Related products section (same category, backend endpoint)
- [x] Delivery charge + free delivery threshold display
- [x] Units sold + saved-by-count metrics on cards
- [x] Review submission form with star selector (logged-in users only)
- [x] Buy Now button (add to cart + navigate to checkout)

### Category System (Session 2)
- [x] Category model: name, slug, icon, color, description
- [x] Subcategory + sub-subcategory hierarchy in model
- [x] Category CRUD API (`/api/categories`)
- [x] CategoryPage.jsx — hero banner, subcategory tabs, product grid
- [x] Hierarchical filter panel in Shop.jsx (expand/collapse)

### Filter & Search (Session 2)
- [x] Backend search: name, description, brand (regex)
- [x] Filter by category, subcategory, brand, price range, tag
- [x] Sort: newest, price asc/desc, rating, popular
- [x] Dynamic price range (min/max from real product data)
- [x] Grid / list view toggle in Shop
- [x] URL search param sync (`?search=`, `?category=`)

### User Wallet & Rewards (Session 2)
- [x] Wallet balance field on User model
- [x] Top-up wallet API + UI in Profile
- [x] Bonus points field + accumulate API
- [x] Redeem bonus points → wallet (1 pt = 1 unit)
- [x] Voucher model: percentage/fixed, expiry, max uses, per-user limit
- [x] Voucher validate + apply API
- [x] Profile redesigned: tabs for Profile / Wallet / Orders / Favorites / Rewards

### Favorites / Wishlist (Session 2)
- [x] favorites[] field on User model
- [x] Toggle favorite API (`PUT /api/products/:id/favorite`)
- [x] savedByCount increments/decrements on product
- [x] Heart button on ProductCard with auth check
- [x] Saved Items tab in Profile

### Navbar & InfoBar (Session 2)
- [x] Full Navbar.jsx built (was empty before)
- [x] IP-based location detection (ipapi.co) + country flag
- [x] Currency switcher dropdown (USD, PKR, EUR, GBP, AED, SAR)
- [x] Search bar → navigates to /shop?search=
- [x] User dropdown with role-aware links, wallet balance
- [x] InfoBar.jsx: news ticker (5s rotation), weather, exchange rates
- [x] MainLayout updated to use Navbar + InfoBar

### Currency System (Session 2)
- [x] CurrencyContext: live rates (open.er-api.com), 30-min refresh
- [x] Fallback static rates if API down
- [x] `format(usdAmount)` converts + formats to selected currency
- [x] Persisted in localStorage
- [x] CurrencyProvider added to main.jsx

### Games & Earn (Session 2)
- [x] Flappy Bird (canvas, physics, pipes, collision, parallax bg)
- [x] 2048 (full game: merge logic, rotate transforms, touch swipe, best score)
- [x] GamesPage: game selector, session timer (pauses when stopped)
- [x] 60 active minutes → 10 wallet units credited automatically
- [x] Reward progress bar + toast notification
- [x] Route: `/games`

### POS System — Finalized (Session 3)
- [x] PosSale, Purchase, Return Mongoose models (transactionModel.js)
- [x] transactionController.js — createPosSale (stock decrement, unitsSold), getPosStats, createPurchase (stock increment), createReturn (restock)
- [x] peopleModel.js — Customer (name, phone, email, address, totalSpent) + Vendor (name, company, phone, email, address)
- [x] peopleController.js — full CRUD for Customer + Vendor with search
- [x] Mounted `/api/transactions` + `/api/people` in server.js
- [x] AdminPOS.jsx rebuilt — customer search/select, product search, 7 payment methods, discount input, real-time stats bar, save to `/api/transactions/pos`, receipt modal
- [x] POSPeople.jsx — tabbed Customer + Vendor management with modals
- [x] POS stats API: todayRevenue, todaySales, totalRevenue, totalSales, paymentBreakdown

### Checkout & Vouchers (Session 3)
- [x] Voucher input at checkout (validate button, live error/success feedback)
- [x] Voucher applied to order total
- [x] POST to `/api/vouchers/apply` after order created (marks voucher used)
- [x] 8 payment methods at checkout: Credit Card, JazzCash, Easypaisa, NayaPay, SadaPay, Bank Transfer, Cash on Delivery, Wallet Balance
- [x] Totals shown in Rs

### Admin Panel Improvements (Session 3)
- [x] AdminDashboard updated: expanded sidebar with POS People / Categories / Vouchers links
- [x] POS stats card in dashboard (today revenue, today txns, total revenue, total txns)
- [x] ProductEdit.jsx extended: oldPrice, images[], unitType, boxPrice, GST, featureTags, dealEndsAt, variations manager, delivery charge
- [x] CategoryManage.jsx — 3-level hierarchical category CRUD (category + subcategory + sub-subcategory)
- [x] VoucherManage.jsx — create/list/delete vouchers with full form (code, type, value, min order, max discount, expiry, description)
- [x] Routes added to App.jsx: `/admin/pos-people`, `/admin/categories`, `/admin/vouchers`
- [x] Cloudinary image upload — `/api/upload` endpoint (multer memoryStorage → upload_stream → URL saved to product)
- [x] Stripe webhook — `/api/stripe/webhook` (raw body, optional signature verify, marks order paid on `payment_intent.succeeded`)
- [x] Order cancellation — `PUT /api/orders/:id/cancel` (owner/admin only, unpaid orders), Cancel button on Order.jsx
- [x] Pagination — products (pageSize=12), orders (pageSize=20), Shop page with page controls

### Charts, Staff & Operations (Session 4)
- [x] `staff` middleware in authMiddleware.js (admin or staff role allowed)
- [x] `sendEmail.js` utility — nodemailer Gmail transport, `orderConfirmationEmail` + `paymentConfirmationEmail` templates (active when EMAIL_USER/EMAIL_PASS set in .env)
- [x] Backend: `GET /api/orders/stats/revenue` — last 7 days paid revenue + order count per day
- [x] AdminDashboard.jsx — recharts `LineChart` (7-day revenue), `BarChart` (POS payment method breakdown), `PieChart` (order status: paid/pending/cancelled)
- [x] StaffDashboard.jsx — staff + admin access, today's POS stats, quick links to POS/orders/products, recent POS sales + online orders tables
- [x] PurchaseLedger.jsx — vendor selector, item rows (product + qty + cost price), totals, `POST /api/transactions/purchases` (auto-increments stock), purchase history table
- [x] ReturnsManage.jsx — return type toggle (sale_return / purchase_return), POS sale selector auto-fills items, manual reference ID for purchase returns, `POST /api/transactions/return`, info box explaining restock logic
- [x] App.jsx — routes: `/admin/purchase-ledger`, `/admin/returns`, `/staff`

### Profile, Uploads & Admin UX (Session 5)
- [x] `uploadRoutes.js` — smart Cloudinary/local fallback: `POST /api/upload` (product images, admin), `POST /api/upload/avatar` (profile pics, any user); saves to `frontend/public/uploads/` when Cloudinary not configured
- [x] `server.js` — Express static file serving for `/uploads` directory
- [x] `userModel.js` — added `profilePicture: String` field
- [x] `userController.js` — added `updateProfilePicture`, `getMerchantBankAccounts`, `addMerchantBankAccount`, `deleteMerchantBankAccount`
- [x] `userRoutes.js` — routes: `PUT /profile/picture`, `GET /merchant/banks`, `POST /merchant/banks`, `DELETE /merchant/banks/:idx`
- [x] Email notifications wired — `orderController.js` fires `orderConfirmationEmail` after order create; `stripeController.js` fires `paymentConfirmationEmail` after payment confirmed
- [x] `ProductEdit.jsx` — full WordPress-style rebuild: sticky sidebar section nav, 10 collapsible panels, DB-connected cascading category dropdowns (Cat → Subcat → Sub-subcat), preset + custom feature tags, all model fields
- [x] `Profile.jsx` — rebuilt: camera overlay for profile picture upload, merchant bank account management (admin), wallet tab shows bank transfer details panel
- [x] `UserList.jsx` — inline "Make Staff"/"Demote" button for non-admin users (role toggle API call)
- [x] `UserEdit.jsx` — 3-way role radio: User / Staff / Administrator
- [x] `Navbar.jsx` — switched IP detection from ipapi.co (403) to ipwho.is (CORS-open), added Staff Dashboard link for staff role
- [x] `Game2048.jsx` — fixed ESLint: added `useRef` to React imports, removed dead module-level `touchStart` variable
- [x] Back arrows on all admin pages — OrderList, UserList, ProductList, CategoryManage, VoucherManage, POSPeople, AdminPOS, PurchaseLedger, ReturnsManage (consistent "← Back to Dashboard" link)

### Session 6 — 2026-04-28 (Wallet Request Flow, Games, Content Pages, Bug Fixes)
**Backend changes:**
- `userModel.js` — fixed Mongoose 7+ async pre-save hook (removed `next` param + `return next()`)
- `uploadRoutes.js` — try-catch around Cloudinary calls so any failure falls back to local storage
- `server.js` — registered `/api/wallet` route
- NEW `walletRequestModel.js` — user ref, amount, transactionRef, bankName, status (pending/approved/rejected), adminNote
- NEW `walletRequestController.js` — createRequest (user), getMyRequests (user), getRequests (admin), approveRequest (credits wallet), rejectRequest
- NEW `walletRoutes.js` — POST /, GET /mine, GET / (admin), PUT /:id/approve (admin), PUT /:id/reject (admin)
- `.env` — updated STRIPE_SECRET_KEY with new account key

**Frontend changes:**
- `Order.jsx` — updated Stripe publishable key
- `games/CarRacing.jsx` — NEW top-down traffic-dodging car racing game (replaces 2048)
- `games/FlappyBird.jsx` — added `onGameStateChange` callback; timer only runs during active gameplay
- `games/Game2048.jsx` — DELETED
- `GamesPage.jsx` — replaced 2048 with CarRacing, `isGameRunning` decoupled from `activeGame` (timer only ticks during real gameplay)
- `Home.jsx` — Recently Viewed section (lazy useState from localStorage, no useEffect)
- `ProductDetails.jsx` — tracks recently viewed in localStorage, "Compare this product" link
- `Compare.jsx` — NEW: side-by-side product comparison (max 3), debounced search picker, best-value highlighting, URL preloading (?ids=)
- `Contact.jsx` — NEW: info cards + contact form with graceful fallback
- `AppDownload.jsx` — NEW: hero + features + reviews + CTA
- `Navbar.jsx` — added Compare (BarChart2) and Contact (MessageSquare) icon links
- `App.jsx` — added routes: /contact, /app, /compare, /admin/wallet-requests
- `Profile.jsx` — wallet tab: replaced direct top-up with request form (amount + bank + transaction ref); shows own request history with status badges
- NEW `admin/WalletRequests.jsx` — admin page: filter tabs (all/pending/approved/rejected), search, Approve/Reject modal with note, pending count badge
- `AdminDashboard.jsx` — added "Wallet Requests" nav item (Wallet icon)
- Back arrows added to ALL frontend pages (not just admin): Shop, Cart, Checkout, Order, CategoryPage, Profile, GamesPage, ProductDetails

### Session 13 — 2026-04-29 (Snoonu-style Home + Category Page + 10 Seeded Categories)
**Backend changes:**
- NEW `backend/data/categories.js` — 10 categories: Electronics, Footwear, Clothing, Household, Health & Beauty, Groceries, Sports & Outdoors, Toys & Kids, Books & Stationery, Automotive; each with 4 subcategories and 2 sub-subcategories each
- `backend/data/products.js` — completely rewritten with 20 products (2 per category), all published + visible, with proper PKR prices, ratings, unitsSold, featureTags (sale/hot/new/featured/bestseller), oldPrice where applicable
- `backend/seeder.js` — rewrites to clear only products + categories (preserves user accounts), imports both `categories.js` and `products.js`, inserts with admin user reference

**Frontend changes:**
- `Home.jsx` — complete Snoonu-inspired redesign: (1) category grid 5-col desktop + horizontal scroll mobile with promo banners on right; (2) marquee strip; (3) tab bar (Popular/New Arrivals/Featured/Deals) with product grid — all data from backend; (4) Today's Deals horizontal scroll (backend: tag=sale); (5) Offers & Events banner strip linking to tag pages; (6) Browse Categories horizontal strip; (7) Recently Viewed; (8) Popular Brands tags; (9) App download strip; (10) Feature Boxes — `HomeProductCard` inline Snoonu-style card with + overlay, heart overlay, discount badge, rating
- `CategoryPage.jsx` — complete Snoonu-inspired redesign: breadcrumb nav, colored gradient header card with category icon + description + product count, subcategory filter pills (All + each subcat), sort dropdown (Relevance/Popular/Newest/Price asc/desc/Rating), client-side filter+sort, `CatProductCard` with add-to-cart overlay button + out-of-stock overlay, "View all in Shop" link at bottom

**To seed the database:** `cd backend && node seeder.js`

### Session 12 — 2026-04-29 (Cart Currency Fix + Cart Drawer)
**Frontend changes:**
- `Cart.jsx` — fixed all prices from USD (`$`) to PKR (`Rs`); changed shipping from `$5` to `Rs 250` to match Checkout.jsx; used `.toLocaleString()` for number formatting
- `CartContext.jsx` — added `isCartOpen`, `cartOpenKey`, `openCart`, `closeCart` to context; `addToCart` now calls `openCart()` automatically; all new values exposed in Provider
- NEW `CartDrawer.jsx` — right-side slide-in panel: header with item count + minimize + close buttons; cart item list with image, name, qty +/- controls, subtotal, remove; related products horizontal scroll strip (fetched by first item's category, excludes items already in cart); footer with subtotal/shipping/total + "View Cart" + "Checkout" buttons; minimized state collapses to floating pill at bottom-right; opens fresh (expand from minimized) when addToCart re-fires via `cartOpenKey` effect
- `index.css` — added `animate-slide-in-right` keyframe + `.no-scrollbar` utility
- `MainLayout.jsx` — added `<CartDrawer />` above `<main>` (renders on every store page)
- `Navbar.jsx` — cart icon changed from `<Link to="/cart">` to `<button onClick={openCart}>` so it opens the drawer

### Session 11 — 2026-04-29 (Search/Filter Everywhere, Payment Routing, Profile & Back Buttons)
**Frontend changes:**
- `AdminDashboard.jsx` — date range filter, Online/On-site channel filter, revenue days selector, walk-in customer count sub-stat, bank/digital methods highlighted in payment breakdown
- `ProductList.jsx` — filter bar: search, category dropdown, brand, status filter; passes all to backend via URLSearchParams
- `OrderList.jsx` — filter bar: user/order-ID search, status dropdown, date from/to; all filters reset page
- `CategoryManage.jsx` — search input in header; filters categories by name; fixed hooks order (useEffect before early return)
- `AdminPOS.jsx` — category tabs above product grid; out-of-stock products disabled + blocked; stock cap on qty increment; refreshes both stats + product list after sale
- `productController.js` (backend) — `status` filter supported when `showAll=1`
- `orderController.js` (backend) — `getOrders` accepts `search`, `status`, `from`, `to` params; `getRevenueStats` accepts `?days=` (capped 90)
- `Profile.jsx` — ADMIN_TABS restored: My Profile, Wallet, My Orders, Bank Accounts; back button → /admin for admins, / for users; fixed `TABS is not defined` → `tabs.map`; fixed `Icon` unused var in admin links
- `Order.jsx` — full rewrite: BANK_METHODS routing (JazzCash/Easypaisa/NayaPay/SadaPay/Bank Transfer → BankTransferPanel showing merchant bank accounts); Cash/Wallet info panels; Stripe only for Credit Card; role-aware back nav (admin → /admin/orderlist, user → /profile?tab=orders); admin Mark as Paid button; lint fixes (removed unused orderId prop, navigate, useNavigate)
- `Checkout.jsx` — expanded bank details panel to all BANK_METHODS (not just Bank Transfer); filters displayed accounts to match selected method; falls back to all accounts if no specific match

### Session 10 — 2026-04-29 (Home Page Redesign, Combo Deals, ProductCard Fix)
**Backend changes:**
- NEW `comboModel.js` — name, description, image, products[{product ref, qty}], combinedPrice, isActive
- NEW `comboController.js` — getCombos (public, active-only filter), createCombo, updateCombo, deleteCombo (all with product population)
- NEW `comboRoutes.js` — GET /, POST /, PUT /:id, DELETE /:id (admin-protected)
- `server.js` — mounted `/api/combos`

**Frontend changes:**
- `ProductCard.jsx` — fixed hover blink: replaced `transition-all` with `transition-[box-shadow,border-color]`, added `transform-gpu` on image; added `Link` wrapper around image + title for navigation; accepts `_id`/`slug`/`name` props alongside existing `id`/`title`
- `SectionHeader.jsx` — accepts `viewAllLink` prop (renders Link instead of plain button); `onPrev`/`onNext` props for external control
- `Home.jsx` — complete rewrite with 8 fixes: (1) categories from API (2) best sellers from API with bestseller tag fallback to popular (3) hot products in hero (2×2 dark grid replacing placeholder) (4) sale carousel with 4s auto-rotate + prev/next arrows + dots (5) Bundle Deals section using ComboCard (6) branding card replacing 25% signup form (7) new arrivals from API (8) popular tags now link to `/shop?search=`
- NEW `admin/ComboManage.jsx` — create/edit/delete combos with product search picker, qty management, savings calculator, active toggle
- `App.jsx` — added `ComboManage` import + `/admin/combos` route
- `AdminDashboard.jsx` — added `Zap` icon import + `{ to: '/admin/combos', label: 'Combo Deals', icon: Zap }` to OTHER nav

### Session 9 — 2026-04-29 (Product Slugs, Categories Page, Tag Pages)
**Backend changes:**
- `productModel.js` — added `slug` (String, sparse unique index), `costPrice` (Number, default 0)
- `productController.js` — `createProduct` + `updateProduct`: auto-generate slug as `${slugify(name)}-${_id.slice(-8)}`; `costPrice` is read-only from product form; `getProducts`: filters out draft/invisible for public (bypassed with `?showAll=1`); NEW `getProductBySlug`
- `productRoutes.js` — added `GET /slug/:slug` route (before `/:id`)
- `transactionController.js` — `createPurchase` now also sets `product.costPrice` from purchase line item

**Frontend changes:**
- `ProductDetails.jsx` — fetchProduct tries slug endpoint first, falls back to ID for backward compat; related product links use `slug || _id`
- All product links across frontend updated to `slug || _id`: Shop.jsx, CategoryPage.jsx, Compare.jsx, Profile.jsx, Home.jsx, ProductDetails.jsx
- `ProductEdit.jsx` — read-only stock display (color-coded badge); costPrice read-only display; price warning modal (blocks if price < costPrice, shows exact loss, "Fix Price"/"Save Anyway")
- `PurchaseLedger.jsx` — full redesign: fetches products with `?showAll=1`; auto-fills costPrice when product selected; Stock Overview panel
- NEW `Categories.jsx` — all categories page with subcategory grid, sub-subcategory chips, links to category/sub pages
- NEW `TagPage.jsx` — reusable tag-filtered product page; `useParams()` for tag; sort + pagination; per-tag icon/color; product cards with cart + wishlist; empty state
- `App.jsx` — added imports + routes: `/categories` → Categories, `/tag/:tag` → TagPage
- `Navbar.jsx` — added "Explore" dropdown (desktop): Categories, All Products, Featured, Hot, Best Sellers, New Arrivals, Sale; mobile menu expanded with all links + icons; added Folder, Flame, Sparkles, TrendingUp, Tag icons

### Session 8 — 2026-04-29 (Purchase-driven Inventory, Full-screen Layout, Mobile Responsive)
**Backend changes:**
- `productModel.js` — added `costPrice: Number` (default: 0) — automatically updated by Purchase Ledger
- `productController.js` — `createProduct`: includes `costPrice: 0`; `updateProduct`: costPrice is NOT writable from product form (managed only by purchase)
- `transactionController.js` — `createPurchase`: now also updates `product.costPrice = item.costPrice` so the product always knows its last purchase price

**Frontend changes:**
- `ProductEdit.jsx` — `countInStock` is now read-only (badge showing current stock with color coding, link to Purchase Ledger); added read-only `costPrice` display ("Last purchase cost: Rs X"); sale price warning modal: if `price < costPrice`, blocks save and shows warning with loss amount, user can "Fix Price" (cancel) or "Save Anyway" (confirm)
- `PurchaseLedger.jsx` — full redesign: two-column layout (form left, history right); fetches all products including drafts (`?showAll=1`); auto-fills `costPrice` from product's stored costPrice when product is selected; shows current stock + last cost under each product row; "Stock Overview" panel showing all products with stock level badges; purchase history table shows units per row and per-item cost; totals row in table footer
- `AdminLayout.jsx` — changed from `h-screen overflow-hidden` to `min-h-screen` so all admin sub-pages can scroll vertically
- `MainLayout.jsx` — removed `max-w-7xl mx-auto` from both `<main>` and footer inner div; all customer-facing pages now use full screen width
- All admin pages outer wrapper updated to full-width: ProductList, WalletRequests, POSPeople, VoucherManage, CategoryManage, UserList, OrderList, ReturnsManage, UserEdit, StaffDashboard

### Session 7 — 2026-04-29 (ProductEdit Redesign + New Product Fields)
**Backend changes:**
- `productModel.js` — added `status` (draft/published/out_of_stock, default: draft), `isVisible` (Boolean, default: true), `discountPercent` (Number, default: 0), `relatedProducts` ([ObjectId ref Product])
- `productController.js` — `getProducts`: public queries now filter out drafts and invisible products; admin passes `?showAll=1` to bypass; `createProduct`: new fields included with defaults; `updateProduct`: handles status, isVisible, discountPercent, relatedProducts

**Frontend changes:**
- `ProductEdit.jsx` — complete redesign: full-screen two-column layout (no outer wrapper), sticky header bar with breadcrumb + "Save Draft" + "Publish" buttons + last-saved timestamp; left panel (left sidebar: cover image upload with hover overlay, thumbnail grid, URL paste fallback, Visibility toggle, Preview link, Related Products search with dropdown); right panel: General tab (name, status dropdown, brand, stock, category cascade, sale price, discount %, short + detailed description) and Advanced tab (old price, unit type, box pricing, shipping, GST, variations, feature tags, flash sale timer)
- `ProductList.jsx` — fetch URL updated to `?showAll=1` (shows all products including drafts to admin), added Status column with color-coded badge (Draft=amber, Published=green, Out of Stock=red)

### Session 14 — 2026-05-04 (Security, Audit Trail, Offline POS, Guest Checkout, SEO, PWA)

**Backend — new packages:** `express-rate-limit`

**Backend — new files:**
- `backend/models/activityLogModel.js` — who/what/when/IP audit trail schema
- `backend/models/cashierSessionModel.js` — shift open/close schema with tallied totals
- `backend/utils/activityLogger.js` — non-blocking `logActivity()` helper
- `backend/controllers/activityController.js` — paginated log query + entity-specific log
- `backend/controllers/cashierController.js` — openRegister, closeRegister (auto-tallies from PosSale), current, all
- `backend/routes/activityRoutes.js` — `GET /api/activity`, `GET /api/activity/:entity/:id`
- `backend/routes/cashierRoutes.js` — `POST /api/cashier/open`, `PUT /api/cashier/close`, `GET /api/cashier/current`, `GET /api/cashier`

**Backend — modified:**
- `server.js` — added `/api/activity`, `/api/cashier` routes
- `userRoutes.js` — rate limiter (20 req / 15 min) on `POST /login` and `POST /` (register) via `express-rate-limit`
- `authMiddleware.js` — added `optionalProtect` (passes through without auth, sets `req.user = null`)
- `productModel.js` — added `isDeleted`, `deletedAt`, `lowStockThreshold` (default 5), `sku` fields
- `userModel.js` — added `isDeleted`, `deletedAt` fields
- `orderModel.js` — `user` field made optional (`required: false`), added `guestEmail: String`
- `productController.js` — soft delete (marks `isDeleted`), `getProducts` filters deleted, `getLowStockProducts` endpoint, `getProductBySku` endpoint, activity logging on create/update/delete
- `productRoutes.js` — added `/low-stock` (admin) and `/sku/:sku` (public) before `/:id`
- `userController.js` — soft delete for users, activity logging on login/logout
- `orderController.js` — guest checkout support (optional user, guestEmail in order)
- `orderRoutes.js` — `POST /api/orders` now uses `optionalProtect`
- `transactionController.js` — all stock updates use MongoDB `$inc` (atomic), low-stock email notification after each POS sale, activity logging
- `sendEmail.js` — added `sendLowStockAlert(productName, currentStock)`

**Frontend — new packages:** `react-helmet-async`, `vite-plugin-pwa`

**Frontend — new files:**
- `frontend/src/utils/posOfflineQueue.js` — IndexedDB queue (queueSale, getPendingSales, deletePendingSale, clearAllPending)
- `frontend/src/pages/admin/ActivityLog.jsx` — admin activity log page with filters + pagination

**Frontend — modified:**
- `vite.config.js` — VitePWA plugin (auto-update SW, manifest, Workbox caching for product API)
- `main.jsx` — wrapped app in `HelmetProvider`
- `App.jsx` — added `/admin/activity` route
- `AdminDashboard.jsx` — low stock alert widget (amber card, product pills → edit links), Activity Log in sidebar NAV.OTHER, `AlertTriangle` + `Activity` icons imported
- `AdminPOS.jsx` — barcode/SKU scanner input, offline banner + IndexedDB queue when `!navigator.onLine`, auto-sync on reconnect, cashier Open/Close Register modals + session status indicator, thermal 80mm receipt CSS (`@media print`)
- `Checkout.jsx` — guest checkout: removed hard `if (!user)` redirect, guest email input shown when not logged in, `guestEmail` passed in order payload
- `Home.jsx` — Helmet meta tags
- `Shop.jsx` — Helmet meta tags
- `ProductDetails.jsx` — Helmet + OG image meta tags
- `CategoryPage.jsx` — Helmet meta tags

---

## In Progress / Partial

| Feature | Done | Missing |
|---|---|---|
| Email notifications | Code wired (order + payment) | Needs `EMAIL_USER` + `EMAIL_PASS` in .env to actually send |
| Cloudinary uploads | Working with local fallback | Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in .env for cloud storage |
| Stripe | Payment intents working | `.env` has a publishable key (`pk_test_...`) instead of secret key (`sk_test_...`) — must fix |

---

## TODO (Next Sessions)

### Medium Priority

### Low Priority
- [x] **Customer Support** — Contact page done (`/contact`)
- [x] **Product Compare** — Side-by-side comparison done (`/compare`)
- [x] **Recently Viewed** — Done (localStorage, shows on Home.jsx)
- [x] **App Download Page** — Done (`/app`)

---

## Session Log

### Session 1 — 2026-04-27 (Documentation)
- Created CLAUDE.md and progress.md from scratch
- Full project analysis completed

### Session 2 — 2026-04-27 (Major Feature Build)
**Backend changes:**
- `productModel.js` — added images[], unitType, GST, variations, featureTags, dealEndsAt, unitsSold, savedByCount, subcategory, deliveryCharge
- `userModel.js` — added walletBalance, bonusPoints, favorites[], bankAccounts[], country, preferredCurrency
- NEW `categoryModel.js` — hierarchical categories (cat → subcat → sub-subcat)
- NEW `voucherModel.js` — voucher/coupon system
- `productController.js` — full search/filter, related products, reviews, favorites toggle
- `userController.js` — wallet top-up/deduct, bonus points, favorites, currency, location
- NEW `categoryController.js` + `categoryRoutes.js`
- NEW `voucherController.js` + `voucherRoutes.js`
- `server.js` — mounted all new routes

**Frontend changes:**
- NEW `CurrencyContext.jsx` — live exchange rates, format()
- `main.jsx` — added CurrencyProvider
- `Navbar.jsx` — built from scratch: search, location flag, currency switcher, user dropdown
- NEW `InfoBar.jsx` — news ticker, weather, exchange rates (5s rotation)
- `ProductCard.jsx` — rebuilt: stock badge, units sold, saved count, cart/favorite
- `ProductDetails.jsx` — rebuilt: multi-image gallery, hover zoom, variations, GST, Buy Now, countdown, reviews
- `Shop.jsx` — rebuilt: hierarchical filter panel, dynamic price range, sort, grid/list
- NEW `CategoryPage.jsx` — category hero, subcategory tabs, product grid
- `Profile.jsx` — rebuilt: tabbed with Wallet, Orders, Favorites, Rewards
- NEW `FlappyBird.jsx`, `Game2048.jsx`, `GamesPage.jsx` — canvas games + wallet reward timer
- `App.jsx` — added routes: /category/:slug, /games, /favorites

### Session 3 — 2026-04-27 (POS Finalization + Admin Improvements)
**Backend changes:**
- NEW `transactionModel.js` — PosSale (products, customer, totalAmount, discount, paymentMethod[7], servedBy), Purchase, Return
- NEW `transactionController.js` — createPosSale (stock decrement + unitsSold), getPosStats (today/all revenue), createPurchase, createReturn
- NEW `transactionRoutes.js` — `/pos`, `/pos/stats`, `/purchases`, `/return`
- NEW `peopleModel.js` — Customer + Vendor schemas
- NEW `peopleController.js` — full CRUD with search for both
- NEW `peopleRoutes.js` — `/customers`, `/vendors` with CRUD routes
- `server.js` — mounted `/api/transactions` + `/api/people`

**Frontend changes:**
- `AdminPOS.jsx` — full rebuild: customer selector (debounced search), 7 payment methods, discount input, stats bar, saves to transactionAPI, receipt shows products[]
- NEW `POSPeople.jsx` — tabbed Customers + Vendors CRUD with search + modals
- `Checkout.jsx` — voucher input/validate/apply, 8 payment methods grid, Rs currency throughout
- `ProductEdit.jsx` — all new fields: oldPrice, images[], unitType, boxPrice, GST, featureTags, dealEndsAt (datetime-local), variations manager, delivery charge
- `AdminDashboard.jsx` — expanded 8-link sidebar, POS stats card (4 metrics)
- NEW `CategoryManage.jsx` — 3-level hierarchy CRUD with expand/collapse tree
- NEW `VoucherManage.jsx` — voucher create/list/delete with status badges
- `App.jsx` — routes: /admin/pos-people, /admin/categories, /admin/vouchers

**Next session:** Cloudinary image upload, order cancellation, Stripe webhooks, pagination, admin charts

### Session 4 — 2026-04-27 (Charts, Staff, Operations)
**Backend changes:**
- `authMiddleware.js` — added `staff` middleware (passes if role is 'staff' or 'admin')
- NEW `utils/sendEmail.js` — nodemailer Gmail transport, orderConfirmationEmail + paymentConfirmationEmail templates
- `orderController.js` — added `getRevenueStats` (last 7 days paid revenue per day)
- `orderRoutes.js` — added `GET /stats/revenue` route (before `/:id` routes to avoid param conflict)

**Frontend changes:**
- `AdminDashboard.jsx` — recharts LineChart (7-day revenue), BarChart (POS by payment method), PieChart (order status); sidebar now has Purchase Ledger + Returns links
- NEW `pages/staff/StaffDashboard.jsx` — today POS stats, quick links, recent POS sales + online orders
- NEW `pages/admin/PurchaseLedger.jsx` — vendor selector, item rows, POST purchases, history table
- NEW `pages/admin/ReturnsManage.jsx` — sale/purchase return form, POS sale auto-fill, info panel
- `App.jsx` — routes: `/admin/purchase-ledger`, `/admin/returns`, `/staff`

**Next session:** Wire sendEmail into order/payment flow, staff role UI management, Navbar staff routing

### Session 16 — 2026-05-04 (Checkout Page Redesign + Admin Order Detail Page)
**Backend changes:**
- `orderController.js` — added `markOrderPaidAdmin` (PUT /:id/pay-admin, admin-only, manual mark-as-paid without Stripe)
- `orderRoutes.js` — added route + imported `markOrderPaidAdmin`

**Frontend — new files:**
- NEW `admin/AdminOrderView.jsx` — full admin order detail page: breadcrumb nav, action buttons (Print/Mark Paid/Mark Delivered/Cancel), products table with images + line totals, Billing Details card (customer name, email, payment method, transaction ID), Shipping Details card (address, paid/delivered/cancelled timestamps), Summary sidebar (price breakdown), Order Status sidebar (payment + fulfillment status cards with inline action buttons)
- Route added: `/admin/order/:id` → AdminOrderView (admin layout)
- OrderList "Details" button now links to `/admin/order/:id` instead of customer-facing `/order/:id`
- CustomerView online orders table links to `/admin/order/:id`

**Frontend — modified:**
- `Checkout.jsx` — complete redesign matching modern checkout UI: (1) "Check out" heading, left-right two-column layout; (2) Shipping Details card with view/edit toggle (Edit button shows read-only Name/Address/Phone with icons, Confirm Address button switches to view mode); (3) Billing Details card with "Same as shipping" checkbox (mirrors shipping when checked, shows separate inputs when unchecked); (4) Delivery Type section — 4 radio cards in 2×2 grid (Free/Standard/Two Day/One Day with POPULAR badge on fastest); (5) Payment Method — 8 methods in 3-col grid with Credit Card extras panel (card number/name/expiry UI), bank transfer details, Cash/Wallet info panels; (6) Voucher section; (7) Place Order button; (8) Summary sidebar — product image thumbnails, Items subtotal / Discount / Subtotal / Shipping Cost / Total breakdown; all existing features preserved (vouchers, bank accounts display, guest checkout, Stripe note)

### Session 15 — 2026-05-04 (Detail View Pages + Bug Fixes)
**Bug fixes:**
- `CategoryPage.jsx` — `CatProductCard` now uses `isUnavailable = countInStock === 0 || status === 'out_of_stock'` (was only checking countInStock); imported `useCurrency` + replaced hardcoded `Rs` with `format()` from CurrencyContext
- `AdminDashboard.jsx` — sidebar "Customers" link relabelled to "Staff" (was linking to Staff Management page)
- `ProductEdit.jsx` — "Save as Draft" now calls `doSave(undefined)` directly instead of `triggerSave(undefined)` (which was silently blocked by falsy priceWarning guard)
- `PurchaseLedger.jsx` — right-side purchase history now refreshes via `fetchAll()` after inline stock edit (was only doing local state update)

**Backend changes:**
- `peopleModel.js` — added `noteSchema` (text, addedBy, timestamps) + `notes: [noteSchema]` to both Customer and Vendor schemas
- `peopleController.js` — added `getCustomerById`, `addCustomerNote`, `deleteCustomerNote`, `getVendorById`, `addVendorNote`, `deleteVendorNote`; `getCustomers` now includes `profilePicture` for online users
- `peopleRoutes.js` — added routes: `GET /customers/:id`, `POST /customers/:id/notes`, `DELETE /customers/:id/notes/:noteId`; same for vendors
- `transactionController.js` — `getPosSales` now filters by `customerId` and `servedBy`; `getPurchases` filters by `vendorId`
- `orderController.js` — `getOrders` now accepts `?userId=` to filter by specific user

**Frontend — new files:**
- NEW `admin/CustomerView.jsx` — full customer detail page; left sidebar (avatar, stats, contact, notes); right panel (Online Orders / POS Sales tabs); source-aware: POS customers vs online users from User model
- NEW `admin/VendorView.jsx` — full vendor detail page; left sidebar (initials avatar, company name, stats, contact, notes); right panel (expandable purchase history table with per-item product details)
- NEW `admin/StaffView.jsx` — full staff detail page; left sidebar (profile pic, role badge, stats, contact, payment method breakdown); right panel (POS sales history with customer + product details)

**Frontend — modified:**
- `ProductList.jsx` — added checkbox column (bulk multi-select/delete), product image column (48×48 thumbnail with `ImageOff` fallback); bulk delete button shown when items selected
- `UserList.jsx` — added Avatar column, Avatar component with deterministic color + initials; added Eye (View) button → `/admin/staff/:id`
- `POSPeople.jsx` — added Avatar column + Avatar component for both tabs; Globe badge on online customer avatars; Eye (View) button on every customer row → `/admin/customer/:id?source=pos|online`; Eye button on vendor rows → `/admin/vendor/:id`
- `App.jsx` — added routes: `/admin/customer/:id`, `/admin/vendor/:id`, `/admin/staff/:id`

### Session 5 — 2026-04-28 (Profile, Uploads, Admin UX Polish)
**Backend changes:**
- `uploadRoutes.js` — smart Cloudinary/local fallback for both product images (`/api/upload`) and avatars (`/api/upload/avatar`)
- `server.js` — `app.use('/uploads', express.static(...))` for local file serving
- `userModel.js` — added `profilePicture` field
- `userController.js` — 4 new functions: updateProfilePicture, getMerchantBankAccounts, addMerchantBankAccount, deleteMerchantBankAccount
- `userRoutes.js` — 4 new routes wired
- `orderController.js` — fires `orderConfirmationEmail` after order create (fire-and-forget)
- `stripeController.js` — fires `paymentConfirmationEmail` after Stripe payment confirmed

**Frontend changes:**
- `ProductEdit.jsx` — full WordPress-style rewrite: 10-section sticky sidebar, DB cascading category dropdowns, preset/custom tags, all model fields
- `Profile.jsx` — full rewrite: profile picture upload (camera overlay), merchant bank accounts UI (admin only), bank transfer details in wallet tab
- `UserList.jsx` — inline staff role toggle button
- `UserEdit.jsx` — 3-way role radio (User/Staff/Admin)
- `Navbar.jsx` — switched to ipwho.is for geolocation; staff link added
- `Game2048.jsx` — ESLint fixes (useRef import, removed dead touchStart)
- Back arrows added to 9 admin pages: OrderList, UserList, ProductList, CategoryManage, VoucherManage, POSPeople, AdminPOS, PurchaseLedger, ReturnsManage

### Session 20 — 2026-05-05 (Admin/Staff Portal Login, Auth Guard, Staff Page Admin Visibility, POSPeople Cleanup)

**Frontend — new files:**
- NEW `frontend/src/pages/admin/AdminLogin.jsx` — split-panel login page for admin/staff portal: left green gradient panel with logo + feature list; right panel: email + password with show/hide toggle, remember me checkbox, forgot password link, Sign In button, demo credentials box, Customer Store link; full OTP flow (verify, set password, forgot, reset modes); redirects admin → /admin, staff → /staff after successful auth

**Frontend — modified:**
- `AdminLayout.jsx` — added auth guard: unauthenticated users and non-admin/staff accounts are redirected to `/admin/login`; `/admin/login` itself passes through without auth check
- `App.jsx` — added `AdminLogin` import + `/admin/login` route inside AdminLayout block
- `StaffManage.jsx` — fetch changed from `?roles=staff` → `?roles=staff,admin`; admin accounts now show with purple "Admin" badge and "Full Access" permission label; delete button hidden for admin accounts and for the current user's own account; header subtitle shows separate admin + staff counts
- `POSPeople.jsx` — for online customers (`source === 'online'`), removed the pencil/edit link to `/admin/user/:id/edit` (which allowed role-change); only the Eye (view → CustomerView) and Trash (delete) actions are shown; POS (non-online) customers still have the full edit + delete buttons

### Session 19 — 2026-05-05 (PKR Base Currency, OTP Auth, Staff Permissions, Cart Prices, TotalSpent Fix)

**Backend changes:**
- `userModel.js` — added `permissions: [String]` (staff feature access), `otp: String`, `otpExpiry: Date`, `isVerified: Boolean` (default: true — existing users auto-verified; new registrations set false)
- `userController.js` — updated `registerUser`: creates unverified user, generates 6-digit OTP, sends via email, returns `{ pendingVerification: true }` instead of JWT; updated `authUser`: blocks login if `isVerified === false` with error `EMAIL_NOT_VERIFIED`; updated `updateUser`: saves `permissions[]` array; added OTP controllers: `verifyOTP` (validates OTP + expiry, sets isVerified, returns JWT), `resendOTP` (regenerates + resends for verify or forgot), `forgotPassword` (sends reset OTP, generic success response), `resetPassword` (validates OTP + sets new password)
- `userRoutes.js` — added public routes: `POST /verify-otp`, `POST /resend-otp`, `POST /forgot-password`, `POST /reset-password`
- `peopleController.js` — `getCustomers`: imports Order model, aggregates paid order totals per online user with `$group`; `totalSpent` for online users now reflects actual paid order total instead of stale `User.totalSpent` field
- `sendEmail.js` — used existing `sendEmail()` utility for OTP emails (inline HTML template with 40px OTP code block)

**Frontend changes:**
- `CurrencyContext.jsx` — `convert()` now treats input as PKR (divide by PKR rate → multiply by target rate); `format()` short-circuits for PKR with no conversion; `formatPKR()` returns raw PKR amount directly (no USD multiplication); all prices stored in PKR now display correctly across all currencies
- `Cart.jsx` — imported `useCurrency`; replaced all `Rs ${price.toLocaleString()}` with `format(price)` for item price, item subtotal, cart subtotal, shipping, and total
- `AuthContext.jsx` — `register()` no longer sets user (returns pending data for OTP step); added `setUserFromData(data)` function for post-OTP login; exposed in Provider value
- `Login.jsx` — complete rewrite: 5-mode state machine (`login`, `register`, `verify`, `forgot`, `reset`); `OTPInput` component (6 individual digit boxes with auto-focus-next, backspace-prev); `useCountdown` hook (2-min timer with `setInterval`, cleans up on unmount); verify mode: OTP input + "Verify & Continue" → calls `/verify-otp`; forgot mode: email input → calls `/forgot-password`; reset mode: OTP + new password → calls `/reset-password`; resend button appears when timer reaches 0; show/hide password toggles; handles `EMAIL_NOT_VERIFIED` error from login by auto-redirecting to verify mode + resending OTP
- `UserEdit.jsx` — `STAFF_PERMISSIONS` constant (6 permissions: pos_sales, view_orders, manage_products, view_reports, manage_customers, manage_inventory); permissions checklist appears only when `role === 'staff'`; loaded from user data on fetch; saved alongside role in `PUT /api/users/:id`

### Session 18 — 2026-05-04 (Real-time Polling Messaging / Chat System)

**Backend — new files:**
- NEW `backend/models/conversationModel.js` — user ref (unique), lastMessage, lastMessageAt, userUnread, adminUnread counters
- NEW `backend/models/messageModel.js` — conversation ref (indexed), sender ref, senderRole enum, text, isDeleted (soft delete)
- NEW `backend/controllers/messageController.js` — getOrCreateConversation, getAllConversations (admin), getMessages (marks read on fetch), sendMessage (increments unread counter for other party), deleteMessage (soft delete, sender or admin only)
- NEW `backend/routes/messageRoutes.js` — POST/GET /conversations, GET/POST /conversations/:id, DELETE /:id

**Backend — modified:**
- `server.js` — registered `/api/messages` route

**Frontend — new files:**
- NEW `frontend/src/pages/admin/Messages.jsx` — two-panel admin messenger: left panel (search, All/Read/Unread tabs, conversation list with avatar, name, unread badge, last message preview, relative timestamps); right panel (empty state or chat view with header, messages, hover action icons per message, send toolbar); polls conversations every 10s, messages every 3s; optimistic message insert; soft-delete with inline update; deterministic avatar colors from name charCode

**Frontend — modified:**
- `frontend/src/pages/Contact.jsx` — rewrote as dual-mode: guests see 3 info cards (Call/Email/Live Chat with Sign In prompt); logged-in users see full single-conversation chat UI (600px card, support team header, message bubbles, 4s polling, optimistic send, auto-scroll)
- `frontend/src/App.jsx` — added Messages import + `/admin/messages` route inside AdminLayout block
- `frontend/src/pages/admin/AdminDashboard.jsx` — added MessageCircle icon + Messages link in sidebar NAV.OTHER

### Session 17 — 2026-05-04 (Order Status Lifecycle, Tracking, Shipping Info, Profile Redesign)

**Backend changes (completed in Session 16 backend phase):**
- `orderModel.js` — added `orderStatus` enum: pending/processing/shipped/delivered/cancelled (default: pending)
- `userModel.js` — added `phone: String` + `savedAddress` subdocument (fullName, addressLine1, addressLine2, city, state, postalCode, country, phone)
- `orderController.js` — added `markOrderPaidAdmin` (PUT /:id/pay-admin) + `updateOrderStatus` (PUT /:id/status — advances orderStatus enum, syncs isDelivered/isCancelled flags)
- `userController.js` — added `getSavedAddress` (GET /users/address) + `updateSavedAddress` (PUT /users/address)
- `orderRoutes.js` — registered /:id/pay-admin and /:id/status routes
- `userRoutes.js` — registered /address route (before /:id to avoid param conflict)

**Frontend — new files:**
- NEW `ShippingInfo.jsx` — dedicated shipping address form page at `/profile/shipping`; loads saved address from `/api/users/address`; fields: Full Name, Email, Phone, Address Line 1, Address Line 2, City, State, Zip, Country dropdown (15 countries); Save + Exit Without Saving buttons; cart summary sidebar shows live cart items + total

**Frontend — modified:**
- `Order.jsx` — complete rewrite: vertical `TrackingTimeline` component (pending→processing→shipped→delivered with filled circles, green connector lines, "Current" badge); `CallSupportModal` with Phone / Email / WhatsApp options; "Call Support" header button + support card in sidebar; layout split into main column (tracking, items, address) and right sidebar (payment, actions, support)
- `AdminOrderView.jsx` — added `OrderTimeline` component (same stepper, compact size); added "Advance Status" button grid (4 status steps, current highlighted green, past steps grayed, future steps clickable); `updateStatus()` handler calls PUT /:id/status; added `Clock` icon import; tracking section above products table
- `Profile.jsx` — stats row added to profile tab (Total Spent / Last Order / Total Orders with colored icon cards); Default Address card added next to Personal Info (shows saved address or "Add address" prompt with link to /profile/shipping); orders tab now uses `getOrderStatusBadge()` (pending/processing/shipped/delivered/cancelled color-coded uppercase badges) instead of old getStatusIcon/getStatusText helpers; saved address loaded via GET /api/users/address on mount
- `Checkout.jsx` — auto-fills shipping fields from saved address on mount (GET /api/users/address); sets `editingShipping: false` if address exists so user sees read-only view first
- `App.jsx` — added `ShippingInfo` import + `/profile/shipping` route

