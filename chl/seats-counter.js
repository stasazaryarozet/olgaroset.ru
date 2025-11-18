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
      registerButton.textContent = 'ЗАБРОНИРОВАТЬ';
      registerButton.onclick = () => {
        window.location.href = PAYMENT_LINK;
      };
    } else {
      // Fallback: Google Form
      registerButton.disabled = false;
      registerButton.textContent = 'ЗАБРОНИРОВАТЬ';
      registerButton.onclick = () => {
        window.open(FORM_URL_CDL, '_blank');
      };
    }
  } else if (!PAYMENT_SYSTEM_READY && !PAYMENT_LINK) {
    registerButton.disabled = true;
    registerButton.textContent = 'Бронирование скоро откроется';
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
  
  // Обработчик формы бронирования
  const form = document.getElementById('booking-form');
  const submitBtn = document.getElementById('submit-btn');
  const resultMessage = document.getElementById('result-message');
  
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Отключаем кнопку
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
      
      const formData = new FormData(form);
      const name = formData.get('name');
      const email = formData.get('email');
      
      try {
        // Открываем Google Form с предзаполненными данными
        // ID формы: 1cHDiMR5AN2pX5YIe9S66ggFYmrAbLUKgKdHdmLQ391o
        const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSdcHDiMR5AN2pX5YIe9S66ggFYmrAbLUKgKdHdmLQ391o/viewform?usp=pp_url&entry.name=${encodeURIComponent(name)}&entry.email=${encodeURIComponent(email)}`;
        
        window.open(formUrl, '_blank');
        
        // Показываем сообщение
        resultMessage.style.display = 'block';
        resultMessage.style.background = '#d4edda';
        resultMessage.style.borderLeft = '3px solid #28a745';
        resultMessage.style.color = '#155724';
        resultMessage.innerHTML = '✓ Открыта форма бронирования. Пожалуйста, завершите регистрацию.';
        
        // Очищаем форму
        form.reset();
        
      } catch (error) {
        console.error('Ошибка при отправке:', error);
        resultMessage.style.display = 'block';
        resultMessage.style.background = '#f8d7da';
        resultMessage.style.borderLeft = '3px solid #dc3545';
        resultMessage.style.color = '#721c24';
        resultMessage.innerHTML = '✗ Ошибка. Напишите: <a href="mailto:o.g.rozet@gmail.com">o.g.rozet@gmail.com</a>';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ЗАБРОНИРОВАТЬ';
      }
    });
  }
}

// Запуск при загрузке страницы
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

