#!/bin/bash
# Надёжный скрипт для push с обработкой зависаний

REPO_DIR="/Users/azaryarozet/Library/Mobile Documents/com~apple~CloudDocs/○/olga/olgaroset.ru"
cd "$REPO_DIR" || exit 1

# Настройка credential helper через GitHub CLI
git config credential.helper '!gh auth git-credential'

# Настройка HTTP для более стабильной работы
git config http.version HTTP/1.1
git config http.postBuffer 1048576000

echo "Попытка push через GitHub CLI credential helper..."
echo "Коммитов для отправки: $(git log origin/main..HEAD --oneline | wc -l | tr -d ' ')"

# Запускаем push в фоне с таймаутом
(
    git push origin main 2>&1
    echo "EXIT_CODE:$?"
) &
PUSH_PID=$!

# Ждём максимум 60 секунд
for i in {1..60}; do
    if ! kill -0 $PUSH_PID 2>/dev/null; then
        # Процесс завершился
        wait $PUSH_PID
        EXIT_CODE=$?
        if [ $EXIT_CODE -eq 0 ]; then
            echo "✓ Push успешно завершён!"
            git status | head -3
            exit 0
        else
            echo "✗ Push завершился с ошибкой (код $EXIT_CODE)"
            exit $EXIT_CODE
        fi
    fi
    sleep 1
done

# Таймаут - убиваем процесс
echo "⚠ Таймаут после 60 секунд. Останавливаю процесс..."
kill $PUSH_PID 2>/dev/null
wait $PUSH_PID 2>/dev/null

echo ""
echo "Рекомендации:"
echo "1. Проверьте статус GitHub: https://www.githubstatus.com/"
echo "2. Убедитесь, что iCloud Drive завершил синхронизацию"
echo "3. Попробуйте позже или используйте веб-интерфейс GitHub"
echo ""
echo "Текущий статус:"
git status | head -5

exit 1

