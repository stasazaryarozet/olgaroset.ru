#!/bin/bash
# Скрипт для push с повторными попытками и таймаутом

REPO_DIR="/Users/azaryarozet/Library/Mobile Documents/com~apple~CloudDocs/○/olga/olgaroset.ru"
MAX_ATTEMPTS=3
TIMEOUT=30

cd "$REPO_DIR" || exit 1

for i in $(seq 1 $MAX_ATTEMPTS); do
    echo "Попытка $i из $MAX_ATTEMPTS..."
    
    # Используем timeout через gtimeout (если установлен) или просто запускаем
    if command -v gtimeout &> /dev/null; then
        gtimeout $TIMEOUT git push origin main 2>&1
    else
        # Просто запускаем с ограничением времени через background процесс
        (git push origin main 2>&1) &
        PID=$!
        sleep $TIMEOUT
        if kill -0 $PID 2>/dev/null; then
            echo "Таймаут после ${TIMEOUT} секунд"
            kill $PID 2>/dev/null
            wait $PID 2>/dev/null
        else
            wait $PID
            exit $?
        fi
    fi
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✓ Push успешен!"
        exit 0
    elif [ $EXIT_CODE -eq 128 ]; then
        echo "Ошибка аутентификации. Проверьте credentials."
        exit 1
    else
        echo "Ошибка (код $EXIT_CODE). Повтор через 5 секунд..."
        sleep 5
    fi
done

echo "✗ Все попытки исчерпаны"
exit 1


