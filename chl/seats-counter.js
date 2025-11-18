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
 * Показать информацию о регистрации
 */
function showRegistrationForm() {
  // Создаём модальное окно с контактами
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
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 2.5rem;
    border-radius: 4px;
    max-width: 400px;
    width: 100%;
    text-align: center;
  `;
  
  content.innerHTML = `
    <h2 style="font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 1.5rem;">Регистрация</h2>
    
    <p style="margin-bottom: 1.5rem; line-height: 1.6;">
      Напишите Ольге для регистрации:
    </p>
    
    <p style="margin-bottom: 1rem;">
      <a href="https://t.me/olgarozet" style="color: var(--accent); text-decoration: none; font-weight: 500; font-size: 1.1rem;">
        Telegram: @olgarozet
      </a>
    </p>
    
    <p style="margin-bottom: 2rem; color: #666; font-size: 0.9rem;">
      или
    </p>
    
    <p style="margin-bottom: 2rem;">
      <a href="mailto:o.g.rozet@gmail.com" style="color: var(--accent); text-decoration: none; font-weight: 500;">
        o.g.rozet@gmail.com
      </a>
    </p>
    
    <div style="background: #f5f5f5; padding: 1rem; border-radius: 4px; margin-bottom: 1.5rem;">
      <p style="font-size: 0.9rem; color: #666; margin: 0;">
        <strong>5 000 ₽</strong><br>
        Карта: <strong>5559 5720 5319 4603</strong><br>
        Ольга Григорьевна Розет
      </p>
    </div>
    
    <p style="font-size: 0.85rem; color: #999; margin-bottom: 1.5rem;">
      Нет денег? Возможно, что-нибудь придумаем. Пожалуйста, пишите.
    </p>
    
    <button id="close-modal" style="width: 100%; padding: 0.875rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.95rem;">
      Закрыть
    </button>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Закрытие модального окна
  const closeModal = () => document.body.removeChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('close-modal').addEventListener('click', closeModal);
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

