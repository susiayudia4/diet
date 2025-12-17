import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'app.db');

let SQL;
let db;

// Инициализация SQL.js и загрузка базы данных
async function initDatabase() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
}

// Обертка для совместимости с better-sqlite3 API
class DatabaseWrapper {
  constructor(database) {
    this.db = database;
  }

  prepare(sql) {
    return new StatementWrapper(this.db, sql);
  }

  exec(sql) {
    this.db.exec(sql);
  }
}

// Преобразование SQL запросов для sql.js (замена ? на ?1, ?2, ...)
function convertSQL(sql) {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `?${paramIndex++}`);
}

class StatementWrapper {
  constructor(database, sql) {
    this.db = database;
    this.sql = convertSQL(sql);
  }

  get(...params) {
    const stmt = this.db.prepare(this.sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const result = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return result;
  }

  all(...params) {
    const stmt = this.db.prepare(this.sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
  }

  run(...params) {
    const stmt = this.db.prepare(this.sql);
    if (params && params.length > 0) {
      stmt.bind(params);
    }
    stmt.step();
    let lastInsertRowid = null;
    try {
      const result = this.db.exec("SELECT last_insert_rowid() as id");
      if (result && result[0] && result[0].values && result[0].values[0]) {
        lastInsertRowid = result[0].values[0][0];
      }
    } catch (e) {
      // Игнорируем ошибку, если это не INSERT запрос
    }
    stmt.free();
    return { lastInsertRowid: lastInsertRowid || null };
  }
}

// Инициализация базы данных
let dbInitialized = false;
let dbWrapper;

export async function initializeDatabase() {
  if (!dbInitialized) {
    await initDatabase();
    dbWrapper = new DatabaseWrapper(db);
    dbInitialized = true;
  }

  // Создание таблиц
  db.run(`
    -- Таблица пользователей
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'dietitian', 'admin')),
      daily_calorie_goal INTEGER DEFAULT 2000,
      age INTEGER,
      weight REAL,
      height REAL,
      gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Таблица продуктов
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fats REAL DEFAULT 0,
      fiber REAL DEFAULT 0,
      portion_size TEXT DEFAULT '100g',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Таблица рецептов
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Таблица ингредиентов рецептов
    CREATE TABLE IF NOT EXISTS recipe_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      FOREIGN KEY(recipe_id) REFERENCES recipes(id),
      FOREIGN KEY(product_id) REFERENCES products(id)
    );

    -- Таблица записей о приёме пищи
    CREATE TABLE IF NOT EXISTS meal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER,
      recipe_id INTEGER,
      meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      quantity REAL DEFAULT 1,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(product_id) REFERENCES products(id),
      FOREIGN KEY(recipe_id) REFERENCES recipes(id)
    );

    -- Таблица целей
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      goal_type TEXT CHECK(goal_type IN ('calorie', 'weight', 'macro')),
      target_value REAL NOT NULL,
      current_value REAL,
      start_date DATE NOT NULL,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Таблица консультаций (для диетологов)
    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dietitian_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'completed')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(dietitian_id) REFERENCES users(id)
    );

    -- Индексы для производительности
    CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON meal_entries(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
  `);

  saveDatabase();
  console.log('✅ База данных инициализирована');
  
  // Обновляем dbWrapper после инициализации
  if (!dbWrapper) {
    dbWrapper = new DatabaseWrapper(db);
  }
}

// Сохранение базы данных в файл
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Экспорт будет установлен после инициализации
export default new Proxy({}, {
  get(target, prop) {
    if (!dbWrapper) {
      throw new Error('База данных не инициализирована. Вызовите initializeDatabase() сначала.');
    }
    if (prop === 'prepare') {
      return function(sql) {
        const stmt = dbWrapper.prepare(sql);
        return new Proxy(stmt, {
          get(stmtTarget, stmtProp) {
            const original = stmtTarget[stmtProp];
            if (typeof original === 'function' && (stmtProp === 'run' || stmtProp === 'get' || stmtProp === 'all')) {
              return function(...args) {
                const result = original.apply(stmtTarget, args);
                saveDatabase();
                return result;
              };
            }
            return original;
          }
        });
      };
    }
    if (prop === 'exec') {
      return function(sql) {
        dbWrapper.exec(sql);
        saveDatabase();
      };
    }
    return dbWrapper[prop];
  }
});
