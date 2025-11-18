# Автоматическая регистрация на встречу ЦДЛ через Google Forms

**Дата:** 18.11.2025  
**Принцип:** Забота о Человеке — полная автоматизация, ноль ручной работы

---

## 🎯 Цель

Автоматическая регистрация участников встречи ЦДЛ:
- ✅ Пользователь заполняет форму → мгновенно получает реквизиты
- ✅ Заявка автоматически записывается в Google Sheet
- ✅ Счетчик мест обновляется в реальном времени
- ✅ Ольга видит все заявки в таблице (0 ручной работы)

---

## 📝 Шаг 1: Создать Google Form (2 минуты)

### 1.1 Открыть
```
https://forms.google.com/create
```

### 1.2 Настроить форму

**Название:** `Встреча ЦДЛ — Регистрация`

**Поля:**

1. **Имя**
   - Тип: `Short answer`
   - ✓ Required

2. **Email или Telegram**
   - Тип: `Short answer`
   - ✓ Required
   - Описание: `Укажите email или @telegram для связи`

3. **Согласие**
   - Тип: `Checkboxes`
   - Текст: `Согласен с обработкой персональных данных`
   - ✓ Required

### 1.3 Настроить ответы

**Settings → Responses:**
- ✓ Collect email addresses: **OFF** (уже есть в форме)
- ✓ Limit to 1 response: **ON**
- ✓ Response receipts: **Always**
- Select response destination → **Create new spreadsheet**
  - Название: `ЦДЛ 2 декабря — Регистрации`

### 1.4 Настроить автоответ

**Settings → Presentation:**
- Confirmation message:
```
Спасибо за регистрацию!

5 000 ₽
Карта: 5559 5720 5319 4603
Ольга Григорьевна Розет

После оплаты напишите: @olgarozet

Нет денег? Возможно, что-нибудь придумаем. Пожалуйста, пишите.
```

---

## 📊 Шаг 2: Настроить Google Sheet (1 минута)

### 2.1 Открыть созданную таблицу

Форма автоматически создаст: `ЦДЛ 2 декабря — Регистрации`

### 2.2 Добавить счетчик мест

**Структура:**
- Столбец A: Timestamp (автоматически)
- Столбец B: Имя
- Столбец C: Email/Telegram
- Столбец D: Согласие

**Добавить:**
- **F1**: `Занято`
- **F2**: `=COUNTA(A2:A26)`
- **G1**: `Свободно`
- **G2**: `=25-F2`

### 2.3 Публичный доступ (только для чтения)

**File → Share → Publish to web:**
- Select: `Sheet "Form Responses 1"`
- ✓ Automatically republish when changes are made
- **Publish**

---

## 🔗 Шаг 3: Встроить форму на сайт (5 минут)

### 3.1 Получить ссылку на форму

**В Google Form:**
- Send → Link icon
- Copy link: `https://docs.google.com/forms/d/e/FORM_ID/viewform`

### 3.2 Обновить `seats-counter.js`

Заменить функцию `showRegistrationForm()`:

```javascript
function showRegistrationForm() {
  // Открываем Google Form в новом окне
  window.open('https://docs.google.com/forms/d/e/FORM_ID/viewform', '_blank');
}
```

**ИЛИ** встроить iframe:

```javascript
function showRegistrationForm() {
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
    padding: 0;
    border-radius: 4px;
    max-width: 640px;
    width: 100%;
    height: 90vh;
    position: relative;
  `;
  
  content.innerHTML = `
    <button id="close-modal" style="position: absolute; top: 10px; right: 10px; background: white; border: 1px solid #ddd; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; z-index: 1;">✕</button>
    <iframe src="https://docs.google.com/forms/d/e/FORM_ID/viewform?embedded=true" 
            width="100%" height="100%" frameborder="0">
    </iframe>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  const closeModal = () => document.body.removeChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.getElementById('close-modal').addEventListener('click', closeModal);
}
```

### 3.3 Обновить счетчик для чтения из Google Sheets

В `seats-counter.js` обновить `CONFIG`:

```javascript
const CONFIG = {
  SHEET_ID: 'ID_СОЗДАННОЙ_ТАБЛИЦЫ', // из URL Google Sheet
  SHEET_NAME: 'Form Responses 1',
  CELL_RANGE: 'G2', // Ячейка со свободными местами
  TOTAL_SEATS: 25,
  UPDATE_INTERVAL: 30000 // 30 секунд
};
```

Счетчик уже умеет читать из Google Sheets через API.

---

## ✅ Результат

### Для пользователя:
1. Нажимает "Оставить заявку"
2. Заполняет Google Form (имя + контакт)
3. Мгновенно получает реквизиты оплаты
4. Переводит деньги
5. Пишет Ольге для подтверждения

### Для Ольги:
1. Видит все заявки в Google Sheet (real-time)
2. Видит счетчик свободных мест
3. Получает уведомления на email (опционально)
4. **Ноль ручной работы с формами**

### Для сайта:
1. Счетчик автоматически обновляется
2. Форма работает без внешних зависимостей (Formspree)
3. Все данные в Google (единое хранилище)

---

## 📌 Примечания

- **Без Formspree** — полная независимость
- **Без кастомного API** — не нужен VPS
- **Google Forms + Sheets** — надежно, бесплатно, автоматически
- **Забота о Человеке** — минимум действий от всех участников

---

**Статус:** Готово к внедрению. Нужно только создать форму и обновить ссылку.

