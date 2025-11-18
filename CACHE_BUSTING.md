# Защита от кеширования (Cache Busting)

## Проблема
Браузеры кешируют HTML, CSS и JS файлы, из-за чего пользователи могут видеть устаревшую версию сайта даже после обновления.

## Решение: Многоуровневая защита

### 1. HTML страницы (полный запрет кеширования)
```html
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
```

**Где применено:**
- `index.html` (генерируется через `build.py`)
- `/chl/index.html`

### 2. JavaScript файлы (версионирование)
```html
<script src="footer.js?v=1763488208"></script>
<script src="seats-counter.js?v=6"></script>
```

**Механизм:**
- `build.py` автоматически генерирует версию на основе timestamp: `VERSION = str(int(time.time()))`
- При каждом `build.py` версия обновляется автоматически
- Ручные файлы (например, `/chl/index.html`) используют ручную версию `?v=6`

### 3. Динамически загружаемые файлы
`footer.js` загружает `footer.html` с динамическим timestamp:
```javascript
const version = Date.now();
fetch(`/footer.html?v=${version}`)
```

## Как обновить после изменений

### Автоматически (для главной страницы):
```bash
cd olga/olgaroset.ru
python3 build.py
```

### Вручную (для `/chl/` и других статических страниц):
1. Увеличить версию в `?v=N`
2. Например: `?v=6` → `?v=7`

## Проверка
После обновления проверить:
1. Открыть сайт в режиме инкогнито
2. Или: DevTools → Network → Disable cache
3. Убедиться, что изменения видны

## Принцип
✅ HTML всегда загружается свежий (no-cache)  
✅ JS/CSS загружаются с новой версией при изменении  
✅ Пользователи всегда видят актуальную версию

