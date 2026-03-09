import express from 'express';
import { verifyAccessToken } from '../../middlewares/authMiddleware.js';
import * as DigitalController from './digital.controller.js';

const router = express.Router();

router.use(verifyAccessToken);

router.get('/', DigitalController.getProducts);
router.get('/:id', DigitalController.getProductDetail);
router.post('/validate-discount', DigitalController.validateDiscountCode);
router.post('/checkout', DigitalController.checkout);

export default router;
