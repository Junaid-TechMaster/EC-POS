// backend/seeder.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
//import users from './data/users.js'; // We will skip users for now since you already registered!
import products from './data/products.js';
import User from './models/userModel.js';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await Product.deleteMany(); // Clear out any existing junk

    // 1. Get the admin user we just created in the DB (to assign as the creator)
    const adminUser = await User.findOne(); 

    // 2. Attach the admin user to our sample products
    const sampleProducts = products.map((product) => {
      return { ...product, user: adminUser._id };
    });

    // 3. Inject them into MongoDB!
    await Product.insertMany(sampleProducts);

    console.log('Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();