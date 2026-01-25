#!/usr/bin/env python3
"""
Склеивает разорванные плейсхолдеры {{...}} в шаблоне заявления на выдачу ТУ.
Запуск: python scripts/fix-zayavlenie-docx.py

Источник: zayavlenie-o-vydache-tehnicheskih-uslovij.docx в корне проекта.
Результат: public/documents/zayavlenie-o-vydache-tehnicheskih-uslovij_fixed.docx
(форма «Стать абонентом» использует файл из корня через /api/documents/zayavlenie;
_fixed — запасной вариант при ошибках XML).
"""
import zipfile
import re
from pathlib import Path

try:
    from lxml import etree
except ImportError:
    print("Установите lxml: pip install lxml")
    raise

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
# Источник — файл в корне (единый источник правды)
TEMPLATE = ROOT / "zayavlenie-o-vydache-tehnicheskih-uslovij.docx"
OUTPUT = ROOT / "public" / "documents" / "zayavlenie-o-vydache-tehnicheskih-uslovij_fixed.docx"

NAMESPACES = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}


def fix_placeholders(doc_xml: bytes) -> bytes:
    root = etree.fromstring(doc_xml)
    paragraphs = root.findall(".//w:p", NAMESPACES)
    fixes = 0

    for para in paragraphs:
        runs = para.findall(".//w:r", NAMESPACES)
        para_text = ""
        for run in runs:
            for t in run.findall(".//w:t", NAMESPACES):
                if t.text:
                    para_text += t.text

        if "{{" not in para_text and "}}" not in para_text:
            continue

        # Склеиваем разорванные плейсхолдеры: {{Name}{Name}} -> {{Name}} (Word разрывает по <w:r>)
        para_text = re.sub(r"\{\{([^}]+)\}\{\1\}\}", r"{{\1}}", para_text)

        placeholders = re.findall(r"\{\{[^}]+\}\}", para_text)
        if not placeholders:
            continue

        # Удаляем старые run'ы (run может быть внутри w:hyperlink и т.п. — убираем у родителя)
        for run in runs:
            parent = run.getparent()
            if parent is not None:
                parent.remove(run)

        current = para_text
        while current:
            m = re.search(r"\{\{[^}]+\}\}", current)
            if m:
                before, placeholder, after = current[: m.start()], m.group(0), current[m.end() :]
                if before:
                    _append_run(para, before)
                _append_run(para, placeholder)
                current = after
                fixes += 1
            else:
                if current:
                    _append_run(para, current)
                break

    return etree.tostring(root, xml_declaration=True, encoding="UTF-8", standalone=True)


def _append_run(para, text: str):
    run = etree.Element("{" + NAMESPACES["w"] + "}r")
    rpr = etree.SubElement(run, "{" + NAMESPACES["w"] + "}rPr")
    fonts = etree.SubElement(rpr, "{" + NAMESPACES["w"] + "}rFonts")
    fonts.set("{" + NAMESPACES["w"] + "}ascii", "Times New Roman")
    fonts.set("{" + NAMESPACES["w"] + "}hAnsi", "Times New Roman")
    t = etree.SubElement(run, "{" + NAMESPACES["w"] + "}t")
    t.text = text
    if text.startswith(" ") or text.endswith(" "):
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    para.append(run)


def main():
    if not TEMPLATE.exists():
        print(f"Файл не найден: {TEMPLATE}")
        return 1

    with zipfile.ZipFile(TEMPLATE, "r") as z:
        try:
            doc_xml = z.read("word/document.xml")
        except KeyError:
            print("В архиве нет word/document.xml")
            return 1

    new_xml = fix_placeholders(doc_xml)

    with zipfile.ZipFile(TEMPLATE, "r") as zip_in:
        with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as zip_out:
            for info in zip_in.infolist():
                if info.filename == "word/document.xml":
                    zip_out.writestr(info, new_xml)
                else:
                    zip_out.writestr(info, zip_in.read(info.filename))

    print(f"Готово: {OUTPUT}")
    print("Страница «Стать абонентом» сначала подхватит _fixed.docx. Если всё работает, можно заменить основной файл на _fixed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
