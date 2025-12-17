import db from '../db/database.js';

export const statsController = {
  getWeeklyStats: (req, res) => {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);

      const stats = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        const result = db.prepare(`
          SELECT 
            SUM(p.calories * me.quantity) as totalCalories,
            SUM(p.protein * me.quantity) as totalProtein,
            SUM(p.carbs * me.quantity) as totalCarbs,
            SUM(p.fats * me.quantity) as totalFats
          FROM meal_entries me
          LEFT JOIN products p ON me.product_id = p.id
          WHERE me.user_id = ? AND me.date = ?
        `).get(req.user.id, dateStr);

        stats.push({
          date: dateStr,
          calories: result.totalCalories ? Math.round(result.totalCalories * 10) / 10 : 0,
          protein: result.totalProtein ? Math.round(result.totalProtein * 10) / 10 : 0,
          carbs: result.totalCarbs ? Math.round(result.totalCarbs * 10) / 10 : 0,
          fats: result.totalFats ? Math.round(result.totalFats * 10) / 10 : 0
        });
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getMonthlyStats: (req, res) => {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const queryMonth = month || now.getMonth() + 1;
      const queryYear = year || now.getFullYear();

      const stats = db.prepare(`
        SELECT 
          me.date,
          SUM(p.calories * me.quantity) as totalCalories,
          SUM(p.protein * me.quantity) as totalProtein,
          SUM(p.carbs * me.quantity) as totalCarbs,
          SUM(p.fats * me.quantity) as totalFats,
          COUNT(DISTINCT me.id) as mealCount
        FROM meal_entries me
        LEFT JOIN products p ON me.product_id = p.id
        WHERE me.user_id = ? 
          AND strftime('%m', me.date) = ? 
          AND strftime('%Y', me.date) = ?
        GROUP BY me.date
        ORDER BY me.date
      `).all(req.user.id, String(queryMonth).padStart(2, '0'), queryYear);

      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
