import express from 'express';
import {
  getCustomers, getCustomerById, createCustomer, updateCustomer, deleteCustomer,
  addCustomerNote, deleteCustomerNote,
  getVendors, getVendorById, createVendor, updateVendor, deleteVendor,
  addVendorNote, deleteVendorNote,
} from '../controllers/peopleController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/customers').get(protect, admin, getCustomers).post(protect, admin, createCustomer);
router.route('/customers/:id').get(protect, admin, getCustomerById).put(protect, admin, updateCustomer).delete(protect, admin, deleteCustomer);
router.route('/customers/:id/notes').post(protect, admin, addCustomerNote);
router.route('/customers/:id/notes/:noteId').delete(protect, admin, deleteCustomerNote);

router.route('/vendors').get(protect, admin, getVendors).post(protect, admin, createVendor);
router.route('/vendors/:id').get(protect, admin, getVendorById).put(protect, admin, updateVendor).delete(protect, admin, deleteVendor);
router.route('/vendors/:id/notes').post(protect, admin, addVendorNote);
router.route('/vendors/:id/notes/:noteId').delete(protect, admin, deleteVendorNote);

export default router;
