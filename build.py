#!/usr/bin/env python3
"""
Генерирует index.html из content.md
"""
import re
import time

# Генерируем версию на основе timestamp
VERSION = str(int(time.time()))

# Читаем content.md
with open('content.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Парсим Markdown вручную (простой парсер)
def parse_markdown(text):
    # Заголовки
    text = re.sub(r'^# (.+)$', r'<h1>\1</h1>', text, flags=re.MULTILINE)
    text = re.sub(r'^## (.+)$', r'<h2>\1</h2>', text, flags=re.MULTILINE)
    
    # Жирный текст
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    
    # Сноски в стиле Википедии [^1]
    text = re.sub(r'\[\^(\d+)\]', r'<sup><a href="#ref\1" class="wiki-ref">[\1]</a></sup>', text)
    
    # Определения сносок [^1]: текст
    text = re.sub(r'^\[\^(\d+)\]:\s*(.+)$', r'<p id="ref\1" class="footnote"><sup>[\1]</sup> \2</p>', text, flags=re.MULTILINE)
    
    # Ссылки
    text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2">\1</a>', text)
    
    # Голые URL (должны быть после обработки markdown-ссылок)
    # Убираем https:// из отображаемого текста
    def clean_url_display(match):
        url = match.group(1)
        display = url.replace('https://', '').replace('http://', '')
        return f'<a href="{url}">{display}</a>'
    
    text = re.sub(r'(?<!href=")(https?://[^\s<]+)', clean_url_display, text)
    
    # Параграфы и переносы
    lines = text.split('\n')
    result = []
    in_paragraph = False
    
    for line in lines:
        line = line.strip()
        
        if not line:
            if in_paragraph:
                result.append('</p>')
                in_paragraph = False
            continue
            
        if line == '---':
            if in_paragraph:
                result.append('</p>')
                in_paragraph = False
            result.append('<hr>')
            continue
            
        if line.startswith('<h'):
            if in_paragraph:
                result.append('</p>')
                in_paragraph = False
            result.append(line)
            continue
            
        if not in_paragraph:
            result.append('<p>')
            in_paragraph = True
        else:
            # Добавляем <br> между строками внутри параграфа
            result.append('<br>')
            
        result.append(line)
    
    if in_paragraph:
        result.append('</p>')
    
    return '\n'.join(result)

html_content = parse_markdown(content)

# Форма помощи с оплатой
help_form = '''
<form id="help-form" style="margin-top:1.5em;padding:1.5em;background:#fafafa;border-left:3px solid #E31B1B;max-width:28em">
  <div style="margin:1em 0">
    <label for="help-name" style="display:block;margin-bottom:0.5em">Имя</label>
    <input type="text" id="help-name" name="name" required style="width:100%;padding:0.7em;border:1px solid #e0e0e0;border-radius:3px;font-size:1em">
  </div>
  
  <div style="margin:1em 0">
    <label for="help-contact" style="display:block;margin-bottom:0.5em">Email или Telegram</label>
    <input type="text" id="help-contact" name="contact" required placeholder="email@example.com или @username" style="width:100%;padding:0.7em;border:1px solid #e0e0e0;border-radius:3px;font-size:1em">
  </div>
  
  <button type="submit" style="width:100%;padding:0.8em;background:#E31B1B;color:white;border:none;border-radius:3px;font-size:1em;cursor:pointer">Отправить</button>
  
  <div id="help-result" style="margin-top:1em;padding:0.8em;border-radius:3px;display:none"></div>
</form>
<script>
document.getElementById('help-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const result = document.getElementById('help-result');
  const formData = new FormData(e.target);
  
  btn.disabled = true;
  btn.textContent = 'Отправка...';
  
  try {
    const response = await fetch('https://formspree.io/f/xanygnaw', {
      method: 'POST',
      body: formData,
      headers: {'Accept': 'application/json'}
    });
    
    if (response.ok) {
      result.style.display = 'block';
      result.style.background = '#d4edda';
      result.style.color = '#155724';
      result.textContent = '✓ Отправлено! Ольга свяжется с вами.';
      e.target.reset();
    } else {
      throw new Error('Ошибка отправки');
    }
  } catch (error) {
    result.style.display = 'block';
    result.style.background = '#f8d7da';
    result.style.color = '#721c24';
    result.textContent = '✗ Ошибка. Напишите на o.g.rozet@gmail.com';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Отправить';
  }
});
</script>
'''

# Генерируем HTML
html = f'''<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="Ольга Розет — художник, искусствовед">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>Ольга Розет</title>
<style>
:root{{--text:#1a1a1a;--bg:#fff;--link:#000;--border:#e0e0e0;--focus:#0066cc}}
*{{margin:0;padding:0;box-sizing:border-box}}
html{{font:400 18px/1.7 -apple-system,BlinkMacSystemFont,system-ui,sans-serif;-webkit-text-size-adjust:100%;-webkit-font-smoothing:antialiased}}
body{{color:var(--text);background:var(--bg);max-width:38em;margin:0 auto;padding:4em 1.5em 2em;min-height:100vh;display:flex;flex-direction:column}}
main{{flex:1}}
h1{{font-size:1.8em;font-weight:400;margin-bottom:0.2em;letter-spacing:-0.01em}}
h2{{font-size:1.1em;font-weight:500;margin:3em 0 1em;padding-top:2em;border-top:1px solid var(--border)}}
p{{margin:0.8em 0}}
a{{color:var(--link);text-decoration:none;border-bottom:1px solid currentColor;transition:opacity .15s}}
a:hover{{opacity:0.6}}
a:focus-visible{{outline:2px solid var(--focus);outline-offset:2px}}
strong{{font-weight:500}}
footer{{margin-top:4em;padding-top:2em;border-top:1px solid var(--border);font-size:0.9em;color:#666}}
footer a{{color:#666;border-bottom-color:#ccc}}
.wiki-ref{{color:#0645ad;text-decoration:none}}
.wiki-ref:hover{{text-decoration:underline}}
.footnote{{font-size:0.9em;color:#666;margin-top:2em;padding-top:1em;border-top:1px solid var(--border)}}
.footnote sup{{margin-right:0.5em}}
@media(prefers-reduced-motion:reduce){{*{{animation:none!important}}}}
@media(max-width:600px){{html{{font-size:17px}}body{{padding:3em 1.2em 2em}}}}
</style>
</head>
<body>
<main>
{html_content}
{help_form}
</main>
<div id="footer"></div>
<script src="footer.js?v={VERSION}"></script>
</body>
</html>'''

# Записываем index.html
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print(f"✅ Сгенерирован index.html")
