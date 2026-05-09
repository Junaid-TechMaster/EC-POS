import asyncHandler from 'express-async-handler';
import Category from '../models/categoryModel.js';

// @desc    Get all active categories
// @route   GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  res.json(categories);
});

// @desc    Get single category by slug
// @route   GET /api/categories/:slug
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  res.json(category);
});

// @desc    Create a category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, description, image, icon, color, subcategories, sortOrder } = req.body;

  const exists = await Category.findOne({ slug });
  if (exists) {
    res.status(400);
    throw new Error('Category with this slug already exists');
  }

  const category = await Category.create({
    name,
    slug,
    description,
    image,
    icon,
    color,
    subcategories: subcategories || [],
    sortOrder: sortOrder || 0,
  });

  res.status(201).json(category);
});

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }

  const { name, slug, description, image, icon, color, subcategories, sortOrder, isActive } = req.body;

  category.name = name ?? category.name;
  category.slug = slug ?? category.slug;
  category.description = description ?? category.description;
  category.image = image ?? category.image;
  category.icon = icon ?? category.icon;
  category.color = color ?? category.color;
  category.subcategories = subcategories ?? category.subcategories;
  category.sortOrder = sortOrder ?? category.sortOrder;
  category.isActive = isActive ?? category.isActive;

  const updated = await category.save();
  res.json(updated);
});

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Category not found');
  }
  await Category.deleteOne({ _id: category._id });
  res.json({ message: 'Category removed' });
});
