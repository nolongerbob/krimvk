#!/usr/bin/env python3
"""Create a minimal Word template using raw XML to avoid placeholder fragmentation."""

import zipfile
from datetime import datetime

# Minimal document.xml with placeholders in single runs
document_xml = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:p><w:r><w:t xml:space="preserve">ЗАЯВЛЕНИЕ о выдаче технических условий</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">От: </w:t></w:r><w:r><w:t>{{FIO}}</w:t></w:r><w:r><w:t>, дата рождения </w:t></w:r><w:r><w:t>{{BirthDate}}</w:t></w:r><w:r><w:t>, паспорт </w:t></w:r><w:r><w:t>{{Passport}}</w:t></w:r><w:r><w:t>, ИНН </w:t></w:r><w:r><w:t>{{inn}}</w:t></w:r><w:r><w:t>, СНИЛС </w:t></w:r><w:r><w:t>{{snils}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>Адрес регистрации: </w:t></w:r><w:r><w:t>{{registration address}}</w:t></w:r></w:p>
<w:p><w:r><w:t>Почтовый адрес: </w:t></w:r><w:r><w:t>{{mail address}}</w:t></w:r></w:p>
<w:p><w:r><w:t>Телефон: </w:t></w:r><w:r><w:t>{{phone}}</w:t></w:r><w:r><w:t>, Email: </w:t></w:r><w:r><w:t>{{email}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>Прошу выдать технические условия для присоединения к централизованным системам водоснабжения и (или) водоотведения.</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>Основание обращения: </w:t></w:r><w:r><w:t>{{owner or trusted person}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>В связи с: </w:t></w:r><w:r><w:t>{{reason}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>Тип объекта: </w:t></w:r><w:r><w:t>{{object_type}}</w:t></w:r></w:p>
<w:p><w:r><w:t>Адрес объекта: </w:t></w:r><w:r><w:t>{{place address}}</w:t></w:r></w:p>
<w:p><w:r><w:t>Тип подключения: </w:t></w:r><w:r><w:t>{{type of connection}}</w:t></w:r></w:p>
<w:p><w:r><w:t>Необходимые виды ресурсов: </w:t></w:r><w:r><w:t>{{resourse_type}}</w:t></w:r></w:p>
<w:p><w:r><w:t>Информация об объекте: </w:t></w:r><w:r><w:t>{{object information}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>Планируемый срок ввода в эксплуатацию: </w:t></w:r><w:r><w:t>{{date_start}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t>Результат предоставления услуги прошу направить: </w:t></w:r><w:r><w:t>{{where to receive result}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">                                                          </w:t></w:r><w:r><w:t>{{fio}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">                                                          _______________(подпись)</w:t></w:r></w:p>
</w:body>
</w:document>'''

# Create a minimal .docx file
output_file = "public/documents/tu-template-minimal.docx"

with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as docx:
    # Add [Content_Types].xml
    docx.writestr('[Content_Types].xml', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>''')

    # Add _rels/.rels
    docx.writestr('_rels/.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>''')

    # Add word/document.xml
    docx.writestr('word/document.xml', document_xml)

    # Add word/_rels/document.xml.rels
    docx.writestr('word/_rels/document.xml.rels', '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>''')

print(f"✅ Minimal template created: {output_file}")
print(f"File size: {zipfile.ZipFile(output_file).fp.tell() if hasattr(zipfile.ZipFile(output_file), 'fp') else 'N/A'}")
