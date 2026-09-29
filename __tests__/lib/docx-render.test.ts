/** @jest-environment node */
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
it('renders DOCX placeholders and escapes XML after parser security update', () => {
  const zip = new PizZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', '<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{name}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>');
  const doc = new Docxtemplater(zip);
  doc.render({ name: 'Иван & Пётр <проверка>' });
  const xml = doc.getZip().file('word/document.xml')!.asText();
  expect(xml).toContain('Иван &amp; Пётр &lt;проверка&gt;');
  expect(xml).not.toContain('{name}');
});
