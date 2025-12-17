import express from 'express';
import cors from 'cors';
import 'express-async-errors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Импорты
import { initializeDatabase } from './src/db/database.js';
import { seedDatabase } from './src/db/seed.js';
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import mealRoutes from './src/routes/mealRoutes.js';
import statsRoutes from './src/routes/statsRoutes.js';

dotenv.config();

// Проверка обязательных переменных окружения
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET не установлен, используем значение по умолчанию');
  process.env.JWT_SECRET = 'calorie-tracker-secret-key-2024-super-secure-random-string';
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Swagger документация
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CalorieTracker API',
      version: '1.0.0',
      description: 'API для приложения учёта калорий и макронутриентов'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Инициализация (асинхронная)
(async () => {
  try {
    await initializeDatabase();
    seedDatabase();
    
    // Запускаем сервер только после инициализации БД
    app.listen(PORT, () => {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║     🍎 CalorieTracker Server started successfully! 🍎    ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📚 API documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Frontend: http://localhost:${PORT}\n`);
      console.log('Available APIs:');
      console.log('  POST   /api/auth/register');
      console.log('  POST   /api/auth/login');
      console.log('  GET    /api/auth/me');
      console.log('  PUT    /api/auth/profile');
      console.log('  GET    /api/products');
      console.log('  POST   /api/products');
      console.log('  DELETE /api/products/:id');
      console.log('  GET    /api/meals');
      console.log('  POST   /api/meals');
      console.log('  DELETE /api/meals/:id');
      console.log('  GET    /api/stats/weekly');
      console.log('  GET    /api/stats/monthly');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Ошибка при инициализации:', error);
    process.exit(1);
  }
})();
