import express from 'express';
import { requireAdmin } from '../../middlewares/authMiddleware.js';
import * as AdminDigitalController from './admin.digital.controller.js';
import * as AdminDiscountController from './admin.discount.controller.js';

const router = express.Router();

router.use(requireAdmin);

// Digital Products
router.get('/', AdminDigitalController.getAllProducts);
router.post('/', AdminDigitalController.createProduct);
router.get('/:id', AdminDigitalController.getProductById);
router.put('/:id', AdminDigitalController.updateProduct);
router.delete('/:id', AdminDigitalController.deleteProduct);

// Discount Codes
router.get('/discounts/all', AdminDiscountController.getDiscounts);
router.post('/discounts', AdminDiscountController.createDiscount);
router.put('/discounts/:id', AdminDiscountController.updateDiscount);
router.delete('/discounts/:id', AdminDiscountController.deleteDiscount);

export default router;
