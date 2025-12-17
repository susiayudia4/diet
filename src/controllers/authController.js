import db from '../db/database.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const authController = {
  register: (req, res) => {
    try {
      const { username, email, password, role = 'user' } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Заполните все поля' });
      }

      // Проверяем существует ли пользователь
      const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
      if (existing) {
        return res.status(400).json({ error: 'Пользователь уже существует' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare(`
        INSERT INTO users (username, email, password, role, daily_calorie_goal)
        VALUES (?, ?, ?, ?, 2000)
      `).run(username, email, hashedPassword, role);

      const user = {
        id: result.lastInsertRowid,
        username,
        email,
        role
      };

      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, user });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  login: (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Неверные учетные данные' });
      }

      const tokenUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };

      const token = jwt.sign(tokenUser, process.env.JWT_SECRET, { expiresIn: '7d' });

      res.json({ token, user: tokenUser });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getMe: (req, res) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateProfile: (req, res) => {
    try {
      const { daily_calorie_goal, age, weight, height, gender } = req.body;

      const result = db.prepare(`
        UPDATE users 
        SET daily_calorie_goal = ?, age = ?, weight = ?, height = ?, gender = ?
        WHERE id = ?
      `).run(daily_calorie_goal || 2000, age, weight, height, gender, req.user.id);

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
