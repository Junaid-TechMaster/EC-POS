import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import peopleRoutes from './routes/peopleRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import comboRoutes from './routes/comboRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import cashierRoutes from './routes/cashierRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { handleStripeWebhook } from './controllers/stripeController.js';

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Stripe webhook must receive the raw body — mount BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/combos', comboRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/messages', messageRoutes);

// Serve locally-uploaded images (fallback when Cloudinary not configured)
app.use('/uploads', express.static(path.join(__dirname, '../frontend/public/uploads')));

app.get('/', (req, res) => {
  res.send('EC-POS API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
