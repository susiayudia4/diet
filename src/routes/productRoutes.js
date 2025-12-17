import express from 'express';
import { productController } from '../controllers/productController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить все продукты
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, productController.getAll);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Добавить новый продукт
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, productController.create);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить продукт
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, productController.delete);

export default router;
