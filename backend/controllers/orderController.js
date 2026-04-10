// backend/controllers/orderController.js
import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Must be logged in)
export const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, totalPrice } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items found');
  } else {
    // We map over the frontend cart items to format them for our MongoDB schema
    const newOrderItems = orderItems.map((item) => ({
      name: item.name,
      qty: item.qty,
      image: item.image,
      price: item.price,
      product: item.id, // Link to the actual product ID
    }));

    const order = new Order({
      orderItems: newOrderItems,
      user: req.user._id, // Got this from the protect middleware!
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      totalPrice,
    });
    
    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  }
});
// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  // Find all orders where the 'user' matches the currently logged in user's ID
  const orders = await Order.find({ user: req.user._id });
  res.json(orders);
});
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  // We use .populate() to get the name and ID of the user attached to the order!
  const orders = await Order.find({}).populate('user', 'id name');
  res.json(orders);
});