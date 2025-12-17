import express from 'express';
import { mealController } from '../controllers/mealController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/meals:
 *   get:
 *     summary: Получить записи о приемах пищи по дате
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Дата в формате YYYY-MM-DD
 */
router.get('/', authenticateToken, mealController.getByDate);

/**
 * @swagger
 * /api/meals:
 *   post:
 *     summary: Добавить запись о приеме пищи
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, mealController.add);

/**
 * @swagger
 * /api/meals/{id}:
 *   delete:
 *     summary: Удалить запись о приеме пищи
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, mealController.delete);

export default router;
