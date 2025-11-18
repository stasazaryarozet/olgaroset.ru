#!/usr/bin/env python3
"""
Удаляет все Event Types кроме основного (40 минут)
"""
import sys
import os

# Добавляем путь к .gates
gates_path = os.path.join(os.path.dirname(__file__), '../../.gates/calcom')
sys.path.insert(0, gates_path)

from calcom_gate import CalcomGateFull

gate = CalcomGateFull(os.environ.get('CAL_API_KEY'))

print("🔍 Получаю все Event Types...\n")
event_types = gate.get_event_types()

print(f"📋 Найдено Event Types: {len(event_types)}\n")

for et in event_types:
    et_id = et.get('id')
    title = et.get('title')
    slug = et.get('slug')
    length = et.get('lengthInMinutes')
    
    print(f"  • ID: {et_id}")
    print(f"    Название: {title}")
    print(f"    Slug: {slug}")
    print(f"    Длительность: {length} мин")
    
    # Оставляем только 40-минутный
    if slug == 'delo-40min' or length == 40:
        print(f"    ✅ ОСТАВИТЬ (основной)")
    else:
        print(f"    ❌ УДАЛИТЬ")
        try:
            gate.delete_event_type(et_id)
            print(f"    ✓ Удалено")
        except Exception as e:
            print(f"    ✗ Ошибка: {e}")
    
    print()

print("\n✅ Очистка завершена. Проверь: https://cal.com/olgarozet")

