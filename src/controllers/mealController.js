import db from '../db/database.js';

export const mealController = {
  getByDate: (req, res) => {
    try {
      const { date } = req.query;
      const queryDate = date || new Date().toISOString().split('T')[0];

      const meals = db.prepare(`
        SELECT 
          me.id,
          me.meal_type,
          me.quantity,
          me.date,
          p.id as product_id,
          p.name,
          p.calories,
          p.protein,
          p.carbs,
          p.fats,
          p.fiber
        FROM meal_entries me
        LEFT JOIN products p ON me.product_id = p.id
        WHERE me.user_id = ? AND me.date = ?
        ORDER BY me.meal_type
      `).all(req.user.id, queryDate);

      // Группируем по типам приёма пищи и вычисляем статистику
      const stats = { breakfast: [], lunch: [], dinner: [], snack: [] };
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFats = 0;

      meals.forEach(meal => {
        const mealData = {
          id: meal.id,
          quantity: meal.quantity,
          name: meal.name,
          calories: meal.calories * meal.quantity,
          protein: meal.protein * meal.quantity,
          carbs: meal.carbs * meal.quantity,
          fats: meal.fats * meal.quantity
        };

        stats[meal.meal_type].push(mealData);
        totalCalories += mealData.calories;
        totalProtein += mealData.protein;
        totalCarbs += mealData.carbs;
        totalFats += mealData.fats;
      });

      const user = db.prepare('SELECT daily_calorie_goal FROM users WHERE id = ?').get(req.user.id);

      res.json({
        date: queryDate,
        meals: stats,
        stats: {
          totalCalories: Math.round(totalCalories * 10) / 10,
          totalProtein: Math.round(totalProtein * 10) / 10,
          totalCarbs: Math.round(totalCarbs * 10) / 10,
          totalFats: Math.round(totalFats * 10) / 10,
          dailyGoal: user.daily_calorie_goal,
          remaining: user.daily_calorie_goal - totalCalories
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  add: (req, res) => {
    try {
      const { product_id, meal_type, quantity = 1, date } = req.body;

      if (!product_id || !meal_type) {
        return res.status(400).json({ error: 'Продукт и тип приема обязательны' });
      }

      const queryDate = date || new Date().toISOString().split('T')[0];

      const result = db.prepare(`
        INSERT INTO meal_entries (user_id, product_id, meal_type, quantity, date)
        VALUES (?, ?, ?, ?, ?)
      `).run(req.user.id, product_id, meal_type, quantity, queryDate);

      res.json({ id: result.lastInsertRowid, message: 'Запись добавлена' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;

      db.prepare('DELETE FROM meal_entries WHERE id = ? AND user_id = ?').run(id, req.user.id);
      res.json({ message: 'Запись удалена' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
