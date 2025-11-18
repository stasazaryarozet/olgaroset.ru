# Пилотный слот "В Дело"

## Концепция

Один специальный слот для первого клиента:
- Дата: 21 ноября 2025, четверг
- Время: 15:00 МСК
- Длительность: 40 минут
- Цена: 15 000 ₽

## Настройка в Cal.com

### Вариант 1: Ограничить доступность

1. Открой: https://app.cal.com/event-types/3859146
2. **Availability** → **Add override**
3. Дата: 21 ноября 2025
4. Время: 15:00 - 15:40
5. **Save**

После бронирования этого слота:
1. **Availability** → удалить override
2. Или установить другую дату

### Вариант 2: Limit future bookings

1. Открой: https://app.cal.com/event-types/3859146
2. **Advanced** → **Limit future bookings**
3. **Date range**: Specific dates
4. Start: 21 ноября 2025, 15:00
5. End: 21 ноября 2025, 15:40
6. **Save**

### Вариант 3: Single-use link (рекомендую)

1. Открой: https://app.cal.com/bookings/instant
2. Event Type: "40 минут с Ольгой Розет"
3. Date: 21 ноября 2025
4. Time: 15:00
5. **Create booking link**
6. Скопируй одноразовую ссылку
7. Отправь первому клиенту

## Автоматизация (через API)

```python
from calcom_gate import CalcomGateFull

gate = CalcomGateFull('cal_live_c7dba7d0cfbe9b741f496d56ef2f34e0')

# Обновить Event Type: ограничить бронирование
gate.update_event_type(
    3859146,
    minimumBookingNotice=43200,  # 30 дней вперед = блокировка
    beforeEventBuffer=999999  # Огромный буфер = только 1 слот
)
```

## Ручное управление (рекомендую)

Проще всего:
1. Зайти в Cal.com
2. Settings → Availability
3. Установить availability только на 21 ноября, 15:00
4. После бронирования — убрать

Или использовать **Schedule override** для одного конкретного дня.

## Статус

- [ ] Создан пилотный слот: 21 ноября, 15:00
- [ ] Ссылка отправлена первому клиенту
- [ ] После бронирования: вернуть обычное расписание

