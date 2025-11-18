#!/usr/bin/env python3
"""
Создает пилотный слот для "В Дело"
Ограничивает доступность одним конкретным временем
"""
import sys
import os
from datetime import datetime

gates_path = os.path.join(os.path.dirname(__file__), '../../.gates/calcom')
sys.path.insert(0, gates_path)

from calcom_gate import CalcomGateFull

gate = CalcomGateFull('cal_live_c7dba7d0cfbe9b741f496d56ef2f34e0')

EVENT_TYPE_ID = 3859146  # "40 минут с Ольгой Розет"

print("🎯 Создаю пилотный слот для 'В Дело'\n")

# Получаем текущие настройки
current = gate.get_event_type(EVENT_TYPE_ID)
print(f"📋 Текущий Event Type:")
print(f"   Название: {current.get('data', {}).get('title')}")
print(f"   Slug: {current.get('data', {}).get('slug')}\n")

# Обновляем: максимально ограничиваем доступность
updates = {
    'minimumBookingNotice': 1,  # Минимум 1 минута (можно бронировать сразу)
    'beforeEventBuffer': 0,     # Без буфера
    'afterEventBuffer': 0,      # Без буфера
    'slotInterval': 40,         # Интервал = длительность (нет других слотов)
    # Ограничение: только 1 бронирование в день
    'onlyShowFirstAvailableSlot': True
}

print("🔧 Применяю настройки пилотного слота:")
print("   • Показывать только первый доступный слот")
print("   • Интервал = длительности (нет overlap)")
print()

try:
    result = gate.update_event_type(EVENT_TYPE_ID, **updates)
    print("✅ Пилотный слот настроен!")
    print()
    print("📍 Следующий шаг:")
    print("   1. Зайди: https://app.cal.com/availability")
    print("   2. Установи availability только на нужную дату/время")
    print("   3. Или создай Schedule Override для одного дня")
    print()
    print("🔗 Ссылка для бронирования:")
    print("   https://cal.com/olgarozet/delo-40min")
    
except Exception as e:
    print(f"❌ Ошибка: {e}")
    sys.exit(1)

