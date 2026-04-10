// frontend/src/pages/Home.jsx
import { ArrowRight, Leaf, ShieldCheck, Truck, Package, RotateCcw, BadgePercent, Gift } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import ProductCard from '../components/ProductCard';
import BlogCard from '../components/BlogCard';
import FeatureBox from '../components/FeatureBox';

const Home = () => {
  const categories = ['Fruits & Veges', 'Breads & Sweets', 'Beverages', 'Meat Products', 'Breads'];
  const popularTags = ['Blue diamon almonds', 'Angie\'s Boomchickapop Corn', 'Salty kettle Corn', 'Chobani Greek Yogurt', 'Sweet Vanilla Yogurt', 'Foster Farms Takeout Crispy wings', 'Warrior Blend Organic', 'Chao Cheese Creamy', 'Chicken meatballs'];

  return (
    <div className="w-full pb-12">
      {/* 1. HERO SECTION */}
      <section className="bg-[#fdf9f0] rounded-3xl p-8 md:p-16 mb-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden">
        <div className="md:w-1/2 z-10">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            <span className="text-green-600">Organic</span> Foods at your Doorsteps
          </h1>
          <p className="text-gray-600 mb-8">Ditch the grocery store lines and get fresh food delivered.</p>
          <div className="flex gap-4 mb-10">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition-all">
              Start Shopping <ArrowRight size={18} />
            </button>
            <button className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-full font-semibold transition-all">
              Join Now
            </button>
          </div>
          <div className="flex gap-8 border-t border-gray-200 pt-6">
            <div><h3 className="text-2xl font-bold text-gray-900">14k+</h3><p className="text-sm text-gray-500">Product Varieties</p></div>
            <div><h3 className="text-2xl font-bold text-gray-900">50k+</h3><p className="text-sm text-gray-500">Happy Customers</p></div>
            <div><h3 className="text-2xl font-bold text-gray-900">10+</h3><p className="text-sm text-gray-500">Store Locations</p></div>
          </div>
        </div>
        <div className="md:w-1/2 mt-8 md:mt-0 relative h-64 md:h-96 w-full bg-yellow-400 rounded-2xl flex items-center justify-center">
           <span className="text-yellow-800 font-bold">[ Hero Image ]</span>
        </div>
      </section>

      {/* 2. FEATURE BADGES */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
        <div className="bg-green-100 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-full text-white"><Leaf /></div>
          <div><h4 className="font-bold text-gray-900">Fresh from farm</h4><p className="text-sm text-gray-600">Locally grown organic produce</p></div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 flex items-center gap-4 text-white">
          <div className="bg-gray-600 p-3 rounded-full"><ShieldCheck /></div>
          <div><h4 className="font-bold">100% Organic</h4><p className="text-sm text-gray-300">Guaranteed quality standards</p></div>
        </div>
        <div className="bg-orange-100 rounded-xl p-6 flex items-center gap-4">
          <div className="bg-orange-500 p-3 rounded-full text-white"><Truck /></div>
          <div><h4 className="font-bold text-gray-900">Free delivery</h4><p className="text-sm text-gray-600">On all orders over $50</p></div>
        </div>
      </section>

      {/* 3. CATEGORY SECTION */}
      <SectionHeader title="Category" />
      <div className="flex flex-wrap gap-4 md:gap-8 justify-between mb-16">
        {[...categories, 'Fruits & Veges', 'Breads & Sweets'].map((cat, index) => (
          <div key={index} className="flex flex-col items-center gap-3 cursor-pointer group">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group-hover:shadow-md transition-shadow">
               <span className="text-gray-400 text-xs">[Img]</span>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-green-600">{cat}</span>
          </div>
        ))}
      </div>

      {/* 4. BEST SELLING PRODUCTS */}
      <SectionHeader title="Best selling products" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-16">
        <ProductCard title="Whole Wheat Sandwich Bread" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
        <ProductCard title="Whole Grain Oatmeal" oldPrice="54.00" price="50.00" discount="10%" reviews="41" />
        <ProductCard title="Sharp Cheddar Cheese Block" oldPrice="14.00" price="12.00" discount="10%" reviews="32" />
        <ProductCard title="Organic Baby Spinach" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
        <ProductCard title="Organic Spinach Leaves" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
      </div>

      {/* 5. PROMO BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="md:col-span-2 bg-gray-900 rounded-2xl h-80 relative overflow-hidden flex flex-col justify-center p-10">
          <div className="z-10 text-white">
            <h3 className="text-4xl font-bold mb-2">Items on SALE</h3>
            <p className="text-gray-300 mb-6">Discounts up to 30%</p>
            <button className="text-sm font-bold uppercase tracking-wider border-b-2 border-white pb-1 hover:text-green-400 hover:border-green-400 transition-colors">Shop Now</button>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gray-800 flex items-center justify-center text-gray-600">[ Fruit Splash Image ]</div>
        </div>
        <div className="flex flex-col gap-6 h-80">
          <div className="flex-1 bg-blue-500 rounded-2xl p-6 flex flex-col justify-center text-white">
            <h3 className="text-xl font-bold mb-1">Combo offers</h3>
            <p className="text-sm text-blue-100 mb-4">Discounts up to 50%</p>
            <button className="text-xs font-bold uppercase tracking-wider border-b border-white w-max pb-1">Shop Now</button>
          </div>
          <div className="flex-1 bg-teal-500 rounded-2xl p-6 flex flex-col justify-center text-white">
            <h3 className="text-xl font-bold mb-1">Discount Coupons</h3>
            <p className="text-sm text-teal-100 mb-4">Discounts up to 40%</p>
            <button className="text-xs font-bold uppercase tracking-wider border-b border-white w-max pb-1">Shop Now</button>
          </div>
        </div>
      </div>

      {/* 6. DISCOUNT SIGNUP BANNER */}
      <section className="bg-green-800 rounded-2xl p-10 md:p-16 mb-16 flex flex-col md:flex-row items-center justify-between shadow-inner relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leaves.png')]"></div>
        <div className="md:w-1/2 text-white z-10 mb-6 md:mb-0">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Get 25% Discount on your first purchase</h2>
          <p className="text-green-100">Just Sign Up & Register it now to become member.</p>
        </div>
        <div className="md:w-5/12 w-full flex flex-col gap-3 z-10">
          <input type="text" placeholder="Name" className="w-full px-4 py-3 rounded-md outline-none text-gray-800" />
          <input type="email" placeholder="Email Address" className="w-full px-4 py-3 rounded-md outline-none text-gray-800" />
          <button className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-md transition-colors mt-1">Submit</button>
        </div>
      </section>

      {/* 7. JUST ARRIVED (More Products) */}
      <SectionHeader title="Just arrived" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-16">
        <ProductCard title="Sunstar Fresh Melon Juice" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
        <ProductCard title="Whole Wheat Sandwich Bread" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
        <ProductCard title="Sunstar Fresh Melon Juice" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
        <ProductCard title="Gourmet Dark Chocolate" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
        <ProductCard title="Sunstar Fresh Melon Juice" oldPrice="24.00" price="18.00" discount="10%" reviews="222" />
      </div>

      {/* 8. OUR RECENT BLOG */}
      <SectionHeader title="Our Recent Blog" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <BlogCard date="12 JAN 2024" category="FOOD" title="Top 10 reason fresh filters to detox on your body" excerpt="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac feugiat erat." />
        <BlogCard date="14 FEB 2024" category="ORGANIC" title="Latest trends of wearing street wears supremely" excerpt="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac feugiat erat." />
        <BlogCard date="22 MAR 2024" category="VEGGIES" title="10 Different Types of comfortable clothes ideas for women" excerpt="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam ac feugiat erat." />
      </div>

      {/* 9. APP DOWNLOAD BANNER */}
      <section className="bg-yellow-400 rounded-3xl p-10 md:p-16 mb-16 flex flex-col md:flex-row items-center justify-between">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Download Organic App</h2>
          <p className="text-gray-800 mb-8 font-medium">Online Orders made easy, fast and reliable</p>
          <div className="flex gap-4">
            <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors">
              <span className="text-xl">🍏</span> <div className="text-left"><p className="text-[10px] leading-none text-gray-300">Download on the</p><p className="font-bold leading-none">App Store</p></div>
            </button>
            <button className="bg-black text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-800 transition-colors">
              <span className="text-xl">▶️</span> <div className="text-left"><p className="text-[10px] leading-none text-gray-300">GET IT ON</p><p className="font-bold leading-none">Google Play</p></div>
            </button>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center relative">
           <div className="w-64 h-80 bg-gray-100 rounded-3xl border-8 border-gray-900 flex items-center justify-center shadow-2xl">
             <span className="text-gray-400 font-bold">[ Phone Mockup ]</span>
           </div>
        </div>
      </section>

      {/* 10. POPULAR TAGS & FEATURE BOXES */}
      <div className="mb-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">People are also looking for</h3>
        <div className="flex flex-wrap gap-3 mb-16">
          {popularTags.map((tag, i) => (
            <span key={i} className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-full cursor-pointer hover:bg-green-500 hover:text-white transition-colors">{tag}</span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
           <FeatureBox icon={<Package size={24} />} title="Free delivery" description="Lorem ipsum dolor sit amet, consectetur adipi elit." />
           <FeatureBox icon={<ShieldCheck size={24} />} title="100% secure payment" description="Lorem ipsum dolor sit amet, consectetur adipi elit." />
           <FeatureBox icon={<RotateCcw size={24} />} title="Quality guarantee" description="Lorem ipsum dolor sit amet, consectetur adipi elit." />
           <FeatureBox icon={<BadgePercent size={24} />} title="Guaranteed savings" description="Lorem ipsum dolor sit amet, consectetur adipi elit." />
           <FeatureBox icon={<Gift size={24} />} title="Daily offers" description="Lorem ipsum dolor sit amet, consectetur adipi elit." />
        </div>
      </div>

    </div>
  );
};

export default Home;