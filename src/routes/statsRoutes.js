import express from 'express';
import { statsController } from '../controllers/statsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /api/stats/weekly:
 *   get:
 *     summary: Получить статистику за неделю
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/weekly', authenticateToken, statsController.getWeeklyStats);

/**
 * @swagger
 * /api/stats/monthly:
 *   get:
 *     summary: Получить статистику за месяц
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 */
router.get('/monthly', authenticateToken, statsController.getMonthlyStats);

export default router;
