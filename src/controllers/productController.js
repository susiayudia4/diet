import db from '../db/database.js';

export const productController = {
  getAll: (req, res) => {
    try {
      const products = db.prepare(`
        SELECT * FROM products 
        WHERE is_default = 1 OR user_id = ?
        ORDER BY name
      `).all(req.user.id);

      res.json(products);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  create: (req, res) => {
    try {
      const { name, calories, protein = 0, carbs = 0, fats = 0, fiber = 0, portion_size = '100g' } = req.body;

      if (!name || !calories) {
        return res.status(400).json({ error: 'Название и калории обязательны' });
      }

      const result = db.prepare(`
        INSERT INTO products (user_id, name, calories, protein, carbs, fats, fiber, portion_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(req.user.id, name, calories, protein, carbs, fats, fiber, portion_size);

      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  delete: (req, res) => {
    try {
      const { id } = req.params;

      db.prepare('DELETE FROM products WHERE id = ? AND user_id = ?').run(id, req.user.id);
      res.json({ message: 'Продукт удален' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
