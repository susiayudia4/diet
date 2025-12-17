import db from '../db/database.js';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  try {
    // Проверяем есть ли уже данные
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    if (userCount > 0) {
      console.log('✅ База уже содержит данные');
      return;
    }

    // Создаём тестовых пользователей
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    db.prepare(`
      INSERT INTO users (username, email, password, role, daily_calorie_goal, age, weight, height, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user1', 'user1@example.com', hashedPassword, 'user', 2000, 25, 75, 180, 'M');

    db.prepare(`
      INSERT INTO users (username, email, password, role, daily_calorie_goal, age, weight, height, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('user2', 'user2@example.com', hashedPassword, 'user', 2200, 30, 65, 170, 'F');

    db.prepare(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('dietitian1', 'dietitian1@example.com', hashedPassword, 'dietitian');

    db.prepare(`
      INSERT INTO users (username, email, password, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@example.com', hashedPassword, 'admin');

    // Добавляем стандартные продукты для первого пользователя
    const defaultProducts = [
      // Мясо и рыба
      { name: 'Куриная грудка', calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, portion: '100g' },
      { name: 'Лосось', calories: 208, protein: 22, carbs: 0, fats: 13, fiber: 0, portion: '100g' },
      { name: 'Говядина', calories: 250, protein: 26, carbs: 0, fats: 17, fiber: 0, portion: '100g' },
      { name: 'Индейка', calories: 160, protein: 30, carbs: 0, fats: 3.5, fiber: 0, portion: '100g' },
      { name: 'Тунец', calories: 144, protein: 30, carbs: 0, fats: 1, fiber: 0, portion: '100g' },
      { name: 'Яйцо куриное', calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0, portion: '1 шт' },
      
      // Крупы и зерновые
      { name: 'Рис белый', calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4, portion: '100g' },
      { name: 'Гречка', calories: 343, protein: 13, carbs: 72, fats: 3.4, fiber: 11, portion: '100g' },
      { name: 'Овсянка', calories: 389, protein: 17, carbs: 66, fats: 7, fiber: 11, portion: '100g' },
      { name: 'Киноа', calories: 368, protein: 14, carbs: 64, fats: 6, fiber: 7, portion: '100g' },
      { name: 'Хлеб пшеничный', calories: 265, protein: 9, carbs: 49, fats: 3.3, fiber: 7, portion: '100g' },
      { name: 'Хлеб цельнозерновой', calories: 247, protein: 13, carbs: 41, fats: 4.2, fiber: 7, portion: '100g' },
      { name: 'Макароны', calories: 131, protein: 5, carbs: 25, fats: 1.1, fiber: 1.8, portion: '100g' },
      
      // Овощи
      { name: 'Брокколи', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.4, portion: '100g' },
      { name: 'Помидор', calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2, portion: '100g' },
      { name: 'Огурец', calories: 16, protein: 0.7, carbs: 4, fats: 0.1, fiber: 0.5, portion: '100g' },
      { name: 'Морковь', calories: 41, protein: 0.9, carbs: 10, fats: 0.2, fiber: 2.8, portion: '100g' },
      { name: 'Капуста', calories: 25, protein: 1.3, carbs: 6, fats: 0.1, fiber: 2.5, portion: '100g' },
      { name: 'Шпинат', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, portion: '100g' },
      { name: 'Перец болгарский', calories: 31, protein: 1, carbs: 7, fats: 0.3, fiber: 2.5, portion: '100g' },
      { name: 'Цукини', calories: 17, protein: 1.2, carbs: 3.1, fats: 0.3, fiber: 1, portion: '100g' },
      { name: 'Картофель', calories: 77, protein: 2, carbs: 17, fats: 0.1, fiber: 2.2, portion: '100g' },
      { name: 'Лук', calories: 40, protein: 1.1, carbs: 9, fats: 0.1, fiber: 1.7, portion: '100g' },
      
      // Фрукты
      { name: 'Банан', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, portion: '1 шт' },
      { name: 'Яблоко', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, portion: '1 шт' },
      { name: 'Апельсин', calories: 47, protein: 0.9, carbs: 12, fats: 0.1, fiber: 2.4, portion: '1 шт' },
      { name: 'Груша', calories: 57, protein: 0.4, carbs: 15, fats: 0.1, fiber: 3.1, portion: '1 шт' },
      { name: 'Клубника', calories: 32, protein: 0.7, carbs: 8, fats: 0.3, fiber: 2, portion: '100g' },
      { name: 'Виноград', calories: 69, protein: 0.7, carbs: 18, fats: 0.2, fiber: 0.9, portion: '100g' },
      { name: 'Абрикос', calories: 48, protein: 1.4, carbs: 11, fats: 0.4, fiber: 2, portion: '1 шт' },
      { name: 'Персик', calories: 39, protein: 0.9, carbs: 10, fats: 0.3, fiber: 1.5, portion: '1 шт' },
      { name: 'Киви', calories: 61, protein: 1.1, carbs: 15, fats: 0.5, fiber: 3, portion: '1 шт' },
      { name: 'Авокадо', calories: 160, protein: 2, carbs: 9, fats: 15, fiber: 7, portion: '100g' },
      
      // Молочные продукты
      { name: 'Молоко', calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, fiber: 0, portion: '100мл' },
      { name: 'Сыр', calories: 402, protein: 25, carbs: 1.3, fats: 33, fiber: 0, portion: '100g' },
      { name: 'Творог', calories: 98, protein: 11, carbs: 3.3, fats: 4.3, fiber: 0, portion: '100g' },
      { name: 'Йогурт', calories: 59, protein: 10, carbs: 3.6, fats: 0.4, fiber: 0, portion: '100г' },
      { name: 'Кефир', calories: 41, protein: 3, carbs: 4, fats: 1, fiber: 0, portion: '100мл' },
      { name: 'Сметана', calories: 206, protein: 2.8, carbs: 3.2, fats: 20, fiber: 0, portion: '100г' },
      
      // Орехи и семена
      { name: 'Миндаль', calories: 579, protein: 21, carbs: 22, fats: 50, fiber: 12, portion: '100g' },
      { name: 'Грецкий орех', calories: 654, protein: 15, carbs: 14, fats: 65, fiber: 6.7, portion: '100g' },
      { name: 'Арахис', calories: 567, protein: 26, carbs: 16, fats: 49, fiber: 8.5, portion: '100g' },
      { name: 'Семена чиа', calories: 486, protein: 17, carbs: 42, fats: 31, fiber: 34, portion: '100g' },
      
      // Бобовые
      { name: 'Чечевица', calories: 116, protein: 9, carbs: 20, fats: 0.4, fiber: 7.9, portion: '100g' },
      { name: 'Фасоль', calories: 127, protein: 8.7, carbs: 22.8, fats: 0.5, fiber: 6.4, portion: '100g' },
      { name: 'Нут', calories: 364, protein: 19, carbs: 61, fats: 6, fiber: 17, portion: '100g' },
      
      // Масла и жиры
      { name: 'Оливковое масло', calories: 884, protein: 0, carbs: 0, fats: 100, fiber: 0, portion: '100мл' },
      { name: 'Подсолнечное масло', calories: 884, protein: 0, carbs: 0, fats: 100, fiber: 0, portion: '100мл' },
      { name: 'Сливочное масло', calories: 717, protein: 0.5, carbs: 0.8, fats: 81, fiber: 0, portion: '100г' },
      
      // Напитки
      { name: 'Вода', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, portion: '100мл' },
      { name: 'Кофе', calories: 2, protein: 0.1, carbs: 0, fats: 0, fiber: 0, portion: '100мл' },
      { name: 'Зеленый чай', calories: 1, protein: 0, carbs: 0, fats: 0, fiber: 0, portion: '100мл' },
      
      // Сладости и десерты
      { name: 'Мед', calories: 304, protein: 0.3, carbs: 82, fats: 0, fiber: 0.2, portion: '100г' },
      { name: 'Шоколад темный', calories: 546, protein: 7.8, carbs: 45, fats: 31, fiber: 10.9, portion: '100г' },
      { name: 'Овсяное печенье', calories: 471, protein: 6, carbs: 66, fats: 18, fiber: 2.3, portion: '100г' }
    ];

    for (const product of defaultProducts) {
      db.prepare(`
        INSERT INTO products (user_id, name, calories, protein, carbs, fats, fiber, portion_size, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(1, product.name, product.calories, product.protein, product.carbs, product.fats, product.fiber, product.portion);
    }

    // Добавляем примеры рецептов
    const recipeId = db.prepare(`
      INSERT INTO recipes (user_id, name, description)
      VALUES (?, ?, ?)
    `).run(1, 'Куриная грудка с рисом', 'Простой и полезный рецепт').lastInsertRowid;

    db.prepare(`
      INSERT INTO recipe_items (recipe_id, product_id, quantity)
      VALUES (?, 1, 150)
    `).run(recipeId);

    db.prepare(`
      INSERT INTO recipe_items (recipe_id, product_id, quantity)
      VALUES (?, 2, 100)
    `).run(recipeId);

    // Добавляем примеры записей о приёмах пищи
    const today = new Date().toISOString().split('T')[0];
    
    db.prepare(`
      INSERT INTO meal_entries (user_id, product_id, meal_type, quantity, date)
      VALUES (?, 1, 'breakfast', 2, ?)
    `).run(1, today);

    db.prepare(`
      INSERT INTO meal_entries (user_id, product_id, meal_type, quantity, date)
      VALUES (?, 2, 'lunch', 1.5, ?)
    `).run(1, today);

    // Добавляем пример цели
    db.prepare(`
      INSERT INTO goals (user_id, goal_type, target_value, current_value, start_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(1, 'calorie', 2000, 1500, today);

    console.log('✅ Тестовые данные добавлены успешно');
  } catch (error) {
    console.error('❌ Ошибка при заполнении БД:', error);
  }
}
