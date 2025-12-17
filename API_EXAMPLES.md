# 🔌 API Примеры использования

## Базовая информация

- **Base URL**: `http://localhost:3000/api`
- **Документация**: `http://localhost:3000/api-docs`
- **Аутентификация**: Bearer Token (JWT)

## 🔐 Аутентификация

### Регистрация

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "role": "user"
  }'
```

**Ответ:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

### Вход

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Получить текущего пользователя

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Обновить профиль

```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "daily_calorie_goal": 2500,
    "age": 30,
    "weight": 75.5,
    "height": 180,
    "gender": "M"
  }'
```

## 🍎 Продукты

### Получить все продукты

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ:**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Курица (100г)",
      "calories": 165,
      "protein": 31,
      "carbs": 0,
      "fats": 3.6,
      "portion_size": "100g",
      "is_default": true
    }
  ]
}
```

### Создать продукт

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Салат",
    "calories": 50,
    "protein": 2,
    "carbs": 8,
    "fats": 0.5
  }'
```

### Удалить продукт

```bash
curl -X DELETE http://localhost:3000/api/products/2 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🍽️ Приёмы пищи

### Получить приёмы пищи на дату

```bash
curl -X GET "http://localhost:3000/api/meals?date=2024-01-15" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ:**
```json
{
  "date": "2024-01-15",
  "meals": {
    "breakfast": [
      {
        "id": 1,
        "name": "Яйца вареные",
        "meal_type": "breakfast",
        "quantity": 2,
        "calories": 280,
        "protein": 24,
        "carbs": 2,
        "fats": 20
      }
    ],
    "lunch": [],
    "dinner": [],
    "snack": []
  },
  "stats": {
    "totalCalories": 280,
    "totalProtein": 24,
    "totalCarbs": 2,
    "totalFats": 20,
    "dailyGoal": 2000,
    "remaining": 1720
  }
}
```

### Добавить приём пищи

```bash
curl -X POST http://localhost:3000/api/meals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "meal_type": "breakfast",
    "quantity": 1,
    "date": "2024-01-15"
  }'
```

**Параметры:**
- `product_id` - ID продукта
- `meal_type` - "breakfast", "lunch", "dinner", или "snack"
- `quantity` - Количество порций (по умолчанию 1)
- `date` - Дата в формате YYYY-MM-DD (по умолчанию сегодня)

### Удалить приём пищи

```bash
curl -X DELETE http://localhost:3000/api/meals/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Статистика

### Еженедельная статистика

```bash
curl -X GET http://localhost:3000/api/stats/weekly \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Ответ:**
```json
[
  {
    "date": "2024-01-08",
    "calories": 2100,
    "protein": 120,
    "carbs": 250,
    "fats": 65
  },
  {
    "date": "2024-01-09",
    "calories": 1950,
    "protein": 110,
    "carbs": 220,
    "fats": 60
  }
]
```

### Ежемесячная статистика

```bash
curl -X GET http://localhost:3000/api/stats/monthly \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔄 Коды ответов

- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `400 Bad Request` - Неверные параметры
- `401 Unauthorized` - Требуется аутентификация
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Ошибка сервера

## 🛡️ Безопасность

- Все запросы к защищенным эндпоинтам требуют JWT токен
- Токен передается в заголовке: `Authorization: Bearer TOKEN`
- Токен действует 7 дней
- Пароли хешируются с помощью bcryptjs (10 раундов)

## 📝 JavaScript пример

```javascript
// Вход
async function login(email, password) {
  const response = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
}

// Получить продукты
async function getProducts() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/products', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  return await response.json();
}

// Добавить приём пищи
async function addMeal(productId, mealType, quantity) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/meals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: productId,
      meal_type: mealType,
      quantity: quantity
    })
  });
  
  return await response.json();
}
```

## 🚀 Интеграция в фронтенд

В приложении используется глобальный объект `api` с функциями для всех эндпоинтов:

```javascript
// Аутентификация
api.auth.login(email, password)
api.auth.register(username, email, password, role)
api.auth.getMe()
api.auth.updateProfile(data)

// Продукты
api.products.getAll()
api.products.create(name, calories, protein, carbs, fats)
api.products.delete(id)

// Приёмы пищи
api.meals.getByDate(date)
api.meals.add(productId, mealType, quantity, date)
api.meals.delete(id)

// Статистика
api.stats.getWeekly()
api.stats.getMonthly()
```
