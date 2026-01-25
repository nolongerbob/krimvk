#!/usr/bin/env python3
import zipfile
import re
from lxml import etree
import shutil
from datetime import datetime

def fix_word_template(input_file, output_file):
    """Fix all broken placeholder fields in a Word document."""

    # Create backup
    backup_file = f"{input_file}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(input_file, backup_file)
    print(f"Created backup: {backup_file}")

    # Open the DOCX file
    with zipfile.ZipFile(input_file, 'r') as zip_ref:
        # Read document.xml
        try:
            doc_xml = zip_ref.read('word/document.xml')
        except KeyError:
            print("Error: document.xml not found in the Word file")
            return False

    # Parse XML
    root = etree.fromstring(doc_xml)

    # Register namespaces
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    }

    # Find all text runs
    text_runs = root.findall('.//w:r', namespaces)

    # Collect all text to find placeholders
    full_text = ""
    for run in text_runs:
        for t in run.findall('.//w:t', namespaces):
            if t.text:
                full_text += t.text

    print(f"\nFull text length: {len(full_text)}")

    # Find all placeholder patterns in the full text
    placeholders = re.findall(r'\{\{[^}]+\}\}', full_text)
    print(f"\nFound {len(placeholders)} placeholders:")
    for p in sorted(set(placeholders)):
        print(f"  - {p}")

    # Strategy: Merge adjacent text runs and clean up placeholders
    # We'll process each paragraph separately
    paragraphs = root.findall('.//w:p', namespaces)

    fixes_made = 0

    for para in paragraphs:
        runs = para.findall('.//w:r', namespaces)

        # Build text from all runs in this paragraph
        para_text = ""
        for run in runs:
            for t in run.findall('.//w:t', namespaces):
                if t.text:
                    para_text += t.text

        # Check if this paragraph contains any placeholder parts
        if '{{' in para_text or '}}' in para_text:
            # This paragraph has placeholder content - let's rebuild it

            # Find all placeholders in this paragraph
            para_placeholders = re.findall(r'\{\{[^}]+\}\}', para_text)

            if para_placeholders:
                print(f"\nFixing paragraph with placeholders: {para_placeholders}")

                # Remove all existing runs
                for run in runs:
                    para.remove(run)

                # Create clean runs with proper placeholder structure
                # We'll split text into segments: before, placeholder, after
                current_text = para_text

                while current_text:
                    # Find next placeholder
                    match = re.search(r'\{\{[^}]+\}\}', current_text)

                    if match:
                        # Text before placeholder
                        before = current_text[:match.start()]
                        placeholder = match.group(0)
                        after = current_text[match.end():]

                        # Create run for text before (if any)
                        if before:
                            new_run = etree.Element('{%s}r' % namespaces['w'])
                            rpr = etree.SubElement(new_run, '{%s}rPr' % namespaces['w'])

                            # Add font
                            fonts = etree.SubElement(rpr, '{%s}rFonts' % namespaces['w'])
                            fonts.set('{%s}ascii' % namespaces['w'], 'Times New Roman')
                            fonts.set('{%s}hAnsi' % namespaces['w'], 'Times New Roman')

                            # Add text
                            t = etree.SubElement(new_run, '{%s}t' % namespaces['w'])
                            t.text = before
                            if before.startswith(' ') or before.endswith(' '):
                                t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')

                            para.append(new_run)

                        # Create run for placeholder
                        new_run = etree.Element('{%s}r' % namespaces['w'])
                        rpr = etree.SubElement(new_run, '{%s}rPr' % namespaces['w'])

                        # Add font
                        fonts = etree.SubElement(rpr, '{%s}rFonts' % namespaces['w'])
                        fonts.set('{%s}ascii' % namespaces['w'], 'Times New Roman')
                        fonts.set('{%s}hAnsi' % namespaces['w'], 'Times New Roman')

                        # Add underline if it looks like it should be underlined
                        if any(keyword in placeholder.lower() for keyword in ['fio', 'passport', 'email', 'phone', 'address', 'inn', 'snils']):
                            u = etree.SubElement(rpr, '{%s}u' % namespaces['w'])
                            u.set('{%s}val' % namespaces['w'], 'single')

                        # Add text - CRITICAL: placeholder must be in ONE text element
                        t = etree.SubElement(new_run, '{%s}t' % namespaces['w'])
                        t.text = placeholder

                        para.append(new_run)

                        current_text = after
                        fixes_made += 1
                    else:
                        # No more placeholders, add remaining text
                        if current_text:
                            new_run = etree.Element('{%s}r' % namespaces['w'])
                            rpr = etree.SubElement(new_run, '{%s}rPr' % namespaces['w'])

                            # Add font
                            fonts = etree.SubElement(rpr, '{%s}rFonts' % namespaces['w'])
                            fonts.set('{%s}ascii' % namespaces['w'], 'Times New Roman')
                            fonts.set('{%s}hAnsi' % namespaces['w'], 'Times New Roman')

                            # Add text
                            t = etree.SubElement(new_run, '{%s}t' % namespaces['w'])
                            t.text = current_text
                            if current_text.startswith(' ') or current_text.endswith(' '):
                                t.set('{http://www.w3.org/XML/1998/namespace}space', 'preserve')

                            para.append(new_run)

                        break

    print(f"\nMade {fixes_made} fixes")

    # Write back to DOCX
    new_doc_xml = etree.tostring(root, xml_declaration=True, encoding='UTF-8', standalone=True)

    # Create new DOCX file
    with zipfile.ZipFile(input_file, 'r') as zip_in:
        with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zip_out:
            for item in zip_in.infolist():
                if item.filename == 'word/document.xml':
                    zip_out.writestr(item, new_doc_xml)
                else:
                    zip_out.writestr(item, zip_in.read(item.filename))

    print(f"\nFixed template saved to: {output_file}")

    # Verify the fix
    print("\nVerifying fixes...")
    with zipfile.ZipFile(output_file, 'r') as zip_ref:
        doc_xml = zip_ref.read('word/document.xml')
        root = etree.fromstring(doc_xml)

        # Check for broken placeholders
        text_runs = root.findall('.//w:t', namespaces)
        all_text = "".join([t.text for t in text_runs if t.text])

        clean_placeholders = re.findall(r'\{\{[^}]+\}\}', all_text)
        print(f"Clean placeholders in output: {len(clean_placeholders)}")
        for p in sorted(set(clean_placeholders)):
            print(f"  ✓ {p}")

        # Check for fragmented placeholders
        fragmented = re.findall(r'\{\{[^}]*$|^[^{]*\}\}', all_text)
        if fragmented:
            print(f"\n⚠ Warning: Found {len(fragmented)} potentially fragmented placeholders:")
            for f in fragmented[:10]:
                print(f"  - {repr(f)}")
        else:
            print("\n✓ No fragmented placeholders found!")

    return True

if __name__ == "__main__":
    input_file = "public/documents/tu-template-1768982654.docx"
    temp_file = "public/documents/tu-template-1768982654_temp.docx"

    if fix_word_template(input_file, temp_file):
        # Replace original with fixed version
        import os
        os.replace(temp_file, input_file)
        print(f"\n✅ Successfully updated {input_file}")
