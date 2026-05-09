import asyncHandler from 'express-async-handler';
import Combo from '../models/comboModel.js';

const PRODUCT_FIELDS = 'name price image images slug';

export const getCombos = asyncHandler(async (req, res) => {
  const filter = req.query.all === '1' ? {} : { isActive: true };
  const combos = await Combo.find(filter)
    .populate('products.product', PRODUCT_FIELDS)
    .sort({ createdAt: -1 });
  res.json(combos);
});

export const createCombo = asyncHandler(async (req, res) => {
  const { name, description, image, products, combinedPrice, isActive } = req.body;
  const combo = await Combo.create({ name, description, image, products, combinedPrice, isActive });
  const populated = await combo.populate('products.product', PRODUCT_FIELDS);
  res.status(201).json(populated);
});

export const updateCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  if (!combo) { res.status(404); throw new Error('Combo not found'); }
  const { name, description, image, products, combinedPrice, isActive } = req.body;
  if (name !== undefined) combo.name = name;
  if (description !== undefined) combo.description = description;
  if (image !== undefined) combo.image = image;
  if (products !== undefined) combo.products = products;
  if (combinedPrice !== undefined) combo.combinedPrice = combinedPrice;
  if (isActive !== undefined) combo.isActive = isActive;
  const updated = await combo.save();
  await updated.populate('products.product', PRODUCT_FIELDS);
  res.json(updated);
});

export const deleteCombo = asyncHandler(async (req, res) => {
  const combo = await Combo.findByIdAndDelete(req.params.id);
  if (!combo) { res.status(404); throw new Error('Combo not found'); }
  res.json({ message: 'Combo deleted' });
});
