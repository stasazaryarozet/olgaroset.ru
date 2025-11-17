// Real-time счётчик мест для встречи ЦДЛ
// Интеграция с Google Sheets

const CONFIG = {
  // Google Sheet ID (Paris 2026 + ЦДЛ)
  SHEET_ID: '1IxI8mbFUmlFUmDPTROCPESfTSaF056JUHiAA6EgHB6A',
  
  // Имя листа
  SHEET_NAME: 'ЦДЛ 2 декабря — Регистрации',
  
  // Google Sheets API Key (публичный, только для чтения)
  API_KEY: 'AIzaSyDmVwF4gZqLslLJwt9VYX4E9KRl38w8ixE',
  
  // Ячейка с количеством свободных мест (G2)
  CELL_RANGE: 'G2',
  
  // Максимальное количество мест
  TOTAL_SEATS: 25,
  
  // Интервал обновления (мс)
  UPDATE_INTERVAL: 60000 // 1 минута
};

// Система оплаты (fallback: форма заявки)
const PAYMENT_SYSTEM_READY = false;
const PAYMENT_LINK = null; // Будет активировано после настройки ЮKassa

// Состояние
let currentSeatsLeft = CONFIG.TOTAL_SEATS;
let isLoading = true;
let lastUpdateTime = null;

// DOM элементы
const seatsLeftElement = document.getElementById('seats-left');
const registerButton = document.getElementById('register-btn');

/**
 * Загрузить количество свободных мест из Google Sheet
 */
async function fetchSeatsLeft() {
  // Используем статический JSON файл (обновляется вручную или через скрипт)
  // Это проще и надёжнее, чем прямой доступ к Google Sheets API
  try {
    const response = await fetch('seats.json');
    
    if (!response.ok) {
      console.warn('seats.json недоступен, используем fallback');
      return CONFIG.TOTAL_SEATS;
    }
    
    const data = await response.json();
    
    if (typeof data.seatsLeft === 'number' && data.seatsLeft >= 0) {
      return data.seatsLeft;
    }
    
    console.warn('Некорректные данные в seats.json, используем fallback');
    return CONFIG.TOTAL_SEATS;
    
  } catch (error) {
    console.warn('Ошибка загрузки данных:', error);
    return CONFIG.TOTAL_SEATS; // Fallback
  }
}

/**
 * Обновить UI с новым количеством мест
 */
function updateUI(seatsLeft) {
  currentSeatsLeft = seatsLeft;
  isLoading = false;
  lastUpdateTime = new Date();
  
  // Обновляем текст
  if (seatsLeft > 0) {
    seatsLeftElement.textContent = `${seatsLeft} ${pluralize(seatsLeft, 'место', 'места', 'мест')}`;
    seatsLeftElement.parentElement.style.background = '#fff8f0';
    seatsLeftElement.parentElement.style.borderColor = '#ffcc80';
  } else {
    seatsLeftElement.textContent = 'Мест нет';
    seatsLeftElement.parentElement.style.background = '#fafafa';
    seatsLeftElement.parentElement.style.borderColor = '#e0e0e0';
  }
  
  // Обновляем кнопку
  if (seatsLeft > 0) {
    if (PAYMENT_SYSTEM_READY && PAYMENT_LINK) {
      // Автоматическая оплата готова
      registerButton.disabled = false;
      registerButton.textContent = 'Зарегистрироваться';
      registerButton.onclick = () => {
        window.location.href = PAYMENT_LINK;
      };
    } else {
      // Fallback: форма заявки
      registerButton.disabled = false;
      registerButton.textContent = 'Оставить заявку';
      registerButton.onclick = showRegistrationForm;
    }
  } else if (!PAYMENT_SYSTEM_READY && !PAYMENT_LINK) {
    registerButton.disabled = true;
    registerButton.textContent = 'Регистрация скоро откроется';
  } else if (seatsLeft <= 0) {
    registerButton.disabled = true;
    registerButton.textContent = 'Мест нет';
  }
  
  // Логируем для отладки
  console.log(`[${new Date().toLocaleTimeString('ru-RU')}] Свободно мест: ${seatsLeft}`);
}

