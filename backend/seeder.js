import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import Category from './models/categoryModel.js';
import connectDB from './config/db.js';
import categories from './data/categories.js';
import products from './data/products.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    // Clear products and categories only — user accounts are preserved
    await Product.deleteMany();
    await Category.deleteMany();

    // Find admin user to attach as product creator; fall back to first user
    const adminUser = await User.findOne({ role: 'admin' }) || await User.findOne();
    if (!adminUser) {
      throw new Error('No user found in DB. Please register an account first, then run the seeder.');
    }

    // Insert 10 categories
    await Category.insertMany(categories);
    console.log(`✓ ${categories.length} categories inserted`);

    // Insert 20 products (all published + visible)
    const seededProducts = products.map((p) => ({
      image: '/placeholder.jpg',  // required legacy field — update images via dashboard
      ...p,
      user: adminUser._id,
      status: p.status || 'published',
      isVisible: p.isVisible !== undefined ? p.isVisible : true,
    }));
    await Product.insertMany(seededProducts);
    console.log(`✓ ${seededProducts.length} products inserted`);

    console.log('\n✅ Data seeded successfully! User accounts were preserved.');
    process.exit();
  } catch (error) {
    console.error(`\n❌ Seeder error: ${error.message}`);
    process.exit(1);
  }
};

importData();
