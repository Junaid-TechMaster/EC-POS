import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Shop from './pages/Shop';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Order from './pages/Order';
import CategoryPage from './pages/CategoryPage';
import GamesPage from './pages/GamesPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductList from './pages/admin/ProductList';
import ProductEdit from './pages/admin/ProductEdit';
import OrderList from './pages/admin/OrderList';
import UserList from './pages/admin/UserList';
import UserEdit from './pages/admin/UserEdit';
import AdminPOS from './pages/admin/AdminPOS';
import POSPeople from './pages/admin/POSPeople';
import CategoryManage from './pages/admin/CategoryManage';
import VoucherManage from './pages/admin/VoucherManage';
import PurchaseLedger from './pages/admin/PurchaseLedger';
import ReturnsManage from './pages/admin/ReturnsManage';
import WalletRequests from './pages/admin/WalletRequests';
import StaffDashboard from './pages/staff/StaffDashboard';
import Contact from './pages/Contact';
import AppDownload from './pages/AppDownload';
import Compare from './pages/Compare';
import Categories from './pages/Categories';
import TagPage from './pages/TagPage';
import ComboManage from './pages/admin/ComboManage';
import PaymentInfo from './pages/PaymentInfo';
import ReturnsPolicy from './pages/ReturnsPolicy';
import ActivityLog from './pages/admin/ActivityLog';
import CustomerView from './pages/admin/CustomerView';
import AdminOrderView from './pages/admin/AdminOrderView';
import VendorView from './pages/admin/VendorView';
import StaffView from './pages/admin/StaffView';
import StaffManage from './pages/admin/StaffManage';
import ShippingInfo from './pages/ShippingInfo';
import Messages from './pages/admin/Messages';
import AdminLogin from './pages/admin/AdminLogin';
import ReviewsManage from './pages/admin/ReviewsManage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Customer-facing routes — full layout with Navbar + footer */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="product/:slug" element={<ProductDetails />} />
          <Route path="cart" element={<Cart />} />
          <Route path="login" element={<Login />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="order/:id" element={<Order />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="favorites" element={<Profile />} />
          <Route path="contact" element={<Contact />} />
          <Route path="app" element={<AppDownload />} />
          <Route path="compare" element={<Compare />} />
          <Route path="categories" element={<Categories />} />
          <Route path="tag/:tag" element={<TagPage />} />
          <Route path="payment-info" element={<PaymentInfo />} />
          <Route path="returns-policy" element={<ReturnsPolicy />} />
          <Route path="profile/shipping" element={<ShippingInfo />} />
        </Route>

        {/* Admin / Staff routes — full-screen, own sidebar, no outer Navbar */}
        <Route element={<AdminLayout />}>
          <Route path="admin/login" element={<AdminLogin />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/productlist" element={<ProductList />} />
          <Route path="admin/product/:id/edit" element={<ProductEdit />} />
          <Route path="admin/orderlist" element={<OrderList />} />
          <Route path="admin/order/:id" element={<AdminOrderView />} />
          <Route path="admin/userlist" element={<UserList />} />
          <Route path="admin/user/:id/edit" element={<UserEdit />} />
          <Route path="admin/pos" element={<AdminPOS />} />
          <Route path="admin/pos-people" element={<POSPeople />} />
          <Route path="admin/categories" element={<CategoryManage />} />
          <Route path="admin/vouchers" element={<VoucherManage />} />
          <Route path="admin/purchase-ledger" element={<PurchaseLedger />} />
          <Route path="admin/returns" element={<ReturnsManage />} />
          <Route path="admin/wallet-requests" element={<WalletRequests />} />
          <Route path="admin/combos" element={<ComboManage />} />
          <Route path="admin/activity" element={<ActivityLog />} />
          <Route path="admin/customer/:id" element={<CustomerView />} />
          <Route path="admin/vendor/:id" element={<VendorView />} />
          <Route path="admin/staff/:id" element={<StaffView />} />
          <Route path="admin/staff-manage" element={<StaffManage />} />
          <Route path="admin/messages" element={<Messages />} />
          <Route path="admin/reviews" element={<ReviewsManage />} />
          <Route path="staff" element={<StaffDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
