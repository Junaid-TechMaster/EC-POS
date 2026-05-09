import ActivityLog from '../models/activityLogModel.js';

export const logActivity = async ({ userId = null, userName = 'System', action, entity = '', entityId = '', details = {}, ip = '' }) => {
  try {
    await ActivityLog.create({ userId, userName, action, entity, entityId, details, ip });
  } catch (_) {
    // Non-blocking — never let logging break the main flow
  }
};