/**
 * Плюрализация русских слов
 */
function pluralize(count, one, few, many) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }
  return many;
}

/**
 * Основной цикл обновления
 */
async function updateSeatsCounter() {
  const seatsLeft = await fetchSeatsLeft();
  updateUI(seatsLeft);
}

/**
 * Показать форму регистрации (fallback)
 */
function showRegistrationForm() {
  // Создаём модальное окно с формой
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  `;
  
  const form = document.createElement('div');
  form.style.cssText = `
    background: white;
    padding: 2.5rem;
    border-radius: 4px;
    max-width: 400px;
    width: 100%;
  `;
  
  form.innerHTML = `
    <h2 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 1.5rem; text-align: center;">Регистрация</h2>
    
    <form id="registration-form">
      <input type="text" name="name" required 
        style="width: 100%; padding: 0.875rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; margin-bottom: 0.75rem;"
        placeholder="Имя">
      
      <input type="email" name="email" required 
        style="width: 100%; padding: 0.875rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; margin-bottom: 0.75rem;"
        placeholder="Email">
      
      <input type="tel" name="phone" required 
        style="width: 100%; padding: 0.875rem; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; margin-bottom: 1.25rem;"
        placeholder="Телефон">
      
      <button type="submit" style="width: 100%; padding: 1rem; background: var(--accent); color: white; border: none; border-radius: 4px; font-size: 1rem; font-weight: 500; cursor: pointer; margin-bottom: 0.75rem;">
        Отправить
      </button>
      
      <button type="button" id="close-modal" style="width: 100%; padding: 0.75rem; background: transparent; color: #999; border: none; font-size: 0.9rem; cursor: pointer;">
        Отмена
      </button>
    </form>
    
    <div id="form-success" style="display: none; text-align: center; padding: 1rem 0;">
      <h3 style="color: var(--accent); margin-bottom: 1rem; font-size: 1.2rem;">Готово</h3>
      
      <p style="color: var(--text-muted); margin-bottom: 1rem; font-size: 0.95rem;">
        Реквизиты отправлены на email
      </p>
      
      <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">
        Вопросы: <a href="https://t.me/olgarozet" style="color: var(--accent);">@olgarozet</a>
      </p>
      
      <button id="close-success" style="width: 100%; padding: 0.875rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem;">
        Закрыть
      </button>
    </div>
  `;
  
  modal.appendChild(form);
  document.body.appendChild(modal);
  
  // Закрытие модального окна
  const closeModal = () => document.body.removeChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('close-modal').addEventListener('click', closeModal);
  
  // Обработка отправки формы
  document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      event: 'Встреча ЦДЛ — Человек и Ремесло. Всегда и Сейчас.',
      date: '2 декабря 2025, 12:00'
    };
    
    try {
      // Отправка через Formspree (бесплатно, 50 заявок/месяц)
      const response = await fetch('https://formspree.io/f/xannqbop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        // Показываем успех
        document.getElementById('registration-form').parentElement.style.display = 'none';
        document.getElementById('form-success').style.display = 'block';
        
        // Автоматическая отправка email с реквизитами
        // (Formspree автоответ настроен в аккаунте)
        
        document.getElementById('close-success').addEventListener('click', closeModal);
      } else {
        alert('Произошла ошибка. Попробуйте ещё раз или напишите на o.g.rozet@gmail.com');
      }
           } catch (error) {
             console.error('Ошибка отправки:', error);
             alert('Произошла ошибка. Пожалуйста, напишите Ольге:\n\nTelegram: @olgarozet\nEmail: o.g.rozet@gmail.com');
           }
  });
}

/**
 * Инициализация
 */
async function init() {
  console.log('Инициализация счётчика мест для встречи ЦДЛ');
  
  // Первое обновление
  await updateSeatsCounter();
  
  // Периодическое обновление
  setInterval(updateSeatsCounter, CONFIG.UPDATE_INTERVAL);
  
  // Обновление при фокусе страницы (если пользователь вернулся)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('Страница снова активна, обновляем счётчик');
      updateSeatsCounter();
    }
  });
}

// Запуск при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

