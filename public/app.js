// API базовый URL
const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentPage = 'login';

// Утилиты
const utils = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  removeToken: () => localStorage.removeItem('token'),
  getUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  removeUser: () => localStorage.removeItem('user'),
  
  showToast: (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.success}</div>
      <div class="toast-content">
        <div class="toast-message">${message}</div>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Анимация появления
    setTimeout(() => toast.style.opacity = '1', 10);
    
    // Автоматическое удаление
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },
  
  showAlert: (message, type = 'success') => {
    utils.showToast(message, type);
  },

  formatDate: (date) => {
    return new Date(date).toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  },

  getToday: () => new Date().toISOString().split('T')[0],

  formatMacro: (value) => Math.round(value * 10) / 10,
  
  // Калькулятор калорий (BMR - базальный метаболизм)
  calculateBMR: (age, weight, height, gender) => {
    if (!age || !weight || !height || !gender) return null;
    
    // Формула Миффлина-Сан Жеора
    let bmr;
    if (gender === 'M') {
      // Мужчины: BMR = 10 × вес(кг) + 6.25 × рост(см) - 5 × возраст(лет) + 5
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      // Женщины: BMR = 10 × вес(кг) + 6.25 × рост(см) - 5 × возраст(лет) - 161
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    
    return Math.round(bmr);
  },
  
  // Расчет суточной нормы калорий с учетом активности
  calculateDailyCalories: (bmr, activityLevel = 'moderate') => {
    if (!bmr) return null;
    
    const multipliers = {
      sedentary: 1.2,      // Сидячий образ жизни
      light: 1.375,        // Легкая активность (1-3 раза в неделю)
      moderate: 1.55,      // Умеренная активность (3-5 раз в неделю)
      active: 1.725,       // Высокая активность (6-7 раз в неделю)
      veryActive: 1.9      // Очень высокая активность
    };
    
    return Math.round(bmr * (multipliers[activityLevel] || multipliers.moderate));
  }
};

