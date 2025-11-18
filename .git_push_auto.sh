#!/bin/bash
# Автоматический push с обработкой ошибок GitHub

REPO_DIR="/Users/azaryarozet/Library/Mobile Documents/com~apple~CloudDocs/○/olga/olgaroset.ru"
cd "$REPO_DIR" || exit 1

# Настройка credential helper
git config credential.helper '!gh auth git-credential'

MAX_RETRIES=5
RETRY_DELAY=10

for i in $(seq 1 $MAX_RETRIES); do
    echo "Попытка $i из $MAX_RETRIES..."
    
    OUTPUT=$(git push origin main 2>&1)
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo "✓ Push успешно завершён!"
        git status | head -3
        exit 0
    fi
    
    # Проверяем тип ошибки
    if echo "$OUTPUT" | grep -q "503\|Service Unavailable"; then
        echo "⚠ GitHub временно недоступен (503). Жду ${RETRY_DELAY} секунд..."
        sleep $RETRY_DELAY
    elif echo "$OUTPUT" | grep -q "Empty reply\|HTTP2 framing"; then
        echo "⚠ Проблема с соединением. Жду ${RETRY_DELAY} секунд..."
        sleep $RETRY_DELAY
    else
        echo "✗ Ошибка:"
        echo "$OUTPUT"
        exit $EXIT_CODE
    fi
done

echo "✗ Все попытки исчерпаны. GitHub может быть перегружен."
echo "Попробуйте позже или используйте веб-интерфейс GitHub."
exit 1

