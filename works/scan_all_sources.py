#!/usr/bin/env python3
"""
Сканер всех источников работ Ольги Розет
Собирает картины и наброски из NAS, Google Drive, Instagram
"""

import os
import json
import yaml
from pathlib import Path
from PIL import Image
from PIL.ExifTags import TAGS
import subprocess
import hashlib

# Пути к источникам
SOURCES = {
    'nas_drawings': '/Volumes/OlgaWork/Мои рисунки/',
    'nas_collages': '/Volumes/OlgaWork/мои коллажи/',
    'nas_good_drawings': '/Volumes/OlgaWork/хорошие рисунки/',
    'nas_my_photos': '/Volumes/OlgaWork/мои фото/',
    'google_drive': '/Users/azaryarozet/Library/CloudStorage/GoogleDrive-o.g.rozet@gmail.com/My Drive/',
}

OUTPUT_DIR = Path(__file__).parent / 'images'
METADATA_FILE = Path(__file__).parent / 'works_metadata.yaml'
DISCOVERED_FILE = Path(__file__).parent / 'discovered_works.json'


def get_image_metadata(filepath):
    """Извлекает максимум метаданных из файла изображения"""
    metadata = {
        'filepath': str(filepath),
        'filename': filepath.name,
        'size_bytes': filepath.stat().st_size,
        'hash': None,
        'dimensions': None,
        'exif': {},
        'sips_metadata': {}
    }
    
    # MD5 хэш для идентификации дубликатов
    try:
        with open(filepath, 'rb') as f:
            metadata['hash'] = hashlib.md5(f.read()).hexdigest()
    except:
        pass
    
    # Размеры через PIL
    try:
        with Image.open(filepath) as img:
            metadata['dimensions'] = f"{img.width}×{img.height}"
            
            # EXIF данные
            exif = img.getexif()
            if exif:
                for tag_id, value in exif.items():
                    tag = TAGS.get(tag_id, tag_id)
                    if isinstance(value, (str, int, float)):
                        metadata['exif'][tag] = value
    except:
        pass
    
    # Метаданные через sips (macOS)
    try:
        result = subprocess.run(
            ['sips', '-g', 'all', str(filepath)],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if ':' in line and not line.startswith('/'):
                    key, value = line.split(':', 1)
                    metadata['sips_metadata'][key.strip()] = value.strip()
    except:
        pass
    
    # Метаданные через mdls (macOS Spotlight)
    try:
        result = subprocess.run(
            ['mdls', str(filepath)],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if 'kMDItem' in line and '=' in line:
                    parts = line.split('=', 1)
                    key = parts[0].strip()
                    value = parts[1].strip()
                    if key in ['kMDItemContentCreationDate', 'kMDItemCreator', 
                               'kMDItemAuthors', 'kMDItemCopyright', 'kMDItemComment']:
                        metadata['sips_metadata'][key] = value
    except:
        pass
    
    return metadata


def is_artwork(filepath, metadata):
    """Определяет, является ли файл работой Ольги"""
    filename = filepath.name.lower()
    
    # Явные работы из известных папок
    if 'Мои рисунки' in str(filepath) or 'мои коллажи' in str(filepath):
        return True
    
    # По метаданным
    if metadata.get('exif', {}).get('Artist') == 'olga':
        return True
    
    if metadata.get('sips_metadata', {}).get('creator') == 'olga':
        return True
    
    # По названию файла (эвристика)
    artwork_keywords = [
        'антиб', 'прованс', 'aldo', 'giulio', 'сутин', 'стенин',
        'акварель', 'портрет', 'пейзаж', 'набросок', 'коллаж'
    ]
    
    if any(kw in filename for kw in artwork_keywords):
        return True
    
    # Большие изображения из корня NAS (вероятно работы)
    if str(filepath).startswith('/Volumes/OlgaWork/') and \
       filepath.parent.name == 'OlgaWork' and \
       metadata['size_bytes'] > 200_000:  # > 200KB
        return True
    
    return False


def scan_source(source_name, source_path):
    """Сканирует источник на предмет работ"""
    if not os.path.exists(source_path):
        print(f"⚠️  {source_name}: недоступен ({source_path})")
        return []
    
    print(f"🔍 Сканирование {source_name}: {source_path}")
    
    discovered = []
    extensions = {'.jpg', '.jpeg', '.png', '.tif', '.tiff'}
    
    for root, dirs, files in os.walk(source_path):
        # Пропускаем служебные папки
        if any(skip in root for skip in ['_files', 'VITRA', 'Interior trends']):
            continue
            
        for filename in files:
            filepath = Path(root) / filename
            
            if filepath.suffix.lower() in extensions:
                try:
                    metadata = get_image_metadata(filepath)
                    
                    if is_artwork(filepath, metadata):
                        discovered.append({
                            'source': source_name,
                            'metadata': metadata
                        })
                        print(f"  ✓ {filepath.name}")
                except Exception as e:
                    print(f"  ✗ {filepath.name}: {e}")
    
    print(f"  Найдено: {len(discovered)}")
    return discovered


def scan_all_sources():
    """Сканирует все источники"""
    all_discovered = []
    
    for source_name, source_path in SOURCES.items():
        discovered = scan_source(source_name, source_path)
        all_discovered.extend(discovered)
    
    # Удаление дубликатов по хэшу
    unique_works = {}
    for work in all_discovered:
        hash_val = work['metadata'].get('hash')
        if hash_val and hash_val not in unique_works:
            unique_works[hash_val] = work
        elif not hash_val:
            # Если хэш не удалось получить, добавляем по пути
            path = work['metadata']['filepath']
            if path not in [w['metadata']['filepath'] for w in unique_works.values()]:
                unique_works[path] = work
    
    print(f"\n📊 Итого уникальных работ: {len(unique_works)}")
    
    # Сохранение результатов
    with open(DISCOVERED_FILE, 'w', encoding='utf-8') as f:
        json.dump(list(unique_works.values()), f, ensure_ascii=False, indent=2)
    
    print(f"💾 Результаты сохранены: {DISCOVERED_FILE}")
    
    return list(unique_works.values())


def generate_report(discovered_works):
    """Генерирует отчет о найденных работах"""
    report = f"""# Отчет: Обнаруженные работы Ольги Розет

**Дата сканирования:** {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')}  
**Всего найдено:** {len(discovered_works)} уникальных работ

## По источникам

"""
    
    by_source = {}
    for work in discovered_works:
        source = work['source']
        if source not in by_source:
            by_source[source] = []
        by_source[source].append(work)
    
    for source, works in sorted(by_source.items()):
        report += f"### {source}\n"
        report += f"**Работ:** {len(works)}\n\n"
        for work in works[:10]:  # Первые 10
            meta = work['metadata']
            report += f"- `{meta['filename']}` ({meta.get('dimensions', '?')})\n"
        if len(works) > 10:
            report += f"- ... и еще {len(works) - 10}\n"
        report += "\n"
    
    report += """## Следующие шаги

1. Проверить каждую работу вручную
2. Заполнить метаданные в `works_metadata.yaml`
3. Скопировать в максимальном качестве в `images/`
4. Регенерировать галерею
"""
    
    report_file = Path(__file__).parent / 'SCAN_REPORT.md'
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📄 Отчет создан: {report_file}")


if __name__ == '__main__':
    print("🎨 Сканер работ Ольги Розет\n")
    
    discovered = scan_all_sources()
    generate_report(discovered)
    
    print(f"\n✅ Готово!")
    print(f"\nПроверьте:")
    print(f"  - {DISCOVERED_FILE}")
    print(f"  - SCAN_REPORT.md")