// API функции
const api = {
  call: async (endpoint, options = {}) => {
    const token = utils.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  auth: {
    register: (username, email, password, role = 'user') =>
      api.call('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role })
      }),
    
    login: (email, password) =>
      api.call('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    
    getMe: () => api.call('/auth/me'),
    
    updateProfile: (data) =>
      api.call('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  products: {
    getAll: () => api.call('/products'),
    
    create: (name, calories, protein = 0, carbs = 0, fats = 0) =>
      api.call('/products', {
        method: 'POST',
        body: JSON.stringify({ name, calories, protein, carbs, fats })
      }),
    
    delete: (id) =>
      api.call(`/products/${id}`, { method: 'DELETE' })
  },

  meals: {
    getByDate: (date) =>
      api.call(`/meals?date=${date}`),
    
    add: (product_id, meal_type, quantity = 1, date = utils.getToday()) =>
      api.call('/meals', {
        method: 'POST',
        body: JSON.stringify({ product_id, meal_type, quantity, date })
      }),
    
    delete: (id) =>
      api.call(`/meals/${id}`, { method: 'DELETE' })
  },

  stats: {
    getWeekly: () => api.call('/stats/weekly'),
    getMonthly: () => api.call('/stats/monthly')
  }
};

// UI Компоненты
const ui = {
  showPage: (pageName) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(`${pageName}-page`);
    if (page) page.classList.add('active');
    currentPage = pageName;
  },

  updateHeader: () => {
    const header = document.getElementById('header');
    if (currentUser) {
      header.innerHTML = `
        <nav>
          <div class="nav-content">
            <a href="#" class="logo" onclick="event.preventDefault(); ui.navigateTo('dashboard')">CalorieTracker</a>
            <ul class="nav-links">
              <li><a onclick="ui.navigateTo('dashboard')">Главная</a></li>
              <li><a onclick="ui.navigateTo('diary')">Дневник</a></li>
              <li><a onclick="ui.navigateTo('products')">Продукты</a></li>
              <li><a onclick="ui.navigateTo('stats')">Статистика</a></li>
              <li><a onclick="ui.navigateTo('profile')">Профиль</a></li>
            </ul>
            <div class="nav-right">
              <div class="user-info">
                <strong>${currentUser.username}</strong>
                <small>${currentUser.role === 'dietitian' ? 'Диетолог' : 'Пользователь'}</small>
              </div>
              <button class="btn btn-danger btn-small" onclick="auth.logout()">Выход</button>
            </div>
          </div>
        </nav>
      `;
    } else {
      header.innerHTML = `
        <nav>
          <div class="nav-content">
            <a href="#" class="logo" onclick="event.preventDefault(); ui.navigateTo('login')">CalorieTracker</a>
            <div class="nav-right">
              <button class="btn btn-primary" onclick="ui.navigateTo('login')">Вход</button>
              <button class="btn btn-secondary" onclick="ui.navigateTo('register')">Регистрация</button>
            </div>
          </div>
        </nav>
      `;
    }
  },

  navigateTo: (page) => {
    if (!currentUser && page !== 'login' && page !== 'register') {
      ui.navigateTo('login');
      return;
    }
    ui.showPage(page);
    
    if (page === 'dashboard') pages.dashboard.init();
    else if (page === 'diary') pages.diary.init();
    else if (page === 'products') pages.products.init();
    else if (page === 'stats') pages.stats.init();
    else if (page === 'profile') pages.profile.init();
  }
};

// Auth функции
const auth = {
  login: async (email, password) => {
    try {
      const result = await api.auth.login(email, password);
      utils.setToken(result.token);
      utils.setUser(result.user);
      currentUser = result.user;
      ui.updateHeader();
      ui.navigateTo('dashboard');
      utils.showToast('Вы успешно вошли!', 'success');
    } catch (error) {
      utils.showToast(error.message, 'error');
    }
  },

  register: async (username, email, password, role = 'user') => {
    try {
      const result = await api.auth.register(username, email, password, role);
      utils.setToken(result.token);
      utils.setUser(result.user);
      currentUser = result.user;
      ui.updateHeader();
      ui.navigateTo('dashboard');
      utils.showToast('Регистрация успешна!', 'success');
    } catch (error) {
      utils.showToast(error.message, 'error');
    }
  },

  logout: () => {
    utils.removeToken();
    utils.removeUser();
    currentUser = null;
    ui.updateHeader();
    ui.navigateTo('login');
    utils.showToast('Вы вышли из системы', 'info');
  }
};

// Страницы
const pages = {
  dashboard: {
    init: async () => {
      try {
        const data = await api.meals.getByDate(utils.getToday());
        const stats = data.stats;
        const user = currentUser;

        let html = `
          <div class="container fade-in">
            <h1 style="margin-bottom: var(--spacing-xl);">Главная панель</h1>
            
            <div class="dashboard-container">
              <div class="stat-card primary">
                <div class="stat-label">Калории</div>
                <div class="stat-value">${utils.formatMacro(stats.totalCalories)}</div>
                <div class="stat-sublabel">из ${stats.dailyGoal} ккал</div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${Math.min((stats.totalCalories / stats.dailyGoal) * 100, 100)}%"></div>
                </div>
              </div>

              <div class="stat-card success">
                <div class="stat-label">Белки</div>
                <div class="stat-value">${utils.formatMacro(stats.totalProtein)}г</div>
                <div class="stat-sublabel">Протеин</div>
              </div>

              <div class="stat-card warning">
                <div class="stat-label">Углеводы</div>
                <div class="stat-value">${utils.formatMacro(stats.totalCarbs)}г</div>
                <div class="stat-sublabel">Карбогидраты</div>
              </div>

              <div class="stat-card danger">
                <div class="stat-label">Жиры</div>
                <div class="stat-value">${utils.formatMacro(stats.totalFats)}г</div>
                <div class="stat-sublabel">Липиды</div>
              </div>
            </div>

            <div style="text-align: center; margin-top: var(--spacing-xl);">
              <button class="btn btn-primary btn-large" onclick="ui.navigateTo('diary')">
                ➕ Добавить приём пищи
              </button>
            </div>
          </div>
        `;

        document.getElementById('dashboard-page').innerHTML = html;
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    }
  },

  diary: {
    init: async () => {
      try {
        const date = utils.getToday();
        const data = await api.meals.getByDate(date);
        
        const mealTypes = {
          breakfast: { title: '🌅 Завтрак', icon: '🥣' },
          lunch: { title: '🌞 Обед', icon: '🍽️' },
          dinner: { title: '🌙 Ужин', icon: '🍴' },
          snack: { title: '🍿 Перекус', icon: '🥤' }
        };

        let html = `
          <div class="container fade-in">
            <h1 style="margin-bottom: var(--spacing-xl);">Дневник питания</h1>
            <p style="color: var(--text-secondary); margin-bottom: var(--spacing-lg);">${utils.formatDate(date)}</p>
        `;

        for (const [type, info] of Object.entries(mealTypes)) {
          const meals = data.meals[type] || [];
          
          html += `
            <div class="meal-section">
              <div class="meal-section-title">${info.title}</div>
              <div class="meals-container">
          `;

          if (meals.length === 0) {
            html += `<p style="color: var(--text-muted); text-align: center; padding: var(--spacing-lg);">Нет записей</p>`;
          } else {
            meals.forEach(meal => {
              html += `
                <div class="meal-item">
                  <div class="meal-info">
                    <div class="meal-name">${meal.name}</div>
                    <div class="meal-macros">
                      <span>🔥 ${utils.formatMacro(meal.calories)} ккал</span>
                      <span>💪 ${utils.formatMacro(meal.protein)}г белков</span>
                      <span>x${meal.quantity}</span>
                    </div>
                  </div>
                  <div class="meal-actions">
                    <button class="btn btn-danger btn-small" onclick="pages.diary.deleteMeal(${meal.id})" title="Удалить">🗑️</button>
                  </div>
                </div>
              `;
            });
          }

          html += `
              <button class="btn btn-primary btn-small" onclick="pages.diary.openAddMealModal('${type}')" style="width: 100%; margin-top: var(--spacing);">
                ➕ Добавить ${info.title.split(' ')[1].toLowerCase()}
              </button>
              </div>
            </div>
          `;
        }

        html += `
            <div class="card" style="background: var(--gradient-green); color: white; border: none; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);">
              <div class="card-title" style="color: white;">📊 Итого за день</div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--spacing-lg);">
                <div>
                  <div style="opacity: 0.9; margin-bottom: var(--spacing-sm); font-size: 0.875rem;">Калории</div>
                  <div style="font-size: 2rem; font-weight: 800;">${utils.formatMacro(data.stats.totalCalories)}</div>
                  <div style="opacity: 0.8; font-size: 0.875rem; margin-top: var(--spacing-xs);">из ${data.stats.dailyGoal}</div>
                </div>
                <div>
                  <div style="opacity: 0.9; margin-bottom: var(--spacing-sm); font-size: 0.875rem;">Белки</div>
                  <div style="font-size: 2rem; font-weight: 800;">${utils.formatMacro(data.stats.totalProtein)}г</div>
                </div>
                <div>
                  <div style="opacity: 0.9; margin-bottom: var(--spacing-sm); font-size: 0.875rem;">Углеводы</div>
                  <div style="font-size: 2rem; font-weight: 800;">${utils.formatMacro(data.stats.totalCarbs)}г</div>
                </div>
                <div>
                  <div style="opacity: 0.9; margin-bottom: var(--spacing-sm); font-size: 0.875rem;">Жиры</div>
                  <div style="font-size: 2rem; font-weight: 800;">${utils.formatMacro(data.stats.totalFats)}г</div>
                </div>
              </div>
              <div style="margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid rgba(255,255,255,0.2);">
                <div style="font-size: 1.125rem; font-weight: 600;">
                  ${data.stats.remaining > 0 ? '✅' : '⚠️'} Осталось до цели: <strong>${utils.formatMacro(data.stats.remaining)} ккал</strong>
                </div>
              </div>
            </div>
          </div>
        `;

        document.getElementById('diary-page').innerHTML = html;
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },

    openAddMealModal: async (mealType) => {
      try {
        const products = await api.products.getAll();
        const modal = document.getElementById('addMealModal');
        const modalContent = modal.querySelector('.modal-content');
        
        modalContent.innerHTML = `
          <div class="modal-header">
            <h2>Добавить продукт</h2>
            <button class="close-btn" onclick="document.getElementById('addMealModal').classList.remove('active')">✕</button>
          </div>
          <div class="form-group">
            <label>Продукт</label>
            <select id="productSelect">
              <option value="">-- Выберите продукт --</option>
              ${products.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Количество порций</label>
            <input type="number" id="quantity" value="1" min="0.1" step="0.1" placeholder="1.0">
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('addMealModal').classList.remove('active')">Отмена</button>
            <button class="btn btn-primary" onclick="pages.diary.addMeal('${mealType}')">Добавить</button>
          </div>
        `;

        modal.classList.add('active');
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },

    addMeal: async (mealType) => {
      try {
        const productId = document.getElementById('productSelect').value;
        const quantity = parseFloat(document.getElementById('quantity').value);

        if (!productId || !quantity) {
          utils.showToast('Заполните все поля', 'error');
          return;
        }

        await api.meals.add(productId, mealType, quantity);
        document.getElementById('addMealModal').classList.remove('active');
        utils.showToast('Приём пищи добавлен!', 'success');
        pages.diary.init();
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },

    deleteMeal: async (id) => {
      if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        try {
          await api.meals.delete(id);
          utils.showToast('Запись удалена', 'success');
          pages.diary.init();
        } catch (error) {
          utils.showToast(error.message, 'error');
        }
      }
    }
  },

  products: {
    init: async () => {
      try {
        const products = await api.products.getAll();

        let html = `
          <div class="container fade-in">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl); flex-wrap: wrap; gap: var(--spacing);">
              <h1>Библиотека продуктов</h1>
              <button class="btn btn-primary" onclick="pages.products.openAddModal()">➕ Добавить продукт</button>
            </div>

            <div class="card">
              <div class="table-responsive">
                <table>
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Калории</th>
                    <th>Белки</th>
                    <th>Углеводы</th>
                    <th>Жиры</th>
                    <th>Порция</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  ${products.map(p => `
                    <tr>
                      <td><strong>${p.name}</strong></td>
                      <td>${p.calories} ккал</td>
                      <td>${p.protein}г</td>
                      <td>${p.carbs}г</td>
                      <td>${p.fats}г</td>
                      <td>${p.portion_size}</td>
                      <td>
                        ${!p.is_default ? `<button class="btn btn-danger btn-small" onclick="pages.products.deleteProduct(${p.id})">Удалить</button>` : ''}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        `;

        document.getElementById('products-page').innerHTML = html;
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },

    openAddModal: () => {
      const modal = document.getElementById('addProductModal');
      const modalContent = modal.querySelector('.modal-content');
      
      modalContent.innerHTML = `
        <div class="modal-header">
          <h2>Добавить продукт</h2>
          <button class="close-btn" onclick="document.getElementById('addProductModal').classList.remove('active')">✕</button>
        </div>
        <div class="form-group">
          <label>Название</label>
          <input type="text" id="productName" placeholder="Например: Курица" required>
        </div>
        <div class="form-group">
          <label>Калории на 100г</label>
          <input type="number" id="productCalories" placeholder="165" min="0" step="0.1" required>
        </div>
        <div class="form-group">
          <label>Белки (г)</label>
          <input type="number" id="productProtein" placeholder="0" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label>Углеводы (г)</label>
          <input type="number" id="productCarbs" placeholder="0" min="0" step="0.1">
        </div>
        <div class="form-group">
          <label>Жиры (г)</label>
          <input type="number" id="productFats" placeholder="0" min="0" step="0.1">
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('addProductModal').classList.remove('active')">Отмена</button>
          <button class="btn btn-primary" onclick="pages.products.addProduct()">Добавить</button>
        </div>
      `;

      modal.classList.add('active');
    },

    addProduct: async () => {
      try {
        const name = document.getElementById('productName').value;
        const calories = parseFloat(document.getElementById('productCalories').value);
        const protein = parseFloat(document.getElementById('productProtein').value) || 0;
        const carbs = parseFloat(document.getElementById('productCarbs').value) || 0;
        const fats = parseFloat(document.getElementById('productFats').value) || 0;

        if (!name || !calories) {
          utils.showToast('Название и калории обязательны', 'error');
          return;
        }

        await api.products.create(name, calories, protein, carbs, fats);
        document.getElementById('addProductModal').classList.remove('active');
        utils.showToast('Продукт добавлен!', 'success');
        pages.products.init();
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },

    deleteProduct: async (id) => {
      if (confirm('Вы уверены, что хотите удалить этот продукт?')) {
        try {
          await api.products.delete(id);
          utils.showToast('Продукт удален', 'success');
          pages.products.init();
        } catch (error) {
          utils.showToast(error.message, 'error');
        }
      }
    }
  },

  stats: {
    init: async () => {
      try {
        const weeklyStats = await api.stats.getWeekly();

        let html = `
          <div class="container fade-in">
            <h1 style="margin-bottom: var(--spacing-xl);">Статистика</h1>

            <div class="card">
              <div class="card-title">📊 Статистика за неделю</div>
              <div class="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Калории</th>
                      <th>Белки</th>
                      <th>Углеводы</th>
                      <th>Жиры</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${weeklyStats.map(s => `
                      <tr>
                        <td>${utils.formatDate(s.date)}</td>
                        <td>${utils.formatMacro(s.calories)} ккал</td>
                        <td>${utils.formatMacro(s.protein)}г</td>
                        <td>${utils.formatMacro(s.carbs)}г</td>
                        <td>${utils.formatMacro(s.fats)}г</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;

        document.getElementById('stats-page').innerHTML = html;
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    }
  },

  profile: {
    init: async () => {
      try {
        const user = currentUser;

        const html = `
          <div class="container fade-in">
            <h1 style="margin-bottom: var(--spacing-xl);">Мой профиль</h1>

            <div class="card">
              <div class="card-title">👤 Информация о профиле</div>
              <div class="form-group">
                <label>Имя пользователя</label>
                <input type="text" value="${user.username}" disabled>
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" value="${user.email}" disabled>
              </div>
              <div class="form-group">
                <label>Роль</label>
                <input type="text" value="${user.role === 'dietitian' ? 'Диетолог' : 'Пользователь'}" disabled>
              </div>

              <div class="card-title" style="margin-top: 2rem;">📊 Калькулятор калорий</div>
              <div style="background: var(--bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius); margin-bottom: var(--spacing-md); border-left: 4px solid var(--success);">
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: var(--spacing-sm);">
                  Заполните параметры ниже, и мы автоматически рассчитаем вашу суточную норму калорий на основе формулы Миффлина-Сан Жеора
                </p>
              </div>
              
              <div class="form-group">
                <label>Возраст (лет)</label>
                <input type="number" id="age" value="${user.age || ''}" min="10" max="120" onchange="pages.profile.calculateCalories()" oninput="pages.profile.calculateCalories()">
              </div>
              <div class="form-group">
                <label>Вес (кг)</label>
                <input type="number" id="weight" value="${user.weight || ''}" min="30" step="0.1" onchange="pages.profile.calculateCalories()" oninput="pages.profile.calculateCalories()">
              </div>
              <div class="form-group">
                <label>Рост (см)</label>
                <input type="number" id="height" value="${user.height || ''}" min="100" max="250" onchange="pages.profile.calculateCalories()" oninput="pages.profile.calculateCalories()">
              </div>
              <div class="form-group">
                <label>Пол</label>
                <select id="gender" onchange="pages.profile.calculateCalories()">
                  <option value="">-- Выберите --</option>
                  <option value="M" ${user.gender === 'M' ? 'selected' : ''}>Мужской</option>
                  <option value="F" ${user.gender === 'F' ? 'selected' : ''}>Женский</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Уровень активности</label>
                <select id="activityLevel" onchange="pages.profile.calculateCalories()">
                  <option value="sedentary">Сидячий образ жизни</option>
                  <option value="light" selected>Легкая активность (1-3 раза в неделю)</option>
                  <option value="moderate">Умеренная активность (3-5 раз в неделю)</option>
                  <option value="active">Высокая активность (6-7 раз в неделю)</option>
                  <option value="veryActive">Очень высокая активность</option>
                </select>
              </div>
              
              <div id="calorieCalculation" style="display: none; background: var(--gradient-success); padding: var(--spacing-md); border-radius: var(--radius); margin-bottom: var(--spacing-md); color: white;">
                <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: var(--spacing-xs);">Рекомендуемая суточная норма:</div>
                <div style="font-size: 2rem; font-weight: 800;" id="calculatedCalories">0 ккал</div>
                <div style="font-size: 0.75rem; opacity: 0.8; margin-top: var(--spacing-xs);">Базовый метаболизм: <span id="calculatedBMR">0</span> ккал</div>
                <button class="btn" style="margin-top: var(--spacing-sm); background: white; color: var(--success);" onclick="pages.profile.applyCalculatedCalories()">
                  Применить эту норму
                </button>
              </div>
              
              <div class="card-title" style="margin-top: 2rem;">⚙️ Суточная цель</div>
              <div class="form-group">
                <label>Суточная цель по калорийности (ккал)</label>
                <input type="number" id="dailyGoal" value="${user.daily_calorie_goal || 2000}" min="1000" max="5000">
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: var(--spacing-xs);">
                  Вы можете установить свою цель вручную или использовать рассчитанную норму выше
                </div>
              </div>

              <button class="btn btn-primary btn-large" onclick="pages.profile.updateProfile()" style="width: 100%; margin-top: var(--spacing-lg);">
                💾 Сохранить изменения
              </button>
            </div>
          </div>
        `;

        document.getElementById('profile-page').innerHTML = html;
        
        // Автоматически рассчитываем калории если есть все данные
        setTimeout(() => {
          pages.profile.calculateCalories();
        }, 100);
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },

    calculateCalories: () => {
      const age = parseInt(document.getElementById('age')?.value) || null;
      const weight = parseFloat(document.getElementById('weight')?.value) || null;
      const height = parseInt(document.getElementById('height')?.value) || null;
      const gender = document.getElementById('gender')?.value || null;
      const activityLevel = document.getElementById('activityLevel')?.value || 'moderate';
      
      const calculationDiv = document.getElementById('calorieCalculation');
      
      if (age && weight && height && gender) {
        const bmr = utils.calculateBMR(age, weight, height, gender);
        const dailyCalories = utils.calculateDailyCalories(bmr, activityLevel);
        
        if (calculationDiv) {
          calculationDiv.style.display = 'block';
          document.getElementById('calculatedBMR').textContent = bmr;
          document.getElementById('calculatedCalories').textContent = dailyCalories + ' ккал';
        }
      } else {
        if (calculationDiv) {
          calculationDiv.style.display = 'none';
        }
      }
    },
    
    applyCalculatedCalories: () => {
      const calculatedCalories = document.getElementById('calculatedCalories')?.textContent;
      if (calculatedCalories) {
        const calories = parseInt(calculatedCalories.replace(' ккал', ''));
        if (calories) {
          document.getElementById('dailyGoal').value = calories;
          utils.showToast(`Цель установлена: ${calories} ккал`, 'success');
        }
      }
    },

    updateProfile: async () => {
      try {
        const data = {
          daily_calorie_goal: parseInt(document.getElementById('dailyGoal').value),
          age: parseInt(document.getElementById('age').value) || null,
          weight: parseFloat(document.getElementById('weight').value) || null,
          height: parseInt(document.getElementById('height').value) || null,
          gender: document.getElementById('gender').value || null
        };

        const updated = await api.auth.updateProfile(data);
        currentUser = { ...currentUser, ...updated };
        utils.setUser(currentUser);
        utils.showToast('Профиль обновлен!', 'success');
        pages.profile.init();
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    }
  },

  login: {
    init: () => {
      const html = `
        <div class="auth-container">
          <div class="auth-form">
            <h1>Вход</h1>
            <p>Добро пожаловать в CalorieTracker</p>

            <div class="form-group">
              <label>Email</label>
              <input type="email" id="loginEmail" placeholder="your@email.com">
            </div>

            <div class="form-group">
              <label>Пароль</label>
              <input type="password" id="loginPassword" placeholder="••••••••">
            </div>

            <button class="btn btn-primary" onclick="pages.login.submit()" style="width: 100%; padding: 0.75rem; font-size: 1rem;">
              Войти
            </button>

            <div class="auth-link">
              Нет аккаунта? <a onclick="ui.navigateTo('register')">Создать аккаунт</a>
            </div>

            <div class="demo-credentials">
              <strong>📋 Тестовые аккаунты:</strong>
              <code>
                user1@example.com / password123<br>
                dietitian1@example.com / password123<br>
                admin@example.com / password123
              </code>
            </div>
          </div>
        </div>
      `;

      document.getElementById('login-page').innerHTML = html;
    },

    submit: () => {
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        utils.showAlert('Заполните все поля', 'error');
        return;
      }

      auth.login(email, password);
    }
  },

  register: {
    init: () => {
      const html = `
        <div class="auth-container">
          <div class="auth-form">
            <h1>Регистрация</h1>
            <p>Создайте новый аккаунт</p>

            <div class="form-group">
              <label>Имя пользователя</label>
              <input type="text" id="regUsername" placeholder="Ваше имя">
            </div>

            <div class="form-group">
              <label>Email</label>
              <input type="email" id="regEmail" placeholder="your@email.com">
            </div>

            <div class="form-group">
              <label>Пароль</label>
              <input type="password" id="regPassword" placeholder="••••••••">
            </div>

            <div class="form-group">
              <label>Тип аккаунта</label>
              <select id="regRole">
                <option value="user">Пользователь</option>
                <option value="dietitian">Диетолог</option>
              </select>
            </div>

            <button class="btn btn-primary" onclick="pages.register.submit()" style="width: 100%; padding: 0.75rem; font-size: 1rem;">
              Создать аккаунт
            </button>

            <div class="auth-link">
              Уже есть аккаунт? <a onclick="ui.navigateTo('login')">Войти</a>
            </div>
          </div>
        </div>
      `;

      document.getElementById('register-page').innerHTML = html;
    },

    submit: () => {
      const username = document.getElementById('regUsername').value;
      const email = document.getElementById('regEmail').value;
      const password = document.getElementById('regPassword').value;
      const role = document.getElementById('regRole').value;

      if (!username || !email || !password) {
        utils.showAlert('Заполните все поля', 'error');
        return;
      }

      auth.register(username, email, password, role);
    }
  }
};

// Создание плавающих фруктов на фоне
function createFloatingFruits() {
  const fruits = ['🍎', '🍌', '🥑', '🥕', '🥦', '🍊', '🍇', '🥝', '🍓', '🍉', '🥬', '🍅', '🥒', '🌽', '🫐', '🍑', '🍐', '🥭', '🍒', '🫑'];
  const container = document.body;
  
  // Удаляем старые фрукты если есть
  document.querySelectorAll('.floating-fruit').forEach(el => el.remove());
  
  // Создаем 20 плавающих фруктов
  for (let i = 0; i < 20; i++) {
    const fruit = document.createElement('div');
    fruit.className = 'floating-fruit';
    fruit.textContent = fruits[Math.floor(Math.random() * fruits.length)];
    fruit.style.left = Math.random() * 100 + '%';
    fruit.style.top = Math.random() * 100 + '%';
    fruit.style.animationDelay = Math.random() * 15 + 's';
    fruit.style.animationDuration = (10 + Math.random() * 10) + 's';
    fruit.style.fontSize = (2 + Math.random() * 2) + 'rem';
    fruit.style.opacity = 0.05 + Math.random() * 0.1;
    container.appendChild(fruit);
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Создание HTML структуры
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="header"></div>
    
    <div id="login-page" class="page active"></div>
    <div id="register-page" class="page"></div>
    <div id="dashboard-page" class="page"></div>
    <div id="diary-page" class="page"></div>
    <div id="products-page" class="page"></div>
    <div id="stats-page" class="page"></div>
    <div id="profile-page" class="page"></div>

    <div id="addMealModal" class="modal">
      <div class="modal-content"></div>
    </div>
    <div id="addProductModal" class="modal">
      <div class="modal-content"></div>
    </div>
  `;
  
  // Создаем плавающие фрукты
  createFloatingFruits();
  
  // Обновляем фрукты при изменении размера окна
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(createFloatingFruits, 500);
  });
  
  // Закрытие модальных окон по клику вне их
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });

  // Проверяем авторизацию
  const token = utils.getToken();
  const user = utils.getUser();

  if (token && user) {
    currentUser = user;
    ui.updateHeader();
    ui.navigateTo('dashboard');
  } else {
    ui.updateHeader();
    pages.login.init();
  }
});

