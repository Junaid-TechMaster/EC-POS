import asyncHandler from 'express-async-handler';
import ActivityLog from '../models/activityLogModel.js';

export const getActivityLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 50;
  const { entity, action } = req.query;
  const filter = {};
  if (entity) filter.entity = entity;
  if (action) filter.action = { $regex: action, $options: 'i' };
  const [total, logs] = await Promise.all([
    ActivityLog.countDocuments(filter),
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
  ]);
  res.json({ logs, page, pages: Math.ceil(total / pageSize), total });
});

export const getEntityLogs = asyncHandler(async (req, res) => {
  const { entity, id } = req.params;
  const logs = await ActivityLog.find({ entity, entityId: id }).sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});
