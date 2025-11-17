#!/usr/bin/env python3
"""
Скрипт синхронизации: Google Sheets → seats.json
Автоматически обновляет счётчик мест на сайте
"""

import os
import json
import pickle
from pathlib import Path
from datetime import datetime
from googleapiclient.discovery import build

# Пути
GATES_PATH = Path.home() / 'Library/Mobile Documents/com~apple~CloudDocs/○/.gates/google'
TOKEN_PATH = GATES_PATH / 'token.pickle'
SEATS_JSON_PATH = Path.home() / 'Library/Mobile Documents/com~apple~CloudDocs/○/olga/olgaroset.ru/chl/seats.json'

# Google Sheets config
SHEET_ID = '1IxI8mbFUmlFUmDPTROCPESfTSaF056JUHiAA6EgHB6A'
SHEET_NAME = 'ЦДЛ 2 декабря — Регистрации'
CELL = 'G2'

def sync_seats():
    """Синхронизировать количество мест из Google Sheets в seats.json"""
    
    print("="*80)
    print("СИНХРОНИЗАЦИЯ: Google Sheets → seats.json")
    print("="*80)
    print()
    
    # Загружаем credentials
    if not TOKEN_PATH.exists():
        print("❌ Token не найден. Запустите авторизацию сначала.")
        print(f"   cd {GATES_PATH}")
        print(f"   python3 google_gate.py")
        return False
    
    with open(TOKEN_PATH, 'rb') as f:
        creds = pickle.load(f)
    
    if not creds.valid:
        print("❌ Token невалиден. Требуется реавторизация.")
        return False
    
    # Создаём Sheets service
    service = build('sheets', 'v4', credentials=creds, cache_discovery=False)
    
    # Читаем значение из G2
    try:
        result = service.spreadsheets().values().get(
            spreadsheetId=SHEET_ID,
            range=f"'{SHEET_NAME}'!{CELL}"
        ).execute()
        
        values = result.get('values', [])
        
        if not values:
            print("⚠️ Ячейка G2 пуста, используем 25")
            seats_left = 25
        else:
            seats_left = int(values[0][0])
            print(f"✅ Прочитано из Google Sheets: {seats_left} мест")
    
    except Exception as e:
        print(f"❌ Ошибка чтения из Google Sheets: {e}")
        return False
    
    # Обновляем seats.json
    seats_data = {
        "seatsLeft": seats_left,
        "totalSeats": 25,
        "lastUpdated": datetime.utcnow().isoformat() + "Z",
        "status": "available" if seats_left > 0 else "sold_out"
    }
    
    SEATS_JSON_PATH.write_text(json.dumps(seats_data, indent=2, ensure_ascii=False))
    
    print(f"✅ seats.json обновлён:")
    print(f"   {json.dumps(seats_data, indent=2, ensure_ascii=False)}")
    print()
    
    # Коммитим и пушим
    print("📤 Коммит и push в Git...")
    
    import subprocess
    repo_path = SEATS_JSON_PATH.parent.parent
    
    subprocess.run(['git', 'add', 'chl/seats.json'], cwd=repo_path, check=True)
    
    commit_message = f"auto: обновление счётчика мест ({seats_left} свободно)"
    subprocess.run(['git', 'commit', '-m', commit_message], cwd=repo_path)
    
    subprocess.run(['git', 'push', 'origin', 'main'], cwd=repo_path, check=True)
    
    print("✅ Запушено на GitHub")
    print()
    print("="*80)
    print(f"ГОТОВО: {seats_left} мест свободно")
    print("="*80)
    
    return True

if __name__ == '__main__':
    sync_seats()

