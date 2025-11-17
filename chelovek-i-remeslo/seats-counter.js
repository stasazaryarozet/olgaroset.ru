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

// Stripe Payment Link (будет активирован после настройки)
const STRIPE_PAYMENT_LINK = null; // 'https://buy.stripe.com/XXX';

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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.SHEET_ID}/values/${encodeURIComponent(CONFIG.SHEET_NAME)}!${CONFIG.CELL_RANGE}?key=${CONFIG.API_KEY}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Если лист ещё не создан, возвращаем максимальное количество
      if (response.status === 400 || response.status === 404) {
        console.info('Лист ещё не создан, показываем полное количество мест');
        return CONFIG.TOTAL_SEATS;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Проверяем наличие данных
    if (!data.values || !data.values[0] || !data.values[0][0]) {
      console.warn('Ячейка G2 пустая, возвращаем максимум');
      return CONFIG.TOTAL_SEATS;
    }
    
    const seatsLeft = parseInt(data.values[0][0], 10);
    
    if (isNaN(seatsLeft) || seatsLeft < 0 || seatsLeft > CONFIG.TOTAL_SEATS) {
      console.error('Некорректное значение в G2:', data.values[0][0]);
      return currentSeatsLeft; // Возвращаем предыдущее значение
    }
    
    return seatsLeft;
    
  } catch (error) {
    console.error('Ошибка загрузки счётчика:', error);
    return currentSeatsLeft; // Возвращаем предыдущее значение
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
  if (STRIPE_PAYMENT_LINK && seatsLeft > 0) {
    registerButton.disabled = false;
    registerButton.textContent = 'Зарегистрироваться';
    registerButton.onclick = () => {
      window.location.href = STRIPE_PAYMENT_LINK;
    };
  } else if (!STRIPE_PAYMENT_LINK) {
    registerButton.disabled = true;
    registerButton.textContent = 'Регистрация открывается после согласования';
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

