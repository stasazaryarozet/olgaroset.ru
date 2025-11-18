// Real-time счётчик мест для встречи ЦДЛ
// Интеграция с Google Sheets

const CONFIG = {
  SHEET_ID: '1V63W-BMWKqM9M4IabRJch4rdCVNL3DMGBugDzOxdeTQ',
  SHEET_NAME: 'ЦДЛ 2 декабря',
  CELL_RANGE: 'G2',
  TOTAL_SEATS: 25,
  UPDATE_INTERVAL: 30000
};

const FORM_URL_CDL = 'https://docs.google.com/forms/d/e/1cHDiMR5AN2pX5YIe9S66ggFYmrAbLUKgKdHdmLQ391o/viewform';

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
      // Fallback: Google Form
      registerButton.disabled = false;
      registerButton.textContent = 'Записаться';
      registerButton.onclick = () => {
        window.open(FORM_URL_CDL, '_blank');
      };
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

