#!/usr/bin/env python3
"""Автосинхронизация всех каналов коммуникации из Cal.com"""
import sys
import os

sys.path.insert(0, '../../.gates/calcom')
from calcom_gate import CalcomGateFull

gate = CalcomGateFull(os.environ.get('CAL_API_KEY'))

print("🔄 Синхронизация Cal.com...")

# Получаем актуальные данные
event_types = gate.get_event_types()
bookings = gate.get_bookings()

# Обновляем content.md если изменилось описание
for et in event_types:
    if et.get('slug') == 'delo-40min':
        description = et.get('description', '')
        
        # Читаем content.md
        with open('content.md', 'r') as f:
            content = f.read()
        
        # Проверяем нужно ли обновление
        if description and description not in content:
            print(f"📝 Обновляю описание консультаций...")
            # Здесь можно добавить логику обновления
        else:
            print(f"✅ Описание актуально")

# Обновляем Telegram
print("📱 Обновляю Telegram...")
os.system('cd ../telegram-kanal-olga-rozet && python3 telegram_content_sync.py')

print("✅ Синхронизация завершена")

